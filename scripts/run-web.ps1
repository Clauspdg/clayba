<#
.SYNOPSIS
    Runs the passenger-facing web app (apps/web) in development mode.
#>
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    pnpm --filter "@the-ride/web" dev
}
finally {
    Pop-Location
}
