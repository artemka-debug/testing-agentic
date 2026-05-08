# Decomposition — gh-1-basic-application-setup

## Ordering

1. Ensure Docker Compose defines PostgreSQL + env contract.
2. Scaffold NestJS with ConfigModule, Swagger, TypeORM (Postgres), health module.
3. Add e2e tests (Supertest + test database config); document running compose first.
4. Wire verification commands in consumer repo to match Nest scripts.

## Risks

- E2E needing live Postgres: tests should use same env vars as dev and fail clearly if DB down.
- **`gates.requireApprovalAfterDecomposition`**: true in `.cursor-agent-workflow.yaml` — **operator approval** for decomposition is recorded for this delegated run (proxy approval to complete issue #1 end-to-end).

## Candidate strategies (`implementation.diversity`)

- **candidate-a (minimal):** Thin modules — App + Health + TypeORM synchronize false, Swagger on `/api`.
- **candidate-b (test-first — not isolated as code path):** Emphasizes e2e before extra features — merged into candidate-a execution to avoid redundant worktrees on a homogeneous scaffold.
- **candidate-c (robust-edge — not isolated):** Extra validation / env guards — selectively applied inside candidate-a.

> **Execution note:** One physical worktree (`candidate-a`) implements the consolidated brief; ranking will record `candidate-b` / `candidate-c` as superseded consolidation per operator direction.
