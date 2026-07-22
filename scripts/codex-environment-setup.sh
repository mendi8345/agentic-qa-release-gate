#!/usr/bin/env bash
# Codex Cloud Environment setup script.
# Canonical setup implementation. Invoke it through the checksum-pinned wrapper documented in
# `docs/codex-environment-delivery.md`; do not duplicate this full file in environment settings.
# Required environment variable: QUALITY_MAP_REPOSITORY=OWNER/REPOSITORY
# Required secret: QUALITY_MAP_GITHUB_TOKEN=<fine-grained GitHub PAT>
# Do not enable shell tracing (`set -x`), because it may expose credentials.

set -euo pipefail

: "${QUALITY_MAP_REPOSITORY:?Missing QUALITY_MAP_REPOSITORY (expected OWNER/REPOSITORY)}"
: "${QUALITY_MAP_GITHUB_TOKEN:?Missing Codex secret QUALITY_MAP_GITHUB_TOKEN}"

GIT_NAME="${QUALITY_MAP_GIT_NAME:-Codex Agent}"
GIT_EMAIL="${QUALITY_MAP_GIT_EMAIL:-codex-agent@users.noreply.github.com}"
REMOTE_URL="https://github.com/${QUALITY_MAP_REPOSITORY}.git"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: Setup is not running inside the checked-out repository." >&2
  exit 1
fi

git config --global user.name "${GIT_NAME}"
git config --global user.email "${GIT_EMAIL}"
git config --global credential.helper store
git config --global credential.useHttpPath true

# Persist a repository-scoped HTTPS credential for the later agent phase.
# Codex removes secrets before the agent starts, so Git must already know how
# to authenticate when the agent executes `git push`.
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

# Verify that the token can access this repository and has push permission.
curl --fail --silent --show-error \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${QUALITY_MAP_GITHUB_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/${QUALITY_MAP_REPOSITORY}" \
  | python3 -c '
import json
import sys

repository = json.load(sys.stdin)
permissions = repository.get("permissions") or {}
if permissions.get("push") is not True:
    raise SystemExit(
        "ERROR: QUALITY_MAP_GITHUB_TOKEN can access the repository but does not have push permission."
    )
print("GitHub token check passed: repository is accessible and push permission is available.")
'

git ls-remote origin HEAD >/dev/null

echo "Codex Git setup completed."
echo "Repository: ${QUALITY_MAP_REPOSITORY}"
echo "Origin: ${REMOTE_URL}"
