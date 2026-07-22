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

## Setup script field

Paste this entire wrapper into the Codex Environment **Setup script** field:

```bash
set -euo pipefail

SETUP_FILE="scripts/codex-environment-setup.sh"
MAINTENANCE_FILE="scripts/codex-environment-maintenance.sh"
TRUSTED_MAINTENANCE="${HOME}/.codex/quality-map-maintenance.sh"

printf '%s  %s\n' \
  'deebc0196da7a4a9be134fccd8baa95bd0aaba44b80fd468465bc8a5c29011bb' \
  "${SETUP_FILE}" \
  | sha256sum --check

printf '%s  %s\n' \
  '6789bca50d4de090a4c0fdfe579e68a8307905ce8390a30c75ac9f4f19f2f96a' \
  "${MAINTENANCE_FILE}" \
  | sha256sum --check

install -D -m 700 "${MAINTENANCE_FILE}" "${TRUSTED_MAINTENANCE}"
bash "${SETUP_FILE}"
```

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
  echo "ERROR: Trusted maintenance script is missing. Reset the Codex Environment cache." >&2
  exit 1
fi

printf '%s  %s\n' \
  '6789bca50d4de090a4c0fdfe579e68a8307905ce8390a30c75ac9f4f19f2f96a' \
  "${TRUSTED_MAINTENANCE}" \
  | sha256sum --check

bash "${TRUSTED_MAINTENANCE}"
```

## Activation

After changing either Environment field:

1. Save the Environment.
2. Select **Reset cache**.
3. Start the next Codex task.

The Setup wrapper fails before the agent starts when either repository script differs from the reviewed version. The Maintenance wrapper fails before the agent starts when the trusted copy is missing or changed.

Whenever either repository script is intentionally changed, review and merge that change first, recalculate its SHA-256 value, and update the corresponding wrapper value in Codex Environment settings.
