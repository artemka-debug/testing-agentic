#!/usr/bin/env bash
# after-po-spec: validate requirements.json shape (hook helper).
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
REQ_JSON="${AGENTIC_REQUIREMENTS_JSON:-}"
TASK_ID="${AGENTIC_TASK_ID:-}"
if [[ -z "$REQ_JSON" && -n "$TASK_ID" ]]; then
  CONFIG="$ROOT/.cursor-agent-workflow.yaml"
  ART_ROOT="$(grep -A40 '^artifacts:' "$CONFIG" 2>/dev/null | grep -m1 '^  root:' | awk '{for(i=2;i<=NF;i++){gsub(/\042/,"",$i); print $i; exit}}' || true)"
  [[ -n "$ART_ROOT" ]] || ART_ROOT=".agent-workflows"
  REQ_JSON="$ROOT/$ART_ROOT/$TASK_ID/requirements.json"
fi
[[ -f "$REQ_JSON" ]] || { echo "after-po-spec: missing $REQ_JSON" >&2; exit 1; }
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/validate-requirements.js" "$REQ_JSON"
