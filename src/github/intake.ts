import { classifyGhFailure } from "./classify-gh-failure.js";
import { IntakeError, ISSUE_INTAKE_DEGRADED_STUB } from "./errors.js";
import { parseGithubIssueJsonPayload, payloadTopLevelKeys } from "./parse-issue-json.js";
import { runGhIssueViewJson } from "./run-gh-issue-view.js";
import type { NormalizedGithubIssue } from "./types.js";

export type IntakeLogger = {
  info?: (msg: string, meta?: Record<string, unknown>) => void;
  debug?: (msg: string, meta?: Record<string, unknown>) => void;
};

export type GithubIssueIntakeArgs = {
  repo: string;
  issueNumber: number;
  ghPath?: string;
  logger?: IntakeLogger;
};

export type GithubIssueIntakeResult =
  | { ok: true; issue: NormalizedGithubIssue }
  | { ok: false; error: IntakeError; userMessage: string };

/**
 * Fetches and normalizes a GitHub issue via `gh issue view --json …`.
 *
 * - Unknown top-level JSON keys do not fail intake (FR-004).
 * - Closing PR refs read from `closedByPullRequestsReferences` with `closingPullRequests` legacy alias (FR-002).
 * - Transport vs semantic vs business failures are distinguished (FR-003).
 */
export async function intakeGithubIssue(
  args: GithubIssueIntakeArgs,
): Promise<GithubIssueIntakeResult> {
  args.logger?.info?.("github.issue_intake.start", {
    repo: args.repo,
    issueNumber: args.issueNumber,
  });

  let stdout: string;
  let stderr: string;
  let exitCode: number;

  try {
    const res = await runGhIssueViewJson({
      repo: args.repo,
      issueNumber: args.issueNumber,
      ghPath: args.ghPath,
    });
    stdout = res.stdout;
    stderr = res.stderr;
    exitCode = res.exitCode;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    args.logger?.info?.("github.issue_intake.failed", {
      repo: args.repo,
      issueNumber: args.issueNumber,
      kind: "transport",
    });
    const error = new IntakeError(
      "transport",
      `Failed to execute gh: ${message}. Is gh installed and on PATH?`,
    );
    return { ok: false, error, userMessage: formatUserStub(error) };
  }

  if (exitCode !== 0) {
    const label = `issue ${args.issueNumber} (${args.repo})`;
    const kind = classifyGhFailure(stderr, stdout);
    const base = `gh exited with code ${exitCode} for ${label}`;
    const detail = stderr.trim() ? `: ${stderr.trim()}` : "";

    let message: string;
    if (kind === "business") {
      message = `${base}${detail}. If this is private, verify \`gh auth status\` and repository access.`;
    } else {
      message = `${base}${detail}. Check gh installation, network, and rate limits. Try \`gh auth login\` if auth failed.`;
    }

    args.logger?.info?.("github.issue_intake.failed", {
      repo: args.repo,
      issueNumber: args.issueNumber,
      kind,
    });
    const error = new IntakeError(kind, message);
    return { ok: false, error, userMessage: formatUserStub(error) };
  }

  const parsed = parseGithubIssueJsonPayload(stdout);
  if (!parsed.ok) {
    args.logger?.info?.("github.issue_intake.failed", {
      repo: args.repo,
      issueNumber: args.issueNumber,
      kind: "semantic",
    });
    const label = `issue ${args.issueNumber} (${args.repo})`;
    const error = new IntakeError(
      "semantic",
      `${parsed.error} (${label}). Raw gh output was not valid issue JSON.`,
    );
    return { ok: false, error, userMessage: formatUserStub(error) };
  }

  args.logger?.debug?.("github.issue_intake.payload_keys", {
    repo: args.repo,
    issueNumber: args.issueNumber,
    keys: payloadTopLevelKeys(parsed.raw),
  });
  args.logger?.info?.("github.issue_intake.ok", {
    repo: args.repo,
    issueNumber: args.issueNumber,
  });

  return { ok: true, issue: parsed.value };
}

function formatUserStub(err: IntakeError): string {
  if (err.kind === "semantic" || err.kind === "business") {
    return formatUserFacing(err);
  }
  return `${formatUserFacing(err)} (${ISSUE_INTAKE_DEGRADED_STUB})`;
}

function formatUserFacing(err: IntakeError): string {
  return `[${err.kind}] ${err.message}`;
}
