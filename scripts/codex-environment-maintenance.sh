#!/usr/bin/env bash
# Codex Cloud Environment maintenance script.
# Reasserts local Git configuration when a cached container resumes.
# It deliberately avoids network checks so a transient proxy failure cannot abort the task
# before the agent can report the exact Git error in the pull request.

set -euo pipefail

: "${QUALITY_MAP_REPOSITORY:?Missing QUALITY_MAP_REPOSITORY (expected OWNER/REPOSITORY)}"

REMOTE_URL="https://github.com/${QUALITY_MAP_REPOSITORY}.git"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "${REMOTE_URL}"
else
  git remote add origin "${REMOTE_URL}"
fi

if [[ ! -s "${HOME}/.git-credentials" ]]; then
  echo "WARNING: Persisted GitHub credentials are missing; the agent delivery preflight will report the exact failure." >&2
fi

echo "Codex Git maintenance completed."
echo "Origin: ${REMOTE_URL}"
