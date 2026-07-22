#!/usr/bin/env bash
# Codex Cloud Environment setup script.
# Configures Git identity, repository-scoped credentials, and the GitHub origin.
# Network delivery is verified by the agent so failures are reported in the PR instead of
# aborting the task during environment setup.

set -euo pipefail

: "${QUALITY_MAP_REPOSITORY:?Missing QUALITY_MAP_REPOSITORY (expected OWNER/REPOSITORY)}"
: "${QUALITY_MAP_GITHUB_TOKEN:?Missing Codex secret QUALITY_MAP_GITHUB_TOKEN}"

GIT_NAME="${QUALITY_MAP_GIT_NAME:-Codex Agent}"
GIT_EMAIL="${QUALITY_MAP_GIT_EMAIL:-codex-agent@users.noreply.github.com}"
REMOTE_URL="https://github.com/${QUALITY_MAP_REPOSITORY}.git"

git config --global user.name "${GIT_NAME}"
git config --global user.email "${GIT_EMAIL}"
git config --global credential.helper store
git config --global credential.useHttpPath true

printf 'protocol=https\nhost=github.com\npath=%s.git\nusername=x-access-token\npassword=%s\n\n' \
  "${QUALITY_MAP_REPOSITORY}" \
  "${QUALITY_MAP_GITHUB_TOKEN}" \
  | git credential approve

if [[ -f "${HOME}/.git-credentials" ]]; then
  chmod 600 "${HOME}/.git-credentials"
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "${REMOTE_URL}"
else
  git remote add origin "${REMOTE_URL}"
fi

echo "Codex Git setup completed."
echo "Repository: ${QUALITY_MAP_REPOSITORY}"
echo "Origin: ${REMOTE_URL}"
