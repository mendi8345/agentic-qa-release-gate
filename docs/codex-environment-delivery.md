# Codex Environment Git delivery

The canonical Git setup and maintenance logic lives in:

- `scripts/codex-environment-setup.sh`
- `scripts/codex-environment-maintenance.sh`

Do not duplicate those full files in Codex Environment settings. Use the short checksum-pinned wrappers below.

## Required Environment configuration

Environment variable:

```text
QUALITY_MAP_REPOSITORY=mendi8345/agentic-qa-release-gate
```

Secret:

```text
QUALITY_MAP_GITHUB_TOKEN=<fine-grained GitHub PAT with repository Contents read/write>
```

Agent internet access must allow GitHub delivery during the agent phase. Allow `github.com` and permit the HTTP methods required by Git smart HTTP, including POST.

## Setup script field

Paste this entire wrapper into the Codex Environment **Setup script** field:

```bash
set -euo pipefail

SETUP_FILE="scripts/codex-environment-setup.sh"
MAINTENANCE_FILE="scripts/codex-environment-maintenance.sh"
TRUSTED_MAINTENANCE="${HOME}/.codex/quality-map-maintenance.sh"

printf '%s  %s\n' \
  '8af4ecaa2ca34a68598479ce675d71b476b9aa8f0f4a632b4681bc64e42a0d70' \
  "${SETUP_FILE}" \
  | sha256sum --check

printf '%s  %s\n' \
  '4e26df5c4c0da5e5e8b7afbde5fc573da51952164808db11167852032847e6d2' \
  "${MAINTENANCE_FILE}" \
  | sha256sum --check

install -D -m 700 "${MAINTENANCE_FILE}" "${TRUSTED_MAINTENANCE}"
bash "${SETUP_FILE}"
```

The setup script configures Git identity, the repository-scoped credential, and `origin`. It deliberately does not perform external network checks. A transient GitHub or proxy failure must not abort the task before Codex can report the exact delivery error.

Why the wrapper copies the maintenance file outside the repository:

- A fresh cached container is prepared from the default branch, where the approved scripts exist.
- A later task may check out an older PR branch that does not contain those files.
- The trusted copy remains in the cached container and cannot be replaced by changes in the task branch.

## Maintenance script field

Paste this entire wrapper into the Codex Environment **Maintenance script** field:

```bash
set -euo pipefail

TRUSTED_MAINTENANCE="${HOME}/.codex/quality-map-maintenance.sh"

if [[ ! -f "${TRUSTED_MAINTENANCE}" ]]; then
  echo "ERROR: Trusted maintenance script is missing. Save the Environment again so a fresh cache is built." >&2
  exit 1
fi

printf '%s  %s\n' \
  '4e26df5c4c0da5e5e8b7afbde5fc573da51952164808db11167852032847e6d2' \
  "${TRUSTED_MAINTENANCE}" \
  | sha256sum --check

bash "${TRUSTED_MAINTENANCE}"
```

The maintenance script only restores local Git configuration. Network authentication and push verification belong to the Codex implementation task, where failures can be reported with the exact command output.

## Activation

After changing either Environment field:

1. Save the Environment.
2. The cache is invalidated automatically when the scripts change.
3. Start the next Codex task only after the save completes.

The checksum wrappers fail only when the reviewed repository scripts are missing or have changed. Network delivery is verified later by Codex using `git ls-remote`, `git push`, and a local-versus-remote SHA comparison.

Whenever either repository script is intentionally changed, review and merge that change first, recalculate its SHA-256 value, and update the corresponding wrapper value in Codex Environment settings.
