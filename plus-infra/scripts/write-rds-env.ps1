# Escreve terraform/rds.env apos terraform apply (Windows / mesmo fluxo que o Makefile).
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$TfDir = Join-Path $Root "terraform"

Push-Location $TfDir
try {
    $addr = terraform output -raw rds_address
    $port = terraform output -raw rds_port
    $path = Join-Path $TfDir "rds.env"
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($path, "DB_HOST=$addr`nDB_PORT=$port`n", $utf8)
    Write-Host "[write-rds-env] wrote $path"
    Get-Content $path
}
finally {
    Pop-Location
}
