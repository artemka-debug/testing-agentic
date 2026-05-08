# ADR 0001: Database, ORM, API schema tooling, Compose

## Status

Accepted (reconciling prior art GitHub PR #6 and PR #7 for testing-agentic#1).

## Context

PR #6 added a Postgres 16 Compose baseline (`compose.yaml`), npm scaffolding, and `docs/STACK.md`-style locking.
PR #7 added the NestJS app, Swagger, TypeORM-backed connectivity checks, integration tests, and **`docker-compose.yml`**, plus a partial Prisma migration used only to create **`app_test`**.

That combination left overlapping Compose filenames, **`pnpm`** vs **`npm`**, and **two ORM toolchains** advertised (Prisma migrate + TypeORM runtime) although only TypeORM powered the Nest app.

Orchestrator verification for this repo expects **`npm`** commands (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`).

## Decision

1. **Database engine**: **PostgreSQL 16** in Docker Compose (`postgres:16-alpine`), localhost-bound published port (`127.0.0.1`, default host port **5433** to dodge local Postgres on `5432`), named volume **`postgres_data`**.
2. **ORM**: **TypeORM only** with `pg`; **remove Prisma** from the stack end-to-end. Schema for integration tests stays minimal (raw SQL DDL in tests plus init SQL for **`app_test`**).
3. **API schema tooling**: **`@nestjs/swagger`** for OpenAPI emission and Swagger UI (**disabled when `NODE_ENV=production`**), with **`nestjs-zod`** for Zod-aligned DTO documentation on documented routes (`FR-003`).
4. **Compose source of truth**: Single **`compose.yaml`** (Compose spec file name favored in PR #6); no duplicate `docker-compose.yml`.
5. **Integration test DB**: **`app_test`** created by Compose init scripts on fresh volumes; CI provisions it with **`psql`** (NFR-004: GHA Postgres service container has no `./docker/init` bind mount).
6. **API surface layout**: **`GET /health`** stays at the HTTP root for liveness/readiness probing; namespaced controllers use **`/api/v1`**.

## Consequences

- Contributors need **Docker** for local Postgres and **`npm ci`** for installs.
- **`DATABASE_URL`** is not required for runtime (discrete **`DB_*`** variables only), reducing dual-URL duplication from the Prisma-era layout.
- Open questions §10 (**CI runner Compose**): this workflow uses **`services:` Postgres** plus explicit **`app_test`** creation; contributors who cannot run Docker can still run **`npm run build`**, **`npm test`**, **`npm run typecheck`**; integration tests remain Docker-oriented locally per README.
