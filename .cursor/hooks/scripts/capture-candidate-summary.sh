#!/usr/bin/env bash
# Refresh changed-files.txt for a candidate from its worktree vs base branch.
# Usage:
#   capture-candidate-summary.sh --task-id <taskId> --candidate-id <id> \
#     [--worktree <path>] [--repo <consumer-repo>] [--base <branch>]
set -euo pipefail

TASK_ID=""
CANDIDATE_ID=""
WORKTREE=""
REPO_ROOT=""
BASE_BRANCH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task-id) TASK_ID="${2:-}"; shift 2 ;;
    --candidate-id) CANDIDATE_ID="${2:-}"; shift 2 ;;
    --worktree) WORKTREE="${2:-}"; shift 2 ;;
    --repo) REPO_ROOT="${2:-}"; shift 2 ;;
    --base) BASE_BRANCH="${2:-}"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

[[ -n "$TASK_ID" && -n "$CANDIDATE_ID" ]] || { echo "Need --task-id and --candidate-id" >&2; exit 1; }

if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "Need --repo or run inside repo" >&2; exit 1; }
fi

CONFIG="$REPO_ROOT/.cursor-agent-workflow.yaml"
ART_ROOT="$(grep -A40 '^artifacts:' "$CONFIG" | grep -m1 '^  root:' | awk '{for(i=2;i<=NF;i++){gsub(/\042/,"",$i); print $i; exit}}' 2>/dev/null || true)"
[[ -n "$ART_ROOT" ]] || ART_ROOT=".agent-workflows"

OUT_DIR="$REPO_ROOT/$ART_ROOT/$TASK_ID/candidates/$CANDIDATE_ID"
mkdir -p "$OUT_DIR"

if [[ -z "$WORKTREE" ]]; then
  # Try state.json for worktree path (best-effort jq-free parse)
  STATE="$REPO_ROOT/$ART_ROOT/$TASK_ID/state.json"
  if [[ -f "$STATE" ]]; then
    WORKTREE="$(node -e "
      const fs=require('fs');
      const j=JSON.parse(fs.readFileSync('$STATE','utf8'));
      const c=(j.candidates||[]).find(x=>x.id==='$CANDIDATE_ID');
      process.stdout.write((c&&c.worktree)||'');
    " 2>/dev/null || true)"
  fi
fi

[[ -n "$WORKTREE" ]] || { echo "Could not resolve worktree; pass --worktree" >&2; exit 1; }

if [[ -z "$BASE_BRANCH" ]]; then
  BASE_BRANCH="$(grep -A40 '^github:' "$CONFIG" | grep -m1 '^  defaultBaseBranch:' | awk '{for(i=2;i<=NF;i++){gsub(/\042/,"",$i); print $i; exit}}' 2>/dev/null || true)"
fi
[[ -n "$BASE_BRANCH" ]] || BASE_BRANCH="main"

# Prefer merge-base diff vs remote tracking base when possible
git -C "$WORKTREE" fetch origin "$BASE_BRANCH" 2>/dev/null || true
MERGE_BASE="$(git -C "$WORKTREE" merge-base "HEAD" "origin/$BASE_BRANCH" 2>/dev/null || git -C "$WORKTREE" merge-base "HEAD" "$BASE_BRANCH" 2>/dev/null || echo "$BASE_BRANCH")"

git -C "$WORKTREE" diff --name-only "$MERGE_BASE"...HEAD > "$OUT_DIR/changed-files.txt"

echo "Wrote $OUT_DIR/changed-files.txt ($(wc -l < "$OUT_DIR/changed-files.txt" | tr -d ' ') paths)"
