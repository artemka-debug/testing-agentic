#!/usr/bin/env bash
# after-pr-create: persist PR URL for the task + optionally start background PR polling.
# Disable auto-monitor: AGENTIC_AUTO_START_PR_MONITOR=0
# TASK_ID optional; when set with a resolved PR URL, writes pr/url.txt under artifacts.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TASK_ID="${AGENTIC_TASK_ID:-}"
CONFIG="$ROOT/.cursor-agent-workflow.yaml"
ART_ROOT="$(grep -A40 '^artifacts:' "$CONFIG" 2>/dev/null | grep -m1 '^  root:' | awk '{for(i=2;i<=NF;i++){gsub(/\042/,"",$i); print $i; exit}}' || true)"
[[ -n "$ART_ROOT" ]] || ART_ROOT=".agent-workflows"

PR_URL="${AGENTIC_PR_URL:-}"
if [[ -z "$PR_URL" ]] && command -v gh >/dev/null; then
  PR_URL="$(cd "$ROOT" && gh pr view --json url -q .url 2>/dev/null || true)"
fi

PR_NUM=""
if command -v gh >/dev/null; then
  PR_NUM="$(cd "$ROOT" && gh pr view --json number -q .number 2>/dev/null || true)"
fi

if [[ -n "$TASK_ID" && -n "$PR_URL" ]]; then
  mkdir -p "$ROOT/$ART_ROOT/$TASK_ID/pr"
  printf '%s\n' "$PR_URL" > "$ROOT/$ART_ROOT/$TASK_ID/pr/url.txt"
  echo "after-pr-create: wrote $ART_ROOT/$TASK_ID/pr/url.txt"
elif [[ -n "$TASK_ID" ]]; then
  echo "after-pr-create: AGENTIC_TASK_ID set but PR URL missing — skipping pr/url.txt (set AGENTIC_PR_URL or ensure gh sees the new PR)"
else
  echo "after-pr-create: no AGENTIC_TASK_ID — skipped pr/url.txt (optional)"
fi

if [[ "${AGENTIC_AUTO_START_PR_MONITOR:-1}" == "0" ]]; then
  echo "after-pr-create: AGENTIC_AUTO_START_PR_MONITOR=0 — not starting background monitor"
  exit 0
fi

if [[ ! -f "$CONFIG" ]]; then
  echo "after-pr-create: missing $CONFIG — not starting background monitor"
  exit 0
fi

if ! grep -q '^prMonitor:' "$CONFIG" 2>/dev/null; then
  echo "after-pr-create: no prMonitor: block in $CONFIG — not starting background monitor"
  exit 0
fi

enabled_line="$(grep -A40 '^prMonitor:' "$CONFIG" 2>/dev/null | grep -m1 -E '^[[:space:]]*enabled:' || true)"
if [[ "$enabled_line" == *false* ]]; then
  echo "after-pr-create: prMonitor.enabled is false — not starting background monitor"
  exit 0
fi

if [[ -z "$PR_NUM" ]]; then
  echo "after-pr-create: could not resolve PR number with gh — not starting background monitor"
  exit 0
fi

INTERVAL="$(grep -A40 '^prMonitor:' "$CONFIG" 2>/dev/null | grep -m1 -E '^[[:space:]]*intervalSeconds:' | awk '{print $2}' || true)"
[[ -n "${INTERVAL:-}" ]] || INTERVAL=120
MAX_MIN="$(grep -A40 '^prMonitor:' "$CONFIG" 2>/dev/null | grep -m1 -E '^[[:space:]]*maxDurationMinutes:' | awk '{print $2}' || true)"
[[ -n "${MAX_MIN:-}" ]] || MAX_MIN=240

LOG_SUBDIR="${TASK_ID:-_adhoc}"
MON_LOG_DIR="$ROOT/$ART_ROOT/$LOG_SUBDIR/logs/pr-monitor"
mkdir -p "$MON_LOG_DIR"
MON_LOG="$MON_LOG_DIR/monitor-${PR_NUM}.log"
PID_FILE="$MON_LOG_DIR/monitor-${PR_NUM}.pid"

nohup "$SCRIPT_DIR/start-pr-monitor.sh" --pr "$PR_NUM" --interval "$INTERVAL" --max-minutes "$MAX_MIN" >>"$MON_LOG" 2>&1 &
echo $! >"$PID_FILE"
echo "after-pr-create: started PR #${PR_NUM} monitor PID $(cat "$PID_FILE") (log: $MON_LOG)"
