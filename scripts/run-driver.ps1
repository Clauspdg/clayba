<#
.SYNOPSIS
    Runs the driver mobile app (apps/driver-app) via Expo.
#>
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    pnpm --filter "@the-ride/driver-app" start
}
finally {
    Pop-Location
}
