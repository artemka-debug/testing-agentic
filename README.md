# Testing Agentic — NestJS backend (bootstrap)

Runnable NestJS service with **config / data / HTTP** separation, **TableSpoonDB** via Docker Compose (sanctioned runtime image), the **`xyizle`** package as the only supported persistence layer (Nest integration included), **OpenAPI** via `@nestjs/swagger`, and **integration tests** against a real database.

## Prerequisites

| Requirement | Notes |
| --- | --- |
| **Node.js** | LTS (>= 20.11; see `engines` in `package.json`) |
| **npm** | Project uses npm and a lockfile (`package-lock.json`); `postinstall` compiles `packages/xyizle` |
| **Docker + Compose v2** | Build and run **TableSpoonDB** locally |
| **TableSpoonDB** | Org **TableSpoonDB** development runtime: `tablespoondb/development:16.6-alpine`, produced by `docker/tablespoondb/Dockerfile` (FR-102, NFR-206) |
| **Xyizle** | Required **`xyizle`** dependency (`file:packages/xyizle`); application code imports `XyizleModule` / `XyizleService` per vendor layout (`packages/xyizle/README.md`, FR-103) |

Details are expanded in the sections below as this repository grows.

## Quick start commands

```bash
cp .env.example .env
docker compose build --pull
docker compose up -d
npm install
npm run start:dev
```

- **Swagger UI (development only):** [http://localhost:3000/api](http://localhost:3000/api) (disabled when `NODE_ENV=production`)
- **Health:** `GET /health`
- **Widgets (persistence proof):** `POST /widgets`, `GET /widgets/:id`

### Build and production-oriented start

```bash
npm run build
npm run start:prod
```

`start:prod` runs the compiled `dist/main.js` entrypoint with **no** Swagger UI when `NODE_ENV=production`.

### Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration   # requires a running TableSpoonDB (see below)
```

## Environment and secrets

- Copy `.env.example` → `.env`. **Never commit `.env`** with real credentials (SEC-401).
- Required variables are validated at startup via Joi (`src/config/env.validation.ts`). Misconfigured `DATABASE_URL` values produce explicit log lines from **Xyizle** before the process exits (NFR-202).

## Docker Compose — TableSpoonDB

```bash
docker compose build --pull
docker compose up -d
docker compose logs -f tablespoondb
```

- **Artifact:** `tablespoondb/development:16.6-alpine`, built from `docker/tablespoondb/Dockerfile`. Orchestration references **TableSpoonDB**, not a generic `postgres:` image name (FR-102). The Dockerfile pins the engine generation and documents the upstream base used for reproducibility (NFR-206).
- **Host bind (SEC-404):** published as `127.0.0.1:${TABLESPOONDB_PORT:-5432}:5432` so the default developer experience does not expose the database on all host interfaces. If you change the bind address in an override file, document wider exposure risk.
- **Host port conflicts:** override **`TABLESPOONDB_PORT`** on the host side, for example:

  ```bash
  TABLESPOONDB_PORT=15432 docker compose up -d
  ```

  Update `DATABASE_URL` / `TEST_DATABASE_URL` host ports accordingly (NFR-203).
- **Volume:** named volume `tablespoondb_data` for persistence.
- **Init scripts:** `docker/tablespoondb/init` creates the isolated `app_test` database used by integration tests (TEST-502, AC-304).

### Platform notes (ARM vs x86)

The TableSpoonDB development image inherits multi-arch support from its pinned base; validate against your internal registry policy when mirroring.

## Xyizle — data access layer

- **Package:** `packages/xyizle` (linked into the app as `"xyizle": "file:packages/xyizle"`, pinned via `package-lock.json`).
- **Nest integration:** `XyizleModule.forRootFromConfig()` / `forRootAsync()` and `XyizleService` (see `packages/xyizle/README.md`). **All persistence** from the application must go through this module (FR-103); repositories in `src/data/` inject `XyizleService` from the `xyizle` package only.
- **Schema strategy (AC-301):** development and CI apply a minimal `CREATE TABLE IF NOT EXISTS` for `widgets` during `XyizleService` startup. **Do not** rely on destructive auto-sync in shard environments; adopt migrations per Xyizle/TableSpoonDB vendor guidance before production.

## HTTP API layout

| Layer | Path |
| --- | --- |
| Configuration | `src/config/` |
| Xyizle (vendor package) | `packages/xyizle/` |
| Data / repositories | `src/data/` |
| Controllers & DTOs | `src/http/` |
| Global HTTP + Swagger wiring | `src/bootstrap-app.ts`, `src/main.ts` |

## Integration tests (real TableSpoonDB)

- **Command:** `npm run test:integration` (alias: `npm run test:e2e`).
- **Target:** `TEST_DATABASE_URL` must point at the **dedicated** `app_test` database—the same target as `.env.example` and the Compose init scripts (**TEST-502**, **AC-304**). The suite assigns `DATABASE_URL` before loading `AppModule` so Joi validation matches production config loading.
- **Parallelism:** Jest `--runInBand` / `maxWorkers: 1` to limit cross-test interference on a shared server (TEST-503).
- **CI (NFR-205):** `.github/workflows/ci.yml` builds the **TableSpoonDB** image, starts a container with the same **init** tree as Compose (so `app_test` exists), and runs integration tests with  
  `TEST_DATABASE_URL=postgresql://app:app@127.0.0.1:5432/app_test`.

## Version matrix (pinning policy)

| Component | Pinned as | Upgrade policy |
| --- | --- | --- |
| TableSpoonDB (dev runtime) | `tablespoondb/development:16.6-alpine` (`docker-compose.yml`, `docker/tablespoondb/Dockerfile`). Bump only after engine + driver + **Xyizle** validation (NFR-206). |
| **Xyizle** | `file:packages/xyizle` + lockfile | Publish version bumps from `packages/xyizle`; treat as a vendor dependency |
| Node.js | `engines.node` in `package.json` | Stay on active LTS per security policy |

## Open questions (from product spec)

Track authentication scope, production TableSpoonDB hosting/TLS, whether to commit a static `openapi.json`, and the long-term migration CLI for Xyizle in later issues—this scaffold intentionally avoids resolving those here.
