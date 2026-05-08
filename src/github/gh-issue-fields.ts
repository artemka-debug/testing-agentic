/**
 * Fields passed to `gh issue view --json <fields>` for issue intake.
 * Sourced from `gh issue view --json` (no args) on gh 2.92.x, minus `projectCards` (can fail on classic Projects deprecation).
 */
export const GH_ISSUE_VIEW_JSON_FIELDS = [
  "assignees",
  "author",
  "body",
  "closed",
  "closedAt",
  "closedByPullRequestsReferences",
  "comments",
  "createdAt",
  "id",
  "isPinned",
  "labels",
  "milestone",
  "number",
  "projectItems",
  "reactionGroups",
  "state",
  "stateReason",
  "title",
  "updatedAt",
  "url",
] as const;

export type GhIssueViewJsonField = (typeof GH_ISSUE_VIEW_JSON_FIELDS)[number];
