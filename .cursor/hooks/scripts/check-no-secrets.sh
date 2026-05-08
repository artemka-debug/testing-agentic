#!/usr/bin/env bash
# Lightweight secret-pattern scan on staged diff (pre-PR). Expand with gitleaks/trufflehog in CI.
# Usage: check-no-secrets.sh [--repo <path>] [--staged-only]
set -euo pipefail

REPO_ROOT=""
STAGED_ONLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO_ROOT="${2:-}"; shift 2 ;;
    --staged-only) STAGED_ONLY=1; shift ;;
    *) shift ;;
  esac
done

if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "check-no-secrets: not a git repo" >&2; exit 1; }
fi

DIFF_ARGS=( )
if [[ "$STAGED_ONLY" -eq 1 ]]; then
  DIFF_ARGS=(git -C "$REPO_ROOT" diff --cached)
else
  BASE="$(git -C "$REPO_ROOT" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo main)"
  DIFF_ARGS=(git -C "$REPO_ROOT" diff "origin/$BASE"...HEAD)
fi

TMP="$("${DIFF_ARGS[@]}" 2>/dev/null || true)"
FOUND=0

if echo "$TMP" | grep -Fq 'PRIVATE KEY-----'; then
  echo "check-no-secrets: possible PEM private key material in diff" >&2
  FOUND=1
fi
if echo "$TMP" | grep -Eq 'AKIA[0-9A-Z]{16}'; then
  echo "check-no-secrets: possible AWS access key id pattern in diff" >&2
  FOUND=1
fi
if echo "$TMP" | grep -Eiq 'gh[pousr]_[A-Za-z0-9]{36,}'; then
  echo "check-no-secrets: possible GitHub token pattern in diff" >&2
  FOUND=1
fi
if echo "$TMP" | grep -Eq 'xox[baprs]-'; then
  echo "check-no-secrets: possible Slack token pattern in diff" >&2
  FOUND=1
fi

if [[ "$FOUND" -ne 0 ]]; then
  exit 1
fi

echo "check-no-secrets: OK"
