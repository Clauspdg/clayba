<#
.SYNOPSIS
    Runs lint, type-check, and unit tests across the monorepo via Turborepo.
.PARAMETER Filter
    Optional Turborepo --filter value to test a single app/package.
#>
param(
    [string]$Filter
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    $filterArg = if ($Filter) { "--filter=$Filter" } else { "" }

    Write-Host "==> Linting..." -ForegroundColor Cyan
    pnpm turbo run lint $filterArg
    if ($LASTEXITCODE -ne 0) { throw "Lint failed with exit code $LASTEXITCODE" }

    Write-Host "==> Type-checking..." -ForegroundColor Cyan
    pnpm turbo run type-check $filterArg
    if ($LASTEXITCODE -ne 0) { throw "Type-check failed with exit code $LASTEXITCODE" }

    Write-Host "==> Running tests..." -ForegroundColor Cyan
    pnpm turbo run test $filterArg
    if ($LASTEXITCODE -ne 0) { throw "Tests failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}

Write-Host "==> All checks passed." -ForegroundColor Green
