# Repository instructions

## Purpose

This is a small .NET 8 training repository for practicing agent-driven development, pull request review, automated testing, and CI quality gates.

## Before changing code

- Read the full issue and every acceptance criterion.
- Inspect the relevant production code and existing tests.
- State a short implementation plan, including the files likely to change and the tests to add.
- Ask for clarification when required behavior is not defined; do not invent product rules.

## Change rules

- Make only changes required by the issue.
- Do not perform unrelated refactoring, renaming, or formatting.
- Preserve existing behavior unless the issue explicitly changes it.
- Every behavioral change must include automated regression tests.
- Prefer a small, focused implementation.

## Quality expectations

- Cover the happy path, negative cases, and relevant boundary cases.
- Verify every acceptance criterion explicitly.
- Keep missing-resource behavior distinct from invalid-input behavior.
- Do not claim success without running the required commands.

## Required validation

Run from the repository root:

1. `dotnet restore AgenticQaLab.sln`
2. `dotnet build AgenticQaLab.sln --configuration Release --no-restore`
3. `dotnet test AgenticQaLab.sln --configuration Release --no-build`

## Pull request report

Include:

- What changed.
- Which acceptance criteria are covered.
- Tests added or changed.
- Commands run and their results.
- Assumptions, unresolved questions, and remaining risks.
