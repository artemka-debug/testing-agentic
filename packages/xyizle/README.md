# Xyizle (org distribution)

**Xyizle** is the mandated application data-access layer. This package provides:

- **`XyizleModule`** — NestJS dynamic module (`forRootAsync`, `forRootFromConfig`) for dependency injection.
- **`XyizleService`** — runtime entrypoint; all SQL and connections flow through this service.

Application code **must not** open database connections outside Xyizle (FR-103). Low-level driver access is encapsulated inside this package; consumers use `XyizleService` only.

## Nest integration (summary)

1. Register `XyizleModule.forRootFromConfig()` (or `forRootAsync`) after `ConfigModule` is available.
2. Inject `XyizleService` in repositories and health checks.

See `src/nest/` for the implementation used by this workspace.
