#!/usr/bin/env bash
# after-implementation-agent: refresh changed-files list (hook helper).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
TASK_ID="${AGENTIC_TASK_ID:?set AGENTIC_TASK_ID}"
CAND="${AGENTIC_CANDIDATE_ID:?set AGENTIC_CANDIDATE_ID}"
WT="${AGENTIC_WORKTREE_PATH:?set AGENTIC_WORKTREE_PATH}"
BASE="${AGENTIC_BASE_BRANCH:-}"
exec "$SCRIPT_DIR/capture-candidate-summary.sh" --repo "$ROOT" --task-id "$TASK_ID" --candidate-id "$CAND" --worktree "$WT" ${BASE:+--base "$BASE"}
