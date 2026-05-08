# Decomposition — gh-1-basic-application-setup

## Order of work

1. Add `docker-compose.yml` (Postgres 16, volume, documented env).
2. Scaffold `backend/` Nest app with ConfigModule + TypeORM postgres async factory.
3. Implement `GET /health` using `DataSource.query('SELECT 1')` and Swagger tags.
4. Unit test health controller with mocked DataSource.
5. `test/app.e2e-spec.ts`: boot app, assert `/health` and OpenAPI JSON route.
6. Root `README.md`: how to run compose, backend, and e2e.

## Candidate strategies (best-of-3)

| Candidate | Focus |
|-----------|--------|
| **candidate-a** | Minimal footprint: smallest readable surface, essential tests only. |
| **candidate-b** | Test-first: stronger unit coverage (module/controller matrix) without scope creep. |
| **candidate-c** | Robustness: validate required env at startup, optional defensive error mapping on health. |

## Risks

- E2E depends on Postgres; document prerequisite or `docker compose up -d`.
