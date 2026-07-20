# Agentic QA Release Gate Lab

A ready-made .NET 8 practice repository for learning how to manage a coding agent through a GitHub-native delivery flow:

`Issue → Agent plan → Code change → Pull request → CI → QA review → Feedback`

## Baseline application

The repository contains a minimal in-memory Orders API:

- `POST /orders`
- `GET /orders/{id}`
- `PATCH /orders/{id}/status`
- `GET /health`

The baseline intentionally allows any recognized order status transition. That behavior is the first agent exercise; do not fix it before assigning the issue.

## Run locally

```bash
dotnet restore AgenticQaLab.sln
dotnet build AgenticQaLab.sln --configuration Release --no-restore
dotnet test AgenticQaLab.sln --configuration Release --no-build
dotnet run --project src/AgenticQaLab.Api/AgenticQaLab.Api.csproj
```

Then open `http://localhost:5000/health` or use the URL printed by .NET.

## First exercise

Read [`docs/START_HERE.md`](docs/START_HERE.md).

The repository already includes:

- A green baseline CI workflow.
- Repository-wide Copilot instructions.
- A ready-made GitHub issue template.
- A QA review checklist.
- An intentional behavior gap for the agent to solve.
