# Verification plan

| REQ | Lint | Typecheck | Unit | Integration (e2e) | Build | Manual |
|-----|------|-----------|------|---------------------|-------|--------|
| REQ-001 | ✓ | ✓ | ✓ | — | ✓ | — |
| REQ-002 | — | — | — | ✓ (implicit via e2e) | — | ✓ compose file |
| REQ-003 | — | ✓ | ✓ | ✓ | — | — |
| REQ-004 | — | ✓ | — | ✓ | — | — |
| REQ-005 | — | ✓ | — | ✓ | — | — |

**Prerequisite:** `docker compose up -d` from repo root before `pnpm run test:e2e`.

**Repair loop:** fix failing command output first; update `coverage-matrix.md` after each verifier pass.
