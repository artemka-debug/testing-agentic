## Self-check (candidate-a)

```bash
# In worktree root
docker compose up -d

cd backend
pnpm install
pnpm run lint
pnpm exec tsc --noEmit -p tsconfig.build.json
pnpm run test
pnpm run test:e2e
pnpm run build
pnpm audit
```

**Result:** all commands executed successfully for this pipeline run (PostgreSQL container running on localhost:5432).
