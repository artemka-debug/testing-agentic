import type { IntakeFailureKind } from "./errors.js";

const RESOLVE_ISSUE_MARKERS = /Could not resolve to an issue or pull request/i;
const NOT_FOUND_MARKERS = /not found|404/i;

export function classifyGhFailure(stderr: string, stdout: string): IntakeFailureKind {
  const combined = `${stderr}\n${stdout}`.trim();

  if (RESOLVE_ISSUE_MARKERS.test(combined) || NOT_FOUND_MARKERS.test(combined)) {
    return "business";
  }

  if (
    /authentication failed|not logged in|gh auth login|HTTP 401|HTTP 403/i.test(
      combined,
    )
  ) {
    return "business";
  }

  return "transport";
}
