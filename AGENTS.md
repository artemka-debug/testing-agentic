# AGENTS.md

## Cursor Cloud specific instructions

This repository (`artemka-debug/testing-agentic`) is a **configuration-only** repository for AI agentic coding workflows. It contains orchestrator configuration but no application source code, no dependencies, and no services.

### Repository contents

- `orchestrator.config.yaml` — Cursor Local Orchestrator configuration (models, verification commands, workflow settings)
- `.cursor/hooks/state/continual-learning.json` — Cursor hook state (auto-generated)

### Key notes

- There is **no application to build, run, lint, or test**. The `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` commands referenced in `orchestrator.config.yaml` are placeholder/template commands and will fail without a `package.json`.
- No package manager lockfiles or dependency manifests exist.
- No setup scripts, Dockerfiles, or devcontainer configs exist.
- If source code is added in the future, update this file and the VM update script accordingly.
