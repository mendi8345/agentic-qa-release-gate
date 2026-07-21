# Agent Instructions

## Project

Small .NET 8 API used to practise CI, pull-request workflows, automated testing, and agent-driven development.

## Work style

- Inspect the relevant code and tests before editing.
- For implementation tasks started manually or without a recorded Quality Map approval, present a short plan first and wait for approval.
- For tasks launched from a GitHub Issue after `/quality-map approve` or `/quality-map retry-implementation`, the linked human approval and approved Quality Map analysis satisfy the implementation approval gate. State a short plan in the task log, then continue without waiting for another approval.
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

For a Quality Map approved implementation task, successful completion requires an open pull request created through Codex's native GitHub publishing flow. Do not run `git commit`, `git push`, or `gh pr create` from the task shell when the workspace is not a normal Git checkout. After implementation and validation, publish the task changes using the Codex product's native pull-request action and return the PR URL. If native PR publishing is unavailable or fails, report `IMPLEMENTATION DELIVERY FAILED — NATIVE PUBLISHING UNAVAILABLE`, include the exact limitation or error and the Codex task URL, and do not claim successful completion.
