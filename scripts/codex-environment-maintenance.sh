#!/usr/bin/env bash
# Codex Cloud Environment maintenance script.
# Reinstalls missing tooling and reasserts the PAT after Codex checks out a task branch.
# This prevents a cached resume from falling back to the read-only connector bot credential.

set -euo pipefail

: "${QUALITY_MAP_REPOSITORY:?Missing QUALITY_MAP_REPOSITORY (expected OWNER/REPOSITORY)}"
: "${QUALITY_MAP_GITHUB_TOKEN:?Missing Codex secret QUALITY_MAP_GITHUB_TOKEN}"

GIT_NAME="${QUALITY_MAP_GIT_NAME:-Codex Agent}"
GIT_EMAIL="${QUALITY_MAP_GIT_EMAIL:-codex-agent@users.noreply.github.com}"
REMOTE_URL="https://github.com/${QUALITY_MAP_REPOSITORY}.git"
DOTNET_INSTALL_DIR="/usr/local/share/dotnet"

ensure_dotnet() {
  if command -v dotnet >/dev/null 2>&1; then
    echo "dotnet available: $(dotnet --version)"
    return
  fi

  echo "Installing missing .NET 8 SDK..."
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh \
    --channel 8.0 \
    --quality GA \
    --install-dir "${DOTNET_INSTALL_DIR}" \
    --no-path
  ln -sfn "${DOTNET_INSTALL_DIR}/dotnet" /usr/local/bin/dotnet
  echo "dotnet installed: $(dotnet --version)"
}

configure_git_delivery() {
  git config --global user.name "${GIT_NAME}"
  git config --global user.email "${GIT_EMAIL}"

  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "${REMOTE_URL}"
  else
    git remote add origin "${REMOTE_URL}"
  fi

  # Checkout can reintroduce the connector bot's repository-local auth.
  # Reset it on every cached resume, then approve the repository-scoped PAT again.
  git config --local --unset-all credential.helper || true
  git config --local --add credential.helper ""
  git config --local --add credential.helper store
  git config --local credential.useHttpPath true

  git config --local --unset-all http.https://github.com/.extraheader || true
  git config --local --add http.https://github.com/.extraheader ""
  git config --local --unset-all http.extraheader || true
  git config --local --add http.extraheader ""

  printf 'protocol=https\nhost=github.com\npath=%s.git\n\n' \
    "${QUALITY_MAP_REPOSITORY}" \
    | git credential reject || true

  printf 'protocol=https\nhost=github.com\npath=%s.git\nusername=x-access-token\npassword=%s\n\n' \
    "${QUALITY_MAP_REPOSITORY}" \
    "${QUALITY_MAP_GITHUB_TOKEN}" \
    | git credential approve

  if [[ -f "${HOME}/.git-credentials" ]]; then
    chmod 600 "${HOME}/.git-credentials"
  fi

  selected_username="$(
    printf 'protocol=https\nhost=github.com\npath=%s.git\n\n' "${QUALITY_MAP_REPOSITORY}" \
      | git credential fill \
      | sed -n 's/^username=//p'
  )"

  if [[ "${selected_username}" != "x-access-token" ]]; then
    echo "ERROR: Git selected an unexpected GitHub credential: ${selected_username:-<none>}" >&2
    exit 1
  fi
}

ensure_dotnet
configure_git_delivery

echo "Codex environment maintenance completed."
echo "Origin: ${REMOTE_URL}"
