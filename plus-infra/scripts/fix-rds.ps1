# Regenera terraform/rds*.env a partir do Terraform e recria os microsservicos que usam PostgreSQL.
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_ps-lib.ps1"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path "terraform/terraform.tfstate")) {
    Write-Host '[fix-rds] ERRO: terraform/terraform.tfstate nao encontrado.'
    Write-Host '  Execute primeiro: make setup'
    exit 1
}

Write-Host '[fix-rds] Regenerando rds.env e rds-ped.env...'
Invoke-LocalScript "$PSScriptRoot\write-rds-env.ps1"

Write-Host '[fix-rds] Recriando plus-ms-auth e plus-ms-ped...'
docker compose up -d --force-recreate plus-ms-auth plus-ms-ped
Assert-ExternalExit

Write-Host '[fix-rds] Aguarde alguns segundos e teste:'
Write-Host '  http://localhost:3001/health'
Write-Host '  http://localhost:3007/health'
