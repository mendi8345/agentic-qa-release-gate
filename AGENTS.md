# Agent Instructions

## Project

Small .NET 8 API used to practise CI, pull-request workflows, automated testing, and agent-driven development.

## Work style

- Inspect the relevant code and tests before editing.
- For implementation tasks started manually or without a recorded Quality Map approval, present a short plan first and wait for approval.
- For tasks launched inside an existing draft pull request after `/quality-map approve` or `/quality-map retry-implementation`, the linked human approval and approved Quality Map analysis satisfy the implementation approval gate. State a short plan, then continue without waiting for another approval.
- Keep changes small and limited to the requested behaviour.
- Do not refactor unrelated code or change public API contracts unless requested.
- State assumptions and unresolved questions instead of inventing requirements.

## Validation

Run from the repository root:

- `dotnet restore AgenticQaLab.sln`
- `dotnet build AgenticQaLab.sln --no-restore`
- `dotnet test AgenticQaLab.sln --no-build`

Every behavioural change must include automated tests. Cover the happy path, negative cases, and relevant boundary cases.

## Completion report

Before finishing, report:

- Files changed and why.
- Tests added or changed.
- Commands run and their results.
- Remaining risks or assumptions.

## Quality Map PR-first delivery

For a Quality Map approved implementation task:

- Work only in the existing draft pull request and its current branch.
- Do not create another branch or another pull request.
- Do not call `make_pr`.
- Do not rely on `git push` from a workspace without a configured Git remote.
- Apply implementation changes through the GitHub pull-request integration available from PR context.
- Remove the bootstrap handoff file under `.quality-map/requests/` before completion.
- Successful completion requires the implementation and test changes to be visible in the existing PR and the validation results to be reported there.
- If the PR branch cannot be updated, report `IMPLEMENTATION DELIVERY FAILED — PR BRANCH UPDATE UNAVAILABLE` with the exact limitation instead of claiming completion.
