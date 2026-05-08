## Summary

Add a NestJS 10 REST API scaffold under **`backend/`** with PostgreSQL **Docker Compose**, **Swagger / OpenAPI** documentation, runtime **PostgreSQL connectivity** (`TypeORM`), and **`pnpm`**-driven lint/unit/e2e checks. Addresses issue #1: basic app setup including DB provisioning and integration tests.

Closes #1

## Requirements Coverage

- **REQ-001:** `backend/` Nest project, scripts — `pnpm run build`, logs in `verification/logs/candidate-a-build.log`
- **REQ-002:** Swagger — `SwaggerModule.setup('api', ...)`, `/api-json` asserted in `backend/test/app.e2e-spec.ts`
- **REQ-003:** `docker-compose.yml` — Postgres image + volume; manual `docker compose up -d`
- **REQ-004:** `backend/src/app.module.ts` TypeORM Postgres + `/health` `SELECT 1` in `health.controller.ts`
- **REQ-005:** `backend/test/*.e2e-spec.ts`, `pnpm run test:e2e` logs
- **REQ-006:** `verification/security-summary.md` + `verification/logs/security-audit.log`

## Verification

| Check | Result |
|-------|--------|
| Lint | pass |
| Typecheck | pass |
| Unit tests | pass |
| Integration tests | pass (`pnpm test:e2e`) |
| Browser verification | waived (API-only) |
| Security review | pass (moderate/low residual — see summary) |
| PO acceptance | pass |

## Test Plan

```bash
docker compose up -d
cd backend
pnpm install
pnpm run lint
pnpm exec tsc --noEmit -p tsconfig.build.json
pnpm run test
pnpm run test:e2e
pnpm run build
pnpm audit
```

Swagger UI: run `pnpm run start:dev` then browse `http://localhost:3000/api`.

## Risks

TypeORM **`synchronize: true`** suits local bootstrap only — replace with migrations before production workloads.

## Security Notes

See `verification/security-summary.md` and `pnpm audit` log; `pnpm.overrides` clear prior high transitive issues from default Nest 10 scaffold.

## Artifacts

- `.agent-workflows/gh-1-basic-application-setup/verification/logs/`
- `.agent-workflows/gh-1-basic-application-setup/verification/coverage-matrix.md`
- `.agent-workflows/gh-1-basic-application-setup/verification/security-summary.md`
