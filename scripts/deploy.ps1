<#
.SYNOPSIS
    Deploys The Ride to Firebase.
.PARAMETER Target
    What to deploy: "all" (default), "functions", "hosting", "rules".
.PARAMETER Project
    Firebase project alias to deploy to (default/development/staging/production).
    Defaults to whatever is currently active per .firebaserc.
#>
param(
    [ValidateSet("all", "functions", "hosting", "rules")]
    [string]$Target = "all",

    [string]$Project
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Error "Firebase CLI is not installed. Install it first: npm install -g firebase-tools"
    exit 1
}

Push-Location $root
try {
    Write-Host "==> Building web and admin for deployment..." -ForegroundColor Cyan
    pnpm turbo run build --filter="@the-ride/web" --filter="@the-ride/admin"
    if ($LASTEXITCODE -ne 0) { throw "Build failed with exit code $LASTEXITCODE" }

    $projectArg = if ($Project) { "--project", $Project } else { @() }

    switch ($Target) {
        "functions" {
            Write-Host "==> Deploying Cloud Functions..." -ForegroundColor Cyan
            firebase deploy --only functions @projectArg
        }
        "hosting" {
            Write-Host "==> Deploying Hosting (web + admin)..." -ForegroundColor Cyan
            firebase deploy --only hosting @projectArg
        }
        "rules" {
            Write-Host "==> Deploying Firestore + Storage rules..." -ForegroundColor Cyan
            firebase deploy --only firestore:rules,storage @projectArg
        }
        default {
            Write-Host "==> Deploying everything (hosting, functions, rules)..." -ForegroundColor Cyan
            firebase deploy @projectArg
        }
    }
    if ($LASTEXITCODE -ne 0) { throw "firebase deploy failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}

Write-Host "==> Deploy complete." -ForegroundColor Green
