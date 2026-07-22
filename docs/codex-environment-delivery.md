# Codex Environment Git delivery

The canonical setup and maintenance logic lives in:

- `scripts/codex-environment-setup.sh`
- `scripts/codex-environment-maintenance.sh`

Use the checksum-pinned wrappers below in Codex Environment settings.

## Required Environment configuration

Environment variable:

```text
QUALITY_MAP_REPOSITORY=mendi8345/agentic-qa-release-gate
```

Secret:

```text
QUALITY_MAP_GITHUB_TOKEN=<fine-grained GitHub PAT with repository Contents read/write>
```

Agent internet access must allow `github.com` and the HTTP methods required by Git smart HTTP, including POST.

## Setup script field

```bash
set -euo pipefail

SETUP_FILE="scripts/codex-environment-setup.sh"
MAINTENANCE_FILE="scripts/codex-environment-maintenance.sh"
TRUSTED_MAINTENANCE="${HOME}/.codex/quality-map-maintenance.sh"

printf '%s  %s\n' \
  '138fc3769860f66de22cdf8460e6928e6ac4882f30290ae31536929243e79141' \
  "${SETUP_FILE}" \
  | sha256sum --check

printf '%s  %s\n' \
  'a2095ed5a91e442ce2eaa27d6661bca6e5d155f41e0c6998b201fb656b50c3a1' \
  "${MAINTENANCE_FILE}" \
  | sha256sum --check

install -D -m 700 "${MAINTENANCE_FILE}" "${TRUSTED_MAINTENANCE}"
bash "${SETUP_FILE}"
```

The setup script:

- installs the .NET 8 SDK when it is missing;
- configures Git identity and `origin`;
- clears repository-local connector-bot authentication that can override the PAT;
- stores the repository-scoped PAT and verifies that Git selects `x-access-token`.

The wrapper copies the reviewed maintenance script outside the repository so a cached task can safely use it even after checking out an older task branch.

## Maintenance script field

```bash
set -euo pipefail

TRUSTED_MAINTENANCE="${HOME}/.codex/quality-map-maintenance.sh"

if [[ ! -f "${TRUSTED_MAINTENANCE}" ]]; then
  echo "ERROR: Trusted maintenance script is missing. Save the Environment again so a fresh cache is built." >&2
  exit 1
fi

printf '%s  %s\n' \
  'a2095ed5a91e442ce2eaa27d6661bca6e5d155f41e0c6998b201fb656b50c3a1' \
  "${TRUSTED_MAINTENANCE}" \
  | sha256sum --check

bash "${TRUSTED_MAINTENANCE}"
```

On every cached resume, maintenance runs after Codex checks out the task branch. It reinstalls missing .NET tooling and reapplies the PAT after removing any connector-bot credential or authorization header introduced by checkout.

## Activation

After these repository changes are merged:

1. Replace both wrappers in Codex Environment settings.
2. Save the Environment.
3. Select **Reset cache** once.
4. Retry the existing implementation task.

Codex automatically invalidates cached state when scripts, environment variables, or secrets change. The explicit reset here ensures the trusted maintenance copy and .NET installation are rebuilt from the merged default branch before retrying the existing PR.

Network delivery is still verified by the implementation task using `git ls-remote`, `git push`, and a local-versus-remote SHA comparison.
