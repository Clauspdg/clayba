<#
.SYNOPSIS
    Installs all workspace dependencies for The Ride monorepo.
#>
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "==> Checking prerequisites..." -ForegroundColor Cyan

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Error "pnpm is not installed. Install it first: npm install -g pnpm"
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed. Install Node.js 20+ first."
    exit 1
}

Write-Host "==> Installing workspace dependencies with pnpm..." -ForegroundColor Cyan
Push-Location $root
try {
    pnpm install
    if ($LASTEXITCODE -ne 0) { throw "pnpm install failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}

Write-Host "==> Setting up Husky git hooks..." -ForegroundColor Cyan
Push-Location $root
try {
    pnpm exec husky
}
finally {
    Pop-Location
}

Write-Host "==> Done. Copy .env.example to .env (root and each app) and fill in credentials." -ForegroundColor Green
