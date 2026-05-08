#!/usr/bin/env bash
# after-decomposition: remind operator of approval gate (non-blocking by default).
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CONFIG="$ROOT/.cursor-agent-workflow.yaml"
if grep -q 'requireApprovalAfterDecomposition: true' "$CONFIG" 2>/dev/null; then
  echo "after-decomposition: requireApprovalAfterDecomposition is true — obtain human approval before implementation." >&2
fi
exit 0
