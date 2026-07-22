#!/usr/bin/env bash
# Codex Cloud Environment maintenance script.
# Configure this script in the Codex Environment "Maintenance script" field.
# It runs when Codex resumes a cached container.

set -euo pipefail

: "${QUALITY_MAP_REPOSITORY:?Missing QUALITY_MAP_REPOSITORY (expected OWNER/REPOSITORY)}"

REMOTE_URL="https://github.com/${QUALITY_MAP_REPOSITORY}.git"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: Maintenance is not running inside the checked-out repository." >&2
  exit 1
fi

# A cached task may check out a different branch or worktree. Reassert the
# correct repository remote every time the cache is resumed.
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "${REMOTE_URL}"
else
  git remote add origin "${REMOTE_URL}"
fi

if [[ ! -s "${HOME}/.git-credentials" ]]; then
  echo "ERROR: Persisted GitHub credentials are missing. Reset the environment cache so the Setup script runs again." >&2
  exit 1
fi

# Fail before the agent starts if the cached environment cannot authenticate.
git ls-remote origin HEAD >/dev/null

echo "Codex Git maintenance check passed."
echo "Origin: ${REMOTE_URL}"
