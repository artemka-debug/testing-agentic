---
name: pr-monitor-manager
description: >-
  Poll GitHub PR checks and review comments, classify feedback, apply safe auto-fixes locally,
  re-verify, push follow-ups, or escalate ambiguous product/security/architecture questions (local workflow).
---

# PR monitor manager

## When to use

- **`state.json`** shows **`pr-created`** and **`prMonitor.enabled`** is **`true`** **or** operator invoked **`hooks/scripts/start-pr-monitor.sh`** / explicit `/agent-workflow monitor-pr`.
- CI failures or human review comments appear post-push.
- Auto-fix policy allows narrowly scoped mechanical fixes without product redesign.

## Preconditions

- Internalize **`pr-monitor-behavior`** rule file.
- Local checkout tracks **`final`** / PR head branch with push permissions.
- **`workflow-local-only`** — polling uses **`gh`** locally.

## Poll cadence & inputs

Respect **`prMonitor.intervalSeconds`** / **`maxDurationMinutes`** from config defaults unless overridden.

Primary pulls:

```bash
gh pr view <pr> --json title,body,state,reviewDecision,comments,reviews,latestReviews,headRefName,statusCheckRollup
gh pr checks <pr>
gh api repos/<owner>/<repo>/pulls/<number>/comments
gh api repos/<owner>/<repo>/issues/<number>/comments
```

Cache timestamps under **`.agent-workflows/<task-id>/logs/pr-monitor/`** to avoid repeating unchanged commentary.

## Classification taxonomy (`docs/plan.md` §13)

Each inbound signal becomes exactly one label:

| Class | Examples | Default policy |
|-------|----------|----------------|
| **Clear code fix** | typo, type error, missing null guard | Auto-fix if enabled |
| **Test failure** | flaky vs deterministic — investigate logs | Auto-fix deterministic tests when enabled |
| **Formatting/lint** | prettier/eslint | Auto-fix when **`prMonitor.autoFix.lint`** |
| **Product ambiguity** | reviewer asks open-ended UX question | Escalate unless waiver |
| **Architecture disagreement** | deeper refactor request | Escalate |
| **Security concern** | new attack vector | Escalate; apply fixes only when obvious |
| **Needs human words** | policy/legal/copy approval | Escalate |

Mirror **`docs/plan.md`** `prMonitor.autoFix` structure mentally — only automate subsets explicitly trusted.

## Auto-fix execution loop

1. Implement minimal patch locally on PR branch worktree.
2. Run targeted **`verification.commands`** (expand if touching shared utilities).
3. **`check-no-secrets.sh`** on staged diff before push when touching secrets-prone areas.
4. Push commit with traceable message referencing review thread / check name.
5. Summarize action in PR comment **only** when useful (avoid noisy bots unless maintainer expects acknowledgments).

Stop conditions: merge, closed PR, timeout, operator interrupt, or classification budget exhausted.

## Escalation checklist

Escalate immediately when:

- Request changes behavior surfaced to end users without spec linkage.
- Touches auth/permissions/data migrations without approved **`REQ-*`** mapping.
- CI failure cannot be reproduced locally after credible attempt (document commands tried).

## Outputs & telemetry

- Append chronology to **`.agent-workflows/<task-id>/logs/pr-monitor/timeline.md`** (timestamp, actor, classification, action).
- Feed summarized metrics stub lines into **`docs/metrics.md`** guidance file when operators aggregate stats manually.

## Relationship to hooks

- **`on-pr-comment-or-ci-failure`** may delegate classification stub → expand into orchestrator prompt referencing this skill.

Do **not** auto-merge unless maintainers explicitly codify that policy outside this template package.
