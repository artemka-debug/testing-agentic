# testing-agentic

Foundation work for a NestJS service with Dockerized PostgreSQL, OpenAPI, and integration tests (see [GitHub issue #1](https://github.com/artemka-debug/testing-agentic/issues/1)).

## Stack

All locked decisions—including database major version, ORM, Compose scope, OpenAPI approach, integration tests, CI, and security conventions (SEC-001, SEC-002, SEC-004)—live in **[docs/STACK.md](docs/STACK.md)**.

## Prerequisites (upcoming)

When the application scaffold lands: **Node.js** (version from `package.json` `engines`), **Docker** for Postgres, and **npm** for scripts.

## Database (current)

```bash
docker compose up -d
```

Uses **PostgreSQL 16** bound to **localhost** only. See `.env.example` for variables.

## Build

```bash
npm ci
npm run build
```

## CI

GitHub Actions workflow runs `npm ci` and `npm run build` (see `.github/workflows/ci.yml`).
