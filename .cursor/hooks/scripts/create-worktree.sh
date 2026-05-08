#!/usr/bin/env bash
# Create a candidate git worktree + branch per docs/plan.md §6 and docs/state-layout.md.
# Usage:
#   create-worktree.sh --task-id <taskId> --candidate-id <id> [--base <branch>] [--repo <path>]
# Env overrides: AGENTIC_REPO_ROOT, AGENTIC_BASE_BRANCH
set -euo pipefail

TASK_ID=""
CANDIDATE_ID=""
BASE_BRANCH="${AGENTIC_BASE_BRANCH:-}"
REPO_ROOT="${AGENTIC_REPO_ROOT:-}"

usage() {
  echo "Usage: $0 --task-id <taskId> --candidate-id <candidate-id> [--base <branch>] [--repo <git-repo-root>]" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task-id) TASK_ID="${2:-}"; shift 2 ;;
    --candidate-id) CANDIDATE_ID="${2:-}"; shift 2 ;;
    --base) BASE_BRANCH="${2:-}"; shift 2 ;;
    --repo) REPO_ROOT="${2:-}"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown arg: $1" >&2; usage ;;
  esac
done

if [[ -z "$TASK_ID" || -z "$CANDIDATE_ID" ]]; then
  usage
fi

if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "create-worktree: not inside a git repo; pass --repo" >&2
    exit 1
  }
fi

CONFIG="$REPO_ROOT/.cursor-agent-workflow.yaml"
if [[ ! -f "$CONFIG" ]]; then
  echo "create-worktree: missing $CONFIG (copy from templates/.cursor-agent-workflow.yaml)" >&2
  exit 1
fi

# Parse fields inside the worktrees: block only (avoid artifacts.root collision).
worktrees_root_rel="$(grep -A40 '^worktrees:' "$CONFIG" | grep -m1 '^  root:' | awk '{for(i=2;i<=NF;i++){gsub(/\042/,"",$i); print $i; exit}}')"
branch_prefix="$(grep -A40 '^worktrees:' "$CONFIG" | grep -m1 '^  branchPrefix:' | awk '{for(i=2;i<=NF;i++){gsub(/\042/,"",$i); print $i; exit}}')"
if [[ -z "${branch_prefix:-}" ]]; then
  branch_prefix="agent"
fi

if [[ -z "${worktrees_root_rel:-}" ]]; then
  worktrees_root_rel="../.agent-worktrees"
fi

# Resolve worktrees root (absolute path wins; otherwise relative to repo root)
if [[ "$worktrees_root_rel" == /* ]]; then
  WORKTREES_ROOT="$worktrees_root_rel"
else
  WORKTREES_ROOT="$(cd "$REPO_ROOT" && cd "$(dirname "$worktrees_root_rel")" && pwd)/$(basename "$worktrees_root_rel")"
fi
mkdir -p "$WORKTREES_ROOT"

REPO_NAME="$(basename "$(cd "$REPO_ROOT" && git rev-parse --show-toplevel)")"
WT_PATH="$WORKTREES_ROOT/${REPO_NAME}-${TASK_ID}-${CANDIDATE_ID}"

if [[ -z "$BASE_BRANCH" ]]; then
  BASE_BRANCH="$(grep -A40 '^github:' "$CONFIG" | grep -m1 '^  defaultBaseBranch:' | awk '{for(i=2;i<=NF;i++){gsub(/\042/,"",$i); print $i; exit}}')"
fi
[[ -n "$BASE_BRANCH" ]] || BASE_BRANCH="main"

# Derive middle slug for branch: gh-<num>-<slug> -> <num>-<slug>; else use task id minus prefix
MIDDLE=""
if [[ "$TASK_ID" =~ ^gh-([0-9]+)-(.+)$ ]]; then
  MIDDLE="${BASH_REMATCH[1]}-${BASH_REMATCH[2]}"
else
  MIDDLE="$TASK_ID"
fi

BRANCH="${branch_prefix}/${MIDDLE}/${CANDIDATE_ID}"

if [[ -e "$WT_PATH" ]]; then
  echo "create-worktree: path already exists: $WT_PATH" >&2
  exit 1
fi

git -C "$REPO_ROOT" fetch origin "$BASE_BRANCH" 2>/dev/null || git -C "$REPO_ROOT" fetch origin 2>/dev/null || true

if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "create-worktree: branch already exists locally: $BRANCH" >&2
  exit 1
fi

git -C "$REPO_ROOT" worktree add -b "$BRANCH" "$WT_PATH" "$BASE_BRANCH"

ART_ROOT="$(grep -A40 '^artifacts:' "$CONFIG" | grep -m1 '^  root:' | awk '{for(i=2;i<=NF;i++){gsub(/\042/,"",$i); print $i; exit}}')"
[[ -n "$ART_ROOT" ]] || ART_ROOT=".agent-workflows"
CAND_DIR="$REPO_ROOT/$ART_ROOT/$TASK_ID/candidates/$CANDIDATE_ID"
mkdir -p "$CAND_DIR"

echo "AGENTIC_WORKTREE_PATH=$WT_PATH"
echo "AGENTIC_BRANCH=$BRANCH"
echo "AGENTIC_BASE_BRANCH=$BASE_BRANCH"
echo "Updated state.json manually or via orchestrator: branch + worktree for $CANDIDATE_ID"
