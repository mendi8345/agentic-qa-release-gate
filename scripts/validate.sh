#!/usr/bin/env bash
set -euo pipefail

dotnet restore AgenticQaLab.sln
dotnet build AgenticQaLab.sln --configuration Release --no-restore
dotnet test AgenticQaLab.sln --configuration Release --no-build
