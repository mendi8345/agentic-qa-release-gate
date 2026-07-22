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

1. Work only in the existing draft pull request and the exact target branch named in the task.
2. Do not create another branch or another pull request.
3. Do not call `make_pr`.
4. Before editing, verify Git delivery is available:
   - Run `git remote -v`.
   - `origin` must point to `https://github.com/${QUALITY_MAP_REPOSITORY}.git`.
   - When `origin` is missing but `QUALITY_MAP_REPOSITORY` is available, add it with:
     `git remote add origin "https://github.com/${QUALITY_MAP_REPOSITORY}.git"`
   - When `origin` points elsewhere, correct it with:
     `git remote set-url origin "https://github.com/${QUALITY_MAP_REPOSITORY}.git"`
   - Run `git ls-remote origin HEAD` and stop immediately if GitHub cannot be reached or authenticated.
5. Implement only the approved scope, add the required tests, and run all validation commands.
6. Remove the bootstrap handoff file under `.quality-map/requests/` before completion.
7. Commit all validated implementation and test changes.
8. Push the current commit to the exact existing PR branch:
   `git push origin HEAD:<TARGET_BRANCH>`
9. Verify delivery after the push:
   - Record `git rev-parse HEAD` as the local SHA.
   - Read the remote branch SHA with:
     `git ls-remote --heads origin refs/heads/<TARGET_BRANCH>`
   - Successful completion requires the local SHA and remote branch SHA to match.
   - The implementation files must be visible in the existing PR and the handoff file must be absent.
10. Never treat a local commit, clean working tree, test result, or task summary as proof that the PR was updated.

If remote verification or push fails, report exactly:

`IMPLEMENTATION DELIVERY FAILED — PR BRANCH UPDATE UNAVAILABLE`

Include:

- `git remote -v`
- `git rev-parse HEAD`
- the exact target branch
- the complete output from `git ls-remote` or `git push`

Do not claim successful delivery when the remote SHA was not verified.
