# Implementation brief — candidate-a (minimal consolidated)

## Scope

Implement REQ-001–REQ-005 in the assigned worktree on branch `agent/1-basic-application-setup/candidate-a`.

## Strategy

- `nest new`-style Nest 10 layout with **pnpm**.
- **`docker-compose.yml`**: Postgres 16, expose 5432, named volume.
- **`@nestjs/swagger`** + **`@nestjs/config`** + **`@nestjs/typeorm`** + **`pg`**.
- **Modules:** `HealthModule` with `/health` returning `{ status, database }`; simple `Example` entity/table optional — prefer raw connection check via `DataSource`.
- **`test/jest-e2e.json`** and `test/*.e2e-spec.ts`: boot app, hit `/health` and optionally OpenAPI `/api-json`.

## Commands (self-check)

```bash
docker compose up -d
pnpm install
pnpm run build
pnpm run test
pnpm run test:e2e
pnpm run lint
```

## Out of scope

Production hardening (authz, migrations beyond sync in dev-only), kubernetes, CI wiring.
