---
name: candidate-verifier
description: >-
  Run configured local verification commands, structured diff review, coverage-matrix generation,
  candidate ranking, and repair-ready findings for one or more implementation candidates (local workflow).
---

# Candidate verifier

## When to use

- Each candidate has **`summary.md`**, **`changed-files.txt`**, **`self-check.md`**, and **`verification.log`** populated (or you explicitly note gaps).
- **`verification-plan.md`** and **`.cursor-agent-workflow.yaml`** define which commands and browsers apply.
- You must classify candidates as **`accepted`**, **`repair-needed`**, or **`rejected`** before PR finalization.

## Preconditions

- **`verifier-agent-behavior`** and **`requirements-traceability`** rules apply.
- Worktrees remain reachable so diffs and logs can be reproduced locally.
- If **`verification.requireAllMustRequirementsCovered`** is true, no candidate may be **`accepted`** while any **`must`** requirement fails unless waived per **`human-approval-gates`**.

## Inputs

| Artifact | Use |
|----------|-----|
| **`requirements.json`** | Requirement IDs, priorities, acceptance criteria |
| **`decomposition.md`** | Scope boundaries and sequencing expectations |
| **`verification-plan.md`** | Methods per requirement and edge-case checklist |
| Candidate **`changed-files.txt`** | Diff scope routing |
| Candidate **`self-check.md`** / **`verification.log`** | Known flake / partial evidence |

## Stage A — Command verification runner

For **each** configured key under **`verification.commands`** (lint, typecheck, unit, integration, build, browser tests):

1. Run in the **candidate worktree** root using the consumer repo’s toolchain.
2. Capture stdout/stderr to **`.agent-workflows/<task-id>/verification/logs/<candidate-id>-<command>.log`** (or embed excerpts in the candidate **`verification.log`** when small).
3. Record **`pass|fail|skipped`** with exit codes and duration in **`verification/<candidate-id>.md`**.

Treat **`skipped`** only when the command is genuinely N/A (document rationale tied to requirement IDs).

## Stage B — Static inspection

Review the diff against **`implementation-agent-behavior`**:

- Scope creep, noisy refactors, missing tests for **must** requirements.
- Error handling, logging hygiene, dependency deltas, migration risk.

Document findings with **`severity`** (`blocking|major|minor|nit`), optional **`requirementId`**, and actionable **`repairInstruction`** fields matching **`docs/plan.md`** §9 schema.

## Stage C — Coverage matrix generator

Write / update **`.agent-workflows/<task-id>/verification/coverage-matrix.md`**:

- One row per **`requirements.json`** entry showing implementation files, tests, verification methods, and **`pass|fail|waived|n/a`** per dimension.
- **`must`** rows **must not** remain **`fail`** without explicit waiver notes.

## Stage D — PO acceptance and security hooks

- Invoke **`po-acceptance-checker`** reasoning for user-visible behavior (inline section inside **`verification/<candidate-id>.md`** or separate artifact reference).
- Invoke **`security-reviewer`** reasoning; merge summarized **`security`** block into the same verifier output JSON-shaped markdown.

## Stage E — Candidate ranking and selection logic

Write **`.agent-workflows/<task-id>/verification/ranking.md`** comparing candidates on:

1. **`must`** requirement coverage and test strength  
2. Simplicity / maintainability vs risk  
3. Regression and UX risk  
4. Security posture summary  

Then write **`.agent-workflows/<task-id>/verification/final-recommendation.md`** naming:

- **`recommendedWinner`** candidate id  
- **`runnerUp`** notes  
- **`repair`** backlog grouped by candidate  

Ranking must remain reproducible from logs on disk.

## Repair loop policy (prompt-ready)

When **`repair-needed`**:

1. Copy **`findings`** verbatim into the orchestrator message for **`local-worktree-implementer`** for that candidate only.
2. Increment **`repairAttempts`** in **`state.json`**; respect **`implementation.maxRepairAttemptsPerCandidate`**.
3. After fixes, re-run **failed commands first**, then full matrix if time allows.

When **`rejected`**:

1. Record rationale and freeze branch unless operator deletes worktree.
2. Exclude from **`final-recommendation`** unless human overrides.

## Outputs

| Path | Description |
|------|-------------|
| **`verification/<candidate-id>.md`** | Per-candidate report + embedded JSON summary |
| **`verification/coverage-matrix.md`** | Requirement × verification grid |
| **`verification/ranking.md`** | Comparative scoring narrative |
| **`verification/final-recommendation.md`** | Winner + rationale |

## Escalation

- Commands cannot run locally (missing toolchain) → operator installs deps or marks **`skipped`** with waiver.
- Conflicting **`must`** requirements → stop workflow (`hard stop` per **`docs/plan.md`** §15).
- Evidence insufficient for browser-heavy **`must`** → downgrade recommendation to **`repair-needed`**, not silent **`accept`**.
