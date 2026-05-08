---
name: local-worktree-implementer
description: >-
  Implement one workflow candidate in an isolated git worktree using the approved spec,
  decomposition, and candidate brief; capture artifacts and lightweight verification logs.
  Use after decomposition approval and when parallel best-of-N implementations are running.
---

# Local worktree implementer

## When to use

- Decomposition is approved (or gates waived) and **`implementation-briefs/<candidate-id>.md`** exists for this candidate.
- You are assigned a single candidate (for example `candidate-a`) and must work only in that candidate’s worktree and branch.
- The operator invoked **`hooks/scripts/create-worktree.sh`** (or equivalent) so the worktree path matches **`docs/state-layout.md`**.

## Preconditions

- **`human-approval-gates`** and **`implementation-agent-behavior`** rules apply.
- Read **`verification-plan.md`**, **`requirements.md`** / **`requirements.json`**, and this candidate’s brief end-to-end before editing code.
- Confirm **`state.json`** lists this candidate with correct `branch` and `worktree` paths after worktree creation.

## Worktree discipline

1. **Only** open terminals and editors rooted at the candidate worktree path (never the main tree for implementation commits).
2. Base branch is from `.cursor-agent-workflow.yaml` **`github.defaultBaseBranch`** unless the brief says otherwise.
3. Branch name follows **`docs/state-layout.md`** (`<branchPrefix>/<issue>-<slug>/<candidate-id>`).
4. Do not merge other candidates or rebase onto unrelated branches without operator approval.
5. Preserve unrelated history: no wide refactors outside the brief’s scope.

## Implementation flow

1. **Enter worktree** — `cd` to the path recorded in **`state.json`** for this candidate (or shown by `git worktree list`).
2. **Sync** — `git fetch` and ensure the branch tracks the intended base; resolve conflicts early with operator input if needed.
3. **Implement** — satisfy **`requirements.json`** items mapped in the brief; add or update tests as required by **`verification-plan.md`**.
4. **Self-check locally** — run the commands listed in the brief and/or config **`verification.commands`** that are feasible in the worktree (at minimum lint + unit when applicable).
5. **Document** — fill artifact files under **`.agent-workflows/<task-id>/candidates/<candidate-id>/`** (see Outputs).
6. **Repair loop** — if verifier returns **`repair-needed`**, address only cited findings and linked requirements; re-run targeted checks and refresh **`verification.log`** snippets.

## Using `/best-of-n` with worktrees

When the operator runs parallel Cursor attempts, each attempt must still map to **one** physical worktree and **one** candidate id. See **`docs/best-of-n.md`** for wrapping prompts and avoiding cross-candidate contamination.

## Resume and partial reruns

- Read **`.agent-workflows/<task-id>/state.json`** for `status`, `repairAttempts`, and verifier pointers.
- If status is **`repair-needed`**, continue from the same worktree branch; do not recreate the worktree unless **`hooks/scripts/create-worktree.sh`** failed partially and the operator asks for a reset.
- Append dated notes to **`summary.md`** rather than deleting prior operator context.

## Outputs (required)

Under **`.agent-workflows/<task-id>/candidates/<candidate-id>/`**:

| File | Purpose |
|------|---------|
| **`summary.md`** | What changed, key decisions, open risks, mapping to requirement IDs |
| **`changed-files.txt`** | One path per line, repo-relative (populate via `hooks/scripts/capture-candidate-summary.sh` or equivalent) |
| **`self-check.md`** | Commands run, results, known flakes or skips |
| **`verification.log`** | Captured stdout/stderr orPaths to log files for checks executed in the worktree |

Update **`state.json`**: candidate **`status`** → `implemented` when code is ready for verifier handoff; follow orchestrator transitions to `verifying` / `repair-needed`.

## Hooks and automation

- **`before-implementation-agent`** — typically **`create-worktree.sh`** (creates branch + worktree + artifact dirs).
- **`after-implementation-agent`** — **`capture-candidate-summary.sh`** refreshes **`changed-files.txt`** from git.

## Escalation

- Ambiguous requirements → stop and route back to PO / decomposition (do not guess scope).
- Worktree or **`gh`** failures → operator fixes environment; do not force-push over someone else’s branch.
- Merge conflicts with **`final`** or another candidate → escalate; do not cherry-pick silently across candidates without traceability.
