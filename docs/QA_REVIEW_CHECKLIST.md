# QA review checklist for the agent pull request

## Requirement

- Did the agent implement the exact status flow requested?
- Did it invent or change any product rule?

## Scope

- Are all changed files necessary?
- Is there unrelated refactoring or formatting?

## Behavior

- Are valid transitions accepted?
- Are invalid and same-status transitions rejected?
- Is an unknown status still a 400?
- Is a missing order still a 404?

## Tests

- Does the test set cover the complete 3×3 transition matrix?
- Would the new tests fail against the original implementation?
- Are tests deterministic and readable?

## Evidence

- Is CI green on the latest commit?
- Did the agent report the actual commands it ran?
- Are assumptions and remaining risks stated?
