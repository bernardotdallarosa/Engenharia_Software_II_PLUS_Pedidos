# Escreve terraform/rds.env apos terraform apply (Windows / mesmo fluxo que o Makefile).
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$TfDir = Join-Path $Root "terraform"

Push-Location $TfDir
try {
    $authAddr = terraform output -raw rds_address
    $authPort = terraform output -raw rds_port
    $pedAddr = terraform output -raw rds_ped_address
    $pedPort = terraform output -raw rds_ped_port
    $utf8 = New-Object System.Text.UTF8Encoding $false

    $authPath = Join-Path $TfDir "rds.env"
    [System.IO.File]::WriteAllText($authPath, "DB_HOST=$authAddr`nDB_PORT=$authPort`n", $utf8)
    Write-Host "[write-rds-env] wrote $authPath (auth)"
    Get-Content $authPath

    $pedPath = Join-Path $TfDir "rds-ped.env"
    [System.IO.File]::WriteAllText($pedPath, "DB_HOST=$pedAddr`nDB_PORT=$pedPort`n", $utf8)
    Write-Host "[write-rds-env] wrote $pedPath (pedidos)"
    Get-Content $pedPath
}
finally {
    Pop-Location
}
