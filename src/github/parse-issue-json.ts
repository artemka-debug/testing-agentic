import type { NormalizedClosingPrRef, NormalizedGithubIssue } from "./types.js";

function asNonEmptyObject(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asStringArrayish(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Returns sorted top-level keys for DEBUG logging (no body/comments content).
 */
export function payloadTopLevelKeys(payload: unknown): string[] {
  const obj = asNonEmptyObject(payload);
  if (!obj) {
    return [];
  }
  return Object.keys(obj).sort((a, b) => a.localeCompare(b));
}

function normalizeClosingRef(entry: unknown): NormalizedClosingPrRef | null {
  const obj = asNonEmptyObject(entry);
  if (!obj) {
    return null;
  }
  const number = typeof obj.number === "number" ? obj.number : undefined;
  const url = asString(obj.url) ?? undefined;
  const id = asString(obj.id) ?? undefined;
  const repository = obj.repository;
  if (number === undefined && url === undefined && id === undefined) {
    return null;
  }
  return { id, number, url, repository };
}

function pickClosingRefs(obj: Record<string, unknown>): unknown[] {
  const modern = obj.closedByPullRequestsReferences;
  const legacy = obj.closingPullRequests;
  if (Array.isArray(modern)) {
    return modern;
  }
  if (Array.isArray(legacy)) {
    return legacy;
  }
  return [];
}

export type ParseIssueJsonResult =
  | { ok: true; value: NormalizedGithubIssue; raw: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Tolerant parse: never rejects due to unknown top-level JSON keys (FR-004).
 * Maps closing PR linkage from `closedByPullRequestsReferences`, with legacy `closingPullRequests` fallback (FR-002).
 */
export function parseGithubIssueJsonPayload(rawJson: string): ParseIssueJsonResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson) as unknown;
  } catch {
    return { ok: false, error: "Malformed JSON from gh (semantic)" };
  }

  const obj = asNonEmptyObject(parsed);
  if (!obj) {
    return { ok: false, error: "Issue JSON must be an object (semantic)" };
  }

  const number = obj.number;
  const title = obj.title;
  if (typeof number !== "number" || typeof title !== "string") {
    return {
      ok: false,
      error: 'Missing required issue fields: "number" (number) and "title" (string)',
    };
  }

  const closingPullRequests = pickClosingRefs(obj)
    .map(normalizeClosingRef)
    .filter((x): x is NormalizedClosingPrRef => x !== null);

  const value: NormalizedGithubIssue = {
    number,
    title,
    body: obj.body === null || obj.body === undefined ? null : asString(obj.body),
    state: obj.state == null ? null : asString(obj.state),
    url: obj.url == null ? null : asString(obj.url),
    createdAt: obj.createdAt == null ? null : asString(obj.createdAt),
    updatedAt: obj.updatedAt == null ? null : asString(obj.updatedAt),
    labels: asStringArrayish(obj.labels),
    assignees: asStringArrayish(obj.assignees),
    comments: asStringArrayish(obj.comments),
    closingPullRequests,
  };

  return { ok: true, value, raw: obj };
}
