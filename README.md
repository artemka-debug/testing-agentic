# Backend API (NestJS)

Runnable NestJS HTTP service with PostgreSQL, OpenAPI documentation in development, and separate **unit** vs **integration** test entrypoints.

## Prerequisites

- **Node.js** `>=20.11.0 <25` (see `package.json` `engines` and `NFR-001`)
- **npm** (lockfile: `package-lock.json`, `NFR-003`)
- **Docker** with Compose v2 (`docker compose`), for the local database (`NFR-002`)

## Quick start

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Start PostgreSQL (development-only credentials; see `docker-compose.yml` and `SEC-001`):

   ```bash
   docker compose up -d
   ```

   Data is stored in the named volume `pgdata` so it survives container restarts (`FR-003`).

3. Configure the app. Copy the example file and adjust if needed:

   ```bash
   cp .env.example .env
   ```

   Connection settings (`FR-004`) map to Compose defaults (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

4. Run the API:

   ```bash
   npm run start:dev
   ```

   The HTTP server listens on **`PORT`** (default **3000**, `FR-001`). PostgreSQL is exposed on **`127.0.0.1:5433`** by default (container port `5432`) to reduce conflicts with a host install on `5432`.

### Port overrides

- **API:** set `PORT` in `.env` if `3000` is taken.
- **PostgreSQL host port:** the default Compose mapping is **`127.0.0.1:5433` → container `5432`**. If `5433` is taken, pick another host port in `docker-compose.yml` and set **`DB_PORT`** in `.env` to match.

### Apple Silicon and CI (`amd64`)

Images use **`postgres:16-alpine`**, which supports `linux/arm64` and `linux/amd64`. No extra `platform:` pin is required for typical macOS/Linux setups.

## API schema (OpenAPI)

- **Swagger UI (development only):** `http://localhost:3000/api/docs` when `NODE_ENV` is not `production` (`FR-006`, `SEC-003`).
- **OpenAPI JSON:** `http://localhost:3000/api/docs-json` under the same rule.

The documented minimal surface today is **`GET /health`**, which reflects the real handler and DTOs.

## Tests

| Command | Scope |
|--------|--------|
| `npm test` | **Unit** tests (`*.spec.ts` under `src/`, `TEST-001`) |
| `npm run test:integration` | **Integration** tests (`test/integration/**/*.integration-spec.ts`, `FR-007`) |

Integration tests expect PostgreSQL reachable with the same variables as the app. By default they use the dedicated database **`app_test`**, created automatically when the Compose volume is first initialized (`TEST-003`). You can override the database name with **`DB_NAME_INTEGRATION`**.

**Run a single integration file** (`TEST-005`):

```bash
npx jest --config ./test/jest-integration.json --runInBand test/integration/app.integration-spec.ts
```

With the database up, integration tests use explicit **wait/retry** instead of unbounded sleeps (`NFR-005`).

## CI

GitHub Actions workflow **`.github/workflows/ci.yml`** runs `npm ci`, `npm run build`, `npm run lint`, `npm run typecheck`, unit tests, and integration tests against a PostgreSQL service (`AC-005`).

## Project layout (`FR-002`)

- `src/` — application source
- `src/config/` — environment validation
- `src/database/` — TypeORM bootstrap (`FR-005`)
- `src/health/` — health/readiness HTTP module
- `test/integration/` — integration tests and Jest setup

## Security notes

- Compose credentials are **development-only** (`SEC-001`); do not reuse in production.
- The database port is bound to **127.0.0.1** in Compose (`SEC-002`).
- For `NODE_ENV=production`, Swagger UI is **disabled** by default (`SEC-003`).
- Avoid logging **secrets**; startup diagnostics log host, port, driver, and database name (`NFR-004`).
