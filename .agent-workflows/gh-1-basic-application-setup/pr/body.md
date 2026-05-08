## Summary

Adds a NestJS 10 backend under `backend/` with TypeORM (PostgreSQL), Swagger/OpenAPI (`/api` + `/api-json`), and Docker Compose for a local database. Health checks prove database connectivity; Jest e2e covers the happy path with a real Postgres instance. **Winner:** best-of-3 candidate-c (503 + structured body on DB outages).

Closes #1

## Requirements Coverage

- REQ-001: Covered by `backend/` Nest scaffold, `pnpm run build` / `lint` in verifier logs
- REQ-002: Covered by `docker-compose.yml` + e2e connectivity
- REQ-003: Covered by `src/health/health.controller.ts` + TypeORM `DataSource`
- REQ-004: Covered by Swagger bootstrap in `src/main.ts` + e2e `/api-json`
- REQ-005: Covered by `backend/test/app.e2e-spec.ts` + `pnpm run test:e2e`

## Verification

| Check | Result |
|-------|--------|
| Lint | pass |
| Typecheck | pass |
| Unit tests | pass (2 health specs on winner) |
| Integration tests | pass (`test:e2e` vs live Postgres) |
| Browser verification | waived (API-only) |
| Security review | pass — no highs on `pnpm audit` (see security summary) |
| PO acceptance | pass |

## Test Plan

```bash
docker compose up -d
cd backend && pnpm install && pnpm run lint && pnpm exec tsc --noEmit -p tsconfig.build.json
pnpm run test && pnpm run test:e2e && pnpm run build
```

## Risks

- E2E requires Postgres on `localhost:5432` (see `README.md`). CI should start a service container accordingly.

## Security Notes

See `.agent-workflows/gh-1-basic-application-setup/verification/security-summary.md` — moderate/low transitive devDependencies only.

## Artifacts

- `.agent-workflows/gh-1-basic-application-setup/verification/coverage-matrix.md`
- `.agent-workflows/gh-1-basic-application-setup/verification/final-recommendation.md`
- `.agent-workflows/gh-1-basic-application-setup/verification/logs/*-verify-all.log`
