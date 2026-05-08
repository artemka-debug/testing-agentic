#!/usr/bin/env bash
# Poll GitHub PR checks and recent comments (outline for pr-monitor-manager skill).
# Usage: start-pr-monitor.sh --pr <number> [--repo owner/name] [--interval 120] [--max-minutes 240]
set -euo pipefail

PR=""
REPO_SLUG=""
INTERVAL=120
MAX_MIN=240
START_TS="$(date +%s)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr) PR="${2:-}"; shift 2 ;;
    --repo) REPO_SLUG="${2:-}"; shift 2 ;;
    --interval) INTERVAL="${2:-}"; shift 2 ;;
    --max-minutes) MAX_MIN="${2:-}"; shift 2 ;;
    *) shift ;;
  esac
done

[[ -n "$PR" ]] || { echo "start-pr-monitor: --pr required" >&2; exit 1; }

gh_cmd=(gh pr view "$PR" --json title,state,statusCheckRollup,reviewDecision,url)
[[ -n "$REPO_SLUG" ]] && gh_cmd+=(--repo "$REPO_SLUG")

echo "start-pr-monitor: polling PR #$PR every ${INTERVAL}s (max ${MAX_MIN}m)"

while true; do
  now="$(date +%s)"
  elapsed=$(( (now - START_TS) / 60 ))
  if [[ "$elapsed" -ge "$MAX_MIN" ]]; then
    echo "start-pr-monitor: max duration reached (${MAX_MIN}m)" >&2
    exit 0
  fi

  "${gh_cmd[@]}" || { echo "start-pr-monitor: gh pr view failed" >&2; exit 1; }

  STATE="$(gh pr view "$PR" ${REPO_SLUG:+--repo "$REPO_SLUG"} --json state -q .state)"
  if [[ "$STATE" != "OPEN" ]]; then
    echo "start-pr-monitor: PR no longer OPEN ($STATE); exiting"
    exit 0
  fi

  echo "--- checks ---"
  gh pr checks "$PR" ${REPO_SLUG:+--repo "$REPO_SLUG"} || true

  sleep "$INTERVAL"
done
