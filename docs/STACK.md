# Stack decisions and conventions

This document resolves the open questions from the basic application setup spec ([issue #1](https://github.com/artemka-debug/testing-agentic/issues/1)). Treat it as the source of truth for technology and process choices until explicitly revised.

## Runtime and framework

| Topic | Decision | Rationale |
|--------|-----------|-----------|
| Application framework | **NestJS** (official CLI-style layout: `src/main.ts`, feature modules, `test` or `e2e` for integration) | Matches FR-001 / A-001; strong ecosystem for HTTP + OpenAPI + config. |
| Node version | **Pinned via `engines` in `package.json`** (to be set when the app scaffold lands) + lockfile | NFR-005. |

## Database

| Topic | Decision | Rationale |
|--------|-----------|-----------|
| Engine | **PostgreSQL** | Portable images, excellent Docker/CI support, fits Nest/TypeORM defaults. |
| Major version | **16** (`postgres:16-alpine` in Compose) | Stable, widely available; TEST-001 requires same major in integration tests as Compose. |
| Host binding (dev/test Compose) | **`127.0.0.1` only** for the published DB port | SEC-002: avoids exposing the dev DB to the LAN by default. Override only with an explicit, documented env/port mapping if needed. |

## ORM and schema management

| Topic | Decision | Rationale |
|--------|-----------|-----------|
| ORM / query layer | **TypeORM** | First-class Nest integration; migrations are reproducible (FR-006). |
| Migrations | **TypeORM migrations** checked into the repo | Deterministic schema (NFR-001); run via CLI or app bootstrap script documented in README when implemented. |
| Parameterized access | **TypeORM repository / query builder only** for any user-influenced data | SEC-003; no string-concatenated SQL for inputs. |

## Docker Compose layout

| Topic | Decision | Rationale |
|--------|-----------|-----------|
| What is containerized | **Database only** in the default Compose file | Faster local iteration (Nest on host with HMR); satisfies FR-002. A **future** optional `Dockerfile` + `app` service may be added for production-like runs; that is **not** required for the initial milestone. |
| App in Compose | **Out of scope for v1** unless a follow-up explicitly adds an `app` service | Open question #3 resolved as **DB-only**. |
| Idempotency / teardown | **`docker compose up -d`** is idempotent; document `docker compose down` vs `down -v` for volume reset (migration drift / edge cases). | AC-001. |

## OpenAPI / API contract

| Topic | Decision | Rationale |
|--------|-----------|-----------|
| Source of truth | **Code-first**: **`@nestjs/swagger`** decorators drive the OpenAPI document | FR-005; single source in code reduces drift if reviews enforce decorator coverage. |
| Artifact | Served at a **defined path** (convention: `/api/docs` for Swagger UI, JSON at `/api/docs-json` or documented equivalent) **and** optionally exported in CI as `openapi.json` later | AC-004; obtainable without reading decorators only. |
| Checked-in `openapi.yaml` | **Not required initially**; if introduced later, add a **CI contract check** (generated vs committed) per edge-case note on OpenAPI drift. | Open question #5. |

### Swagger in non-development environments (SEC-004)

Swagger UI and the raw OpenAPI JSON describe the full surface area of the API. Enabling them **outside local/dev** carries risk:

- **No authentication** is assumed for docs routes unless explicitly implemented later.
- **Schema introspection** aids attackers mapping endpoints; internal/staging exposure should be gated (network policy, auth middleware, or disabled flag).
- **Conventions:** enable Swagger only when `NODE_ENV === 'development'` (or an explicit `ENABLE_SWAGGER=true` used only in safe environments). Production docs, if needed, should be served from static artifacts with separate access control—not by reusing developer defaults.

Document operator expectations in runbooks when enabling docs in shared environments.

## Integration testing

| Topic | Decision | Rationale |
|--------|-----------|-----------|
| Mechanism | **Docker Compose** with the **same `compose.yaml`** (and optionally a **`test` profile** or `docker compose -f compose.yaml -f compose.override.test.yaml` pattern) | Aligns TEST-001 with the committed Postgres 16 image; no extra JVM/Testcontainers dependency for the default path. |
| Alternative | **Testcontainers** remains acceptable for agents who prefer it **if** the image major version matches **16** and docs describe how to run it; the **canonical CI path** uses Compose. | Favors Compose for GitHub Actions simplicity while keeping Testcontainers as an optional dev path. |
| Isolation | **Per-run** compose project name (`COMPOSE_PROJECT_NAME`), **separate volume**, and/or **dedicated test database name** so parallel runs do not collide (TEST-002). | |
| HTTP + DB | At least one test must **HTTP** into the app and assert **DB-backed** behavior **and** response shape vs OpenAPI where practical (TEST-004). | |

## CI

| Topic | Decision | Rationale |
|--------|-----------|-----------|
| Target | **GitHub Actions** on **ubuntu-latest** | TEST-003; Linux parity with typical cloud CI. |
| Docker | **`docker compose` in workflow** to start Postgres before integration/e2e jobs (or `services: postgres` with same **16** major). | NFR-002. |
| Self-hosted runners | Supported **if** they provide Docker and meet the same constraints; document any gaps. | Open question #4. |

## Configuration and secrets

### Local-only defaults (SEC-001)

- Credentials in **`.env.example`** and Compose defaults are **for local development only**.
- **Production** (or any shared environment) **must** inject secrets via a secret manager or orchestrator secrets—**never** commit real passwords or reuse dev defaults.
- Call out in onboarding: copying `.env.example` → `.env` is acceptable **only** on a trusted workstation.

### Environment variables (convention)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` or discrete `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | App connection; **no** hard-coded non-local credentials in code (FR-003). |
| `NODE_ENV` | Controls Swagger and other dev-only behavior. |
| `POSTGRES_PORT` | Host port mapping (default `5432`) to mitigate port conflicts without editing committed files. |

## Auth (open question #6)

- **Authentication/authorization is out of scope for v1** routes unless an issue explicitly adds it.
- New routes should be written so auth middleware can be attached later without breaking HTTP contracts.

## Requirement traceability (seed)

| Decision area | FR | AC | TEST | SEC | NFR |
|---------------|----|----|------|-----|-----|
| Nest + docs | FR-001, FR-005, FR-008 | AC-002, AC-004, AC-006 | TEST-004 | SEC-004 | NFR-005 |
| Postgres + Compose | FR-002, FR-003 | AC-001 | TEST-001 | SEC-001, SEC-002 | NFR-001, NFR-002 |
| TypeORM migrations | FR-006 | — | TEST-001 | SEC-003 | NFR-001 |
| Integration tests | FR-007 | AC-005 | TEST-001–TEST-003 | — | NFR-001 |

## Revision process

Changes to this document should be intentional: update the table(s) above, bump any pinned image versions, and adjust CI/docs in the same change so NFR-001 (determinism) holds.
