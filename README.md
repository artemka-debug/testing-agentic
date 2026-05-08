# Backend API (NestJS)

Runnable NestJS HTTP service with PostgreSQL, OpenAPI (**`@nestjs/swagger`**) in non-production environments, TypeORM-backed connectivity checks, Zod-aligned DTOs via **nestjs-zod**, and separate **unit** vs **integration** test entrypoints.

Stack choices for issue **#1** are reconciled against prior PR **#6** / **#7** prior art and recorded in [`docs/adr/0001-stack-decisions.md`](docs/adr/0001-stack-decisions.md).

## Prerequisites

- **Node.js** `>=20.11.1 <26` (see `package.json` `engines`, **NFR-001**).
- **npm** (`package-lock.json`, **NFR-005**) — orchestrator verification uses **`npm run …`** commands.
- **Docker** Compose v2 (`docker compose`), for the local database (**NFR-002**).

## Quick start

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Start PostgreSQL (development credentials only; compose binds **localhost**):

   ```bash
   docker compose up -d
   ```

   - Default service name **`db`** in **`compose.yaml`**, image **`postgres:16-alpine`**.
   - Host port **`127.0.0.1:5433` → container `5432`** to avoid clashes with a host Postgres (**AC-001**).

3. Copy environment defaults:

   ```bash
   cp .env.example .env
   ```

   The app reads discrete **`DB_HOST`**, **`DB_PORT`**, **`DB_USER`**, **`DB_PASSWORD`**, **`DB_NAME`** variables (**FR-004**, **FR-005**).

4. First-time Compose volumes create databases **`app`** (primary) and **`app_test`** (integration harness) via `docker/init/01-create-app-test.sql`. On an older volume missing **`app_test`**, run once:

   ```bash
   docker compose exec db psql -U app -d postgres -c "CREATE DATABASE app_test;"
   ```

   (Or reset the volume: `docker compose down -v`.)

5. Run the API:

   ```bash
   npm run start:dev
   ```

### Port overrides (**edge cases**)

- **HTTP:** `PORT` in `.env` (default **3000**).
- **Postgres:** change **`POSTGRES_PORT`** env when invoking Compose, and set **`DB_PORT`** in `.env` to the same published host port. Example:  
  `POSTGRES_PORT=5434 docker compose up -d`.

### Ordering and bootstrap

TypeORM **`retryAttempts`** / **`retryDelay`** tolerate a slow Postgres start (**edge case: DB not ready**); prefer starting Compose (with its healthcheck) before the app (**NFR-003**).

## API layout (**FR-002**)

- **`GET /health`** — root health and DB probe (`SELECT 1`), documented under OpenAPI **`health`** tag.
- Future HTTP modules should live under **`/api/v1/...`** (global prefix excludes **`/health`**).

## OpenAPI (**FR-003**)

- Swagger UI (**non-production** only): **`http://localhost:{PORT}/api/docs`**
- OpenAPI JSON: **`http://localhost:{PORT}/api/docs-json`** (same rule)

Responses for `/health` are described with **`@ZodResponse`** + **`nestjs-zod`**.

## Tests

| Command | Scope |
|--------|------|
| `npm test` | **Unit** tests (`*.spec.ts` under `src/`, **TEST-001**) |
| `npm run test:integration` | **Integration** tests (`test/integration/**/*.integration-spec.ts`, **FR-008**/**FR-009**) |

**`test/integration/jest.setup.ts`** sets **`DB_NAME`** to **`app_test`** for integration runs (or **`DB_NAME_INTEGRATION`** when set), matching Compose init SQL; your `.env` **`DB_NAME`** (`app`) does not apply to this harness. The same setup fills missing **`DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`** with **`.env.example`** Compose defaults so **`npm run test:integration`** works before you copy `.env` (**TEST-003**).

**Smoke validation:** with Postgres down integration tests exit non‑zero after connection retries (**AC-004**, **TEST-005** waits on Postgres instead of opaque sleeps).

## CI (**NFR-004**)

The workflow `.github/workflows/ci.yml` launches a GitHub-hosted **`postgres:16`** service (Docker-in-Docker is **not required** here), provisions **`app_test`**, runs **`npm ci`**, **`npm run build|lint|typecheck|test`**, then **`npm run test:integration`**.

## Security notes (**SEC‑001…003**)

- Compose defaults are **non-production**.
- Postgres is published on **loopback only** (**SEC‑002**); do not widen binding on untrusted networks.
- Swagger is **disabled in production** (**SEC‑003**).
- Diagnostics log host, driver, DB name—not passwords (**NFR‑006**).

## Layout

- `src/` application source (`config`, `database`, `health`, …).
- `compose.yaml` Postgres service + **`docker/init/`** bootstrap SQL.
- `test/integration/` Jest harness + Postgres wait helper.
