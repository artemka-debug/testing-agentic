## Traceability coverage matrix (`gh-1-basic-application-setup`)

Legend: **`covered`** = implemented + exercised in tests/commands; **`pass`** = verified pass; **`waived`** = documented N/A.

| REQ-ID  | Priority | Behavior | Lint | Tests / E2E | Build | Security | Summary |
|---------|----------|----------|------|-------------|-------|----------|---------|
| REQ-001 | must | Nest scaffold / build/start | covered pass | covered pass (`pnpm test`, e2e) | covered pass | n/a | **covered — pass** |
| REQ-002 | must | OpenAPI exposure | covered pass | covered pass (`GET /api-json`) | covered pass | n/a | **covered — pass** |
| REQ-003 | must | Postgres via Compose | waived | covered pass (e2e with DB running) | n/a | n/a | **covered — pass** (infra at repo root `docker-compose.yml`; manual compose **pass**) |
| REQ-004 | must | Runtime DB connectivity | covered pass | covered pass (`GET /health`) | n/a | n/a | **covered — pass** |
| REQ-005 | must | Integration / e2e harness | covered pass | covered pass (`pnpm test:e2e`) | n/a | n/a | **covered — pass** |
| REQ-006 | should | Security review / audit | n/a | n/a | n/a | documented | **reviewed — pass** (pnpm audit recorded; highs cleared via overrides; moderate/low remaining upstream / dev-only) |
