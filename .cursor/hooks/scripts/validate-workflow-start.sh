#!/usr/bin/env bash
# Preflight: gh auth, git repo, optional clean tree + artifact root bootstrap.
# Usage: validate-workflow-start.sh [--repo <path>] [--task-id <id>] [--require-clean]
set -euo pipefail

REPO_ROOT=""
TASK_ID=""
REQUIRE_CLEAN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO_ROOT="${2:-}"; shift 2 ;;
    --task-id) TASK_ID="${2:-}"; shift 2 ;;
    --require-clean) REQUIRE_CLEAN=1; shift ;;
    *) shift ;;
  esac
done

if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "validate-workflow-start: not a git repository" >&2
    exit 1
  }
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "validate-workflow-start: gh CLI not found" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "validate-workflow-start: gh not authenticated (run gh auth login)" >&2
  exit 1
fi

CONFIG="$REPO_ROOT/.cursor-agent-workflow.yaml"
if [[ ! -f "$CONFIG" ]]; then
  echo "validate-workflow-start: missing $CONFIG" >&2
  exit 1
fi

if [[ "$REQUIRE_CLEAN" -eq 1 ]]; then
  if [[ -n "$(git -C "$REPO_ROOT" status --porcelain 2>/dev/null)" ]]; then
    echo "validate-workflow-start: working tree not clean (--require-clean)" >&2
    exit 1
  fi
fi

if [[ -n "$TASK_ID" ]]; then
  ART_ROOT="$(grep -A40 '^artifacts:' "$CONFIG" | grep -m1 '^  root:' | awk '{for(i=2;i<=NF;i++){gsub(/\042/,"",$i); print $i; exit}}' 2>/dev/null || true)"
  [[ -n "$ART_ROOT" ]] || ART_ROOT=".agent-workflows"
  mkdir -p "$REPO_ROOT/$ART_ROOT/$TASK_ID/logs"
fi

echo "validate-workflow-start: OK (repo=$REPO_ROOT)"
