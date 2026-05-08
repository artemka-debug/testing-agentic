# Coverage matrix — gh-1-basic-application-setup

| Requirement | candidate-a | candidate-b | candidate-c | Evidence |
|-------------|-------------|-------------|-------------|----------|
| REQ-001 | pass / covered | pass / covered | pass / covered | `backend/` Nest scripts; logs in `verification/logs/*-verify-all.log` |
| REQ-002 | pass / covered | pass / covered | pass / covered | `docker-compose.yml`; e2e uses live DB |
| REQ-003 | pass / covered | pass / covered | pass / covered | `HealthController` + TypeORM; e2e GET /health |
| REQ-004 | pass / covered | pass / covered | pass / covered | Swagger + e2e `/api-json` |
| REQ-005 | pass / covered | pass / covered | pass / covered | `pnpm run test:e2e` in verifier logs |

All **must** rows: **pass / covered**.
