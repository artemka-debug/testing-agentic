## Self-check — candidate-a

- `pnpm install --frozen-lockfile` ✓
- `pnpm run lint` ✓
- `pnpm exec tsc --noEmit -p tsconfig.build.json` ✓
- `pnpm run test` ✓
- `pnpm run test:e2e` ✓ (Postgres via `docker compose up -d`)
- `pnpm run build` ✓
