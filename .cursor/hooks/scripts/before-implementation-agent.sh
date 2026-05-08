#!/usr/bin/env bash
# before-implementation-agent: create worktree from env (hook helper).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
TASK_ID="${AGENTIC_TASK_ID:?set AGENTIC_TASK_ID}"
CAND="${AGENTIC_CANDIDATE_ID:?set AGENTIC_CANDIDATE_ID}"
BASE="${AGENTIC_BASE_BRANCH:-}"
exec "$SCRIPT_DIR/create-worktree.sh" --repo "$ROOT" --task-id "$TASK_ID" --candidate-id "$CAND" ${BASE:+--base "$BASE"}
