## Issue #1 — Basic application setup

NestJS REST API scaffold lives in **`backend/`**. PostgreSQL for local development is defined in **`docker-compose.yml`** at this repository root.

### Quickstart

```bash
docker compose up -d
cd backend
pnpm install
pnpm run start:dev
```

- API base: http://localhost:3000/
- Swagger UI: http://localhost:3000/api
- OpenAPI JSON: http://localhost:3000/api-json
- DB health probe: GET http://localhost:3000/health

### Verification

PostgreSQL must be reachable (defaults match `backend/.env.example`).

```bash
cd backend
pnpm run test
pnpm run test:e2e
```
