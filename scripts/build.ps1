<#
.SYNOPSIS
    Builds all apps and packages via Turborepo.
.PARAMETER Filter
    Optional Turborepo --filter value to build a single app/package
    (e.g. "@the-ride/web").
#>
param(
    [string]$Filter
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    if ($Filter) {
        Write-Host "==> Building $Filter..." -ForegroundColor Cyan
        pnpm turbo run build --filter="$Filter"
    }
    else {
        Write-Host "==> Building all apps and packages..." -ForegroundColor Cyan
        pnpm turbo run build
    }
    if ($LASTEXITCODE -ne 0) { throw "Build failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}

Write-Host "==> Build complete." -ForegroundColor Green
