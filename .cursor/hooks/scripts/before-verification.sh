#!/usr/bin/env bash
# before-verification: ensure candidate artifact folder exists.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
TASK_ID="${AGENTIC_TASK_ID:?set AGENTIC_TASK_ID}"
CAND="${AGENTIC_CANDIDATE_ID:?set AGENTIC_CANDIDATE_ID}"
CONFIG="$ROOT/.cursor-agent-workflow.yaml"
ART_ROOT="$(grep -A40 '^artifacts:' "$CONFIG" 2>/dev/null | grep -m1 '^  root:' | awk '{for(i=2;i<=NF;i++){gsub(/\042/,"",$i); print $i; exit}}' || true)"
[[ -n "$ART_ROOT" ]] || ART_ROOT=".agent-workflows"
DIR="$ROOT/$ART_ROOT/$TASK_ID/candidates/$CAND"
[[ -d "$DIR" ]] || { echo "before-verification: missing $DIR" >&2; exit 1; }
for f in summary.md self-check.md; do
  [[ -f "$DIR/$f" ]] || echo "before-verification: warning: missing $DIR/$f" >&2
done
echo "before-verification: OK ($DIR)"
