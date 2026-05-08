# Security summary — gh-1-basic-application-setup

## Audit

- Command: `cd backend && pnpm audit` (see `verification/logs/security-audit.log`).
- **High-severity** findings from initial Nest 10 defaults were mitigated with targeted `pnpm.overrides` (`multer`, `glob`, `webpack`, `lodash`, `picomatch`).
- **Residual:** 5 moderate + 1 low (transitive: `js-yaml` via swagger, `ajv`/`file-type` via CLI + `@nestjs/common`, `tmp` via nest CLI, Nest core advisory fixed in 11.x line only). Accept for scaffold; track upstream Nest 11 migration.

## Code review (lightweight)

- No hard-coded credentials; `.env.example` only.
- TypeORM `synchronize: true` is dev-scaffold only — document before production.
