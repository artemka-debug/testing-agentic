# Requirements — Issue #1

## Goal

Deliver a minimal but production-shaped backend skeleton: NestJS application, Docker Compose PostgreSQL, TypeORM connectivity, OpenAPI (Swagger) surface, and automated integration tests that prove DB reachability.

## Non-functional

- Local verification must run via `pnpm` in `backend/` per `.cursor-agent-workflow.yaml`.
- Keep secrets out of VCS; document env vars in `.env.example`.

## Open questions

None blocking for initial scaffold.
