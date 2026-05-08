# Verification plan — gh-1-basic-application-setup

## Preconditions

- Docker Compose database running locally for integration/e2e.
- Node 18+ and pnpm available.

## Per-requirement mapping

| REQ-ID  | Lint | Unit | Integration (e2e) | Build | Browser | Manual |
|---------|------|------|-------------------|-------|---------|--------|
| REQ-001 | ✓    | ✓    | ✓                 | ✓     | waived  |        |
| REQ-002 | ✓    |      | ✓                 | ✓     | waived  |        |
| REQ-003 |      |      | ✓                 |       | waived  | compose |
| REQ-004 | ✓    |      | ✓                 | ✓     | waived  |        |
| REQ-005 | ✓    |      | ✓                 |       | waived  |        |
| REQ-006 |      |      |                   |       | waived  | audit  |

Browser checks are waived (`.cursor-agent-workflow.yaml` `verification.browser.enabled: false`).

## Edge cases

- DB down → e2e should fail with actionable message.
- Missing env vars → bootstrap should fail-fast (ConfigModule).
