#!/usr/bin/env bash
# before-pr-create: traceability + lightweight secret scan on branch diff.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
TASK_ID="${AGENTIC_TASK_ID:?set AGENTIC_TASK_ID}"
CONFIG="$ROOT/.cursor-agent-workflow.yaml"
ART_ROOT="$(grep -A40 '^artifacts:' "$CONFIG" 2>/dev/null | grep -m1 '^  root:' | awk '{for(i=2;i<=NF;i++){gsub(/\042/,"",$i); print $i; exit}}' || true)"
[[ -n "$ART_ROOT" ]] || ART_ROOT=".agent-workflows"
REQ="$ROOT/$ART_ROOT/$TASK_ID/requirements.json"
MATRIX="$ROOT/$ART_ROOT/$TASK_ID/verification/coverage-matrix.md"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/validate-traceability.js" "$REQ" "$MATRIX"
"$SCRIPT_DIR/check-no-secrets.sh" --repo "$ROOT"
echo "before-pr-create: OK"
