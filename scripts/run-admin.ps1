<#
.SYNOPSIS
    Runs the internal admin dashboard (apps/admin) in development mode.
#>
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    pnpm --filter "@the-ride/admin" dev
}
finally {
    Pop-Location
}
