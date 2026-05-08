# Security summary — gh-1-basic-application-setup

- **Dependency audit (`pnpm audit`):** 6 issues reported (5 moderate, 1 low), transitive via `@nestjs/cli` / tooling — **no high severity**.
- **blockOnHighSeverity:** satisfied (no highs).
- **Secrets:** no credentials in repo; `.env.example` documents DB vars.
