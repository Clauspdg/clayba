<#
.SYNOPSIS
    Runs the passenger mobile app (apps/passenger-app) via Expo.
#>
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    pnpm --filter "@the-ride/passenger-app" start
}
finally {
    Pop-Location
}
