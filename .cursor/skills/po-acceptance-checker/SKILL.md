---
name: po-acceptance-checker
description: >-
  Product-owner acceptance pass: validate observable behavior, UX states, and closure readiness per
  requirement IDs — not syntax-only or reviewer preference (local workflow).
---

# PO acceptance checker

## When to use

- **`requirements.md`** / **`requirements.json`** exists with stable **`REQ-*`** IDs.
- Candidate implementation claims readiness (`implemented` → `verifying`).
- UI-facing work exists OR issue closure depends on user-visible behavior validation.

## Preconditions

- Read **`implementation-agent-behavior`** (scope) and **`requirements-traceability`** (IDs).
- Prefer verifying from **candidate worktree** at runtime (branch HEAD), not only static diff reads.
- **`verification.browser`** config informs whether browser evidence is mandatory.

## Responsibilities (contract-first)

Per **`docs/plan.md`** §10:

1. Treat **`requirements.json`** as the contract — not issue chatter unless traced via **`source`** fields.
2. Validate **observable behavior**, including unhappy paths:
   - Loading, empty, error, success  
   - Permission denied / auth expiry flows where applicable  
   - Offline / retry UX where applicable  
3. Confirm copy, routing, and feature flags match spec-derived **`acceptanceCriteria`**.
4. Decide whether merging closes the GitHub issue without embarrassment (`issue-close-ready` judgment).

## Evidence discipline

For each requirement produce PO-style statements:

```text
REQ-001: PASS | FAIL | PARTIAL
Evidence: <tests run, browser routes checked, code paths cited>
Gaps: <explicit missing behaviors>
Repair brief: <single paragraph implementer instructions when FAIL/PARTIAL>
```

PARTIAL is allowed only when **`priority`** is **`should`** or **`could`** **and** **`gates`** document waiver — otherwise FAIL **`must`** items.

## UX checklist (non-exhaustive)

- Forms: whitespace-only input, duplicate submits, disabled vs loading states.
- Tables/lists: empty dataset presentation.
- Async data: stale-while-revalidate flashes, error toast vs silent failure.
- Accessibility smoke: focus order on critical dialogs (when in scope).

## Outputs

Embed findings in **`verification/<candidate-id>.md`** under `## PO acceptance`, **and/or** maintain **`verification/po-acceptance.md`** when comparing candidates side-by-side.

Always reference **`REQ-*`** IDs; never paraphrase IDs loosely.

## Gates

- Any **`must`** FAIL blocks **`accepted`** classification by verifier unless human waiver recorded in **`state.json`** / **`coverage-matrix.md`**.
- When browser verification is mandatory per config, absent browser evidence for UI **`must`** rows ⇒ FAIL unless waived.

## Escalation

- Contradictory acceptance criteria → freeze and route back to **`po-spec-writer`** / human.
- Cannot reproduce issue locally → document environment gaps; do not invent PASS.
