---
name: browser-verifier
description: >-
  Execute local browser verification (Cursor browser tooling or repo e2e commands), capture evidence,
  and tie observations to requirement IDs per workflow config (local workflow).
---

# Browser verifier

## When to use

- **`verification.browser.enabled`** is **`true`** **or** **`verification.commands.browser`** is defined and relevant to **`must`** UI requirements.
- PO acceptance or verifier stages flagged UI / routing / client-state risk.
- Operator can supply a reachable **`verification.browser.url`** (local dev server or preview).

## Preconditions

- Respect **`workflow-local-only`** — use **local** browser tooling (Cursor MCP browser or locally launched Playwright/Cypress as configured).
- **`implementation-agent-behavior`** — stay inside scoped flows; do not flip unrelated feature flags.
- Capture artifacts under **`.agent-workflows/<task-id>/verification/`** or candidate logs per **`artifacts.keepBrowserScreenshots`**.

## Execution modes

| Mode | Steps |
|------|-------|
| **Repo command** | Run **`verification.commands.browser`** (e.g. `pnpm test:e2e`) inside candidate worktree; save logs under **`verification/logs/`**. |
| **Guided manual / MCP** | Start **`verification.browser.devServerCommand`** when needed, navigate **`verification.browser.url`**, follow **`verification-plan.md`** browser scenarios. |

Always snapshot before structural interactions when using MCP browser tools; capture console errors and failed network requests in notes.

## Evidence bundle

For each scenario record:

- URLs visited and primary assertions tied to **`REQ-*`** IDs  
- Screenshots or textual descriptions (loading / empty / error states)  
- Console + network anomalies  
- Flake retries (document count)

Write **`verification/browser-<candidate-id>.md`** summarizing PASS/FAIL per scenario.

## PASS / FAIL rules

- FAIL if any **`must`** acceptance criterion is visually or behaviorally unmet.
- PASS only when evidence explicitly maps criterion → observation.
- **`not-applicable`** rows still need rationale in **`coverage-matrix.md`**.

## Integration with other skills

- **`candidate-verifier`** aggregates browser PASS/FAIL into **`verification/<candidate-id>.md`**.
- **`po-acceptance-checker`** may cite browser evidence verbatim — avoid duplicate contradictory narratives.

## Escalation

- Cannot start dev server → document blocker; downgrade candidate to **`repair-needed`** if **`must`** UI paths remain unproven.
- Authentication walls → request operator-provided test account or waiver; do not bypass legal protections.
