## testing-agentic (impl-01 worktree)

Minimal package implementing **GitHub issue intake** via `gh issue view --json`, with tolerant JSON parsing so additive `gh`/GitHub fields (for example legacy `closingPullRequests` or unknown future keys) do not fail intake.

Implements [GitHub issue #1](https://github.com/artemka-debug/testing-agentic/issues/1): restore reliable parsing when `gh` output includes fields such as `closedByPullRequestsReferences` or unexpected top-level keys.

### Requirements / verification

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

### `gh` usage (FR-007)

Minimum tested CLI: **GitHub CLI 2.92.x** (field list sourced from `gh issue view --json` with no field arguments).

`projectCards` is intentionally omitted from the comma-separated list: requesting it can make `gh` exit non-zero on repositories where classic Projects triggers GraphQL deprecation errors.

Exact invocation used by this library:

```bash
gh issue view <issue-number> --repo <owner/repo> --json assignees,author,body,closed,closedAt,closedByPullRequestsReferences,comments,createdAt,id,isPinned,labels,milestone,number,projectItems,reactionGroups,state,stateReason,title,updatedAt,url
```

**Live JSON shape note:** Current `gh` exposes closing-PR linkage as `closedByPullRequestsReferences` (not `closingPullRequests`). The parser accepts either key for backward compatibility.

### Optional live smoke test

```bash
GITHUB_INTAKE_LIVE=1 npm test
```

Skips by default when `GITHUB_INTAKE_LIVE` is unset.
