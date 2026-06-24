# Setup completo da stack local (equivalente a make setup no Windows, sem precisar de Make).
# Uso: cd plus-infra && powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_ps-lib.ps1"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host ""
Write-Host '[setup] plus-infra - iniciando setup completo'
Write-Host ""

Invoke-LocalScript "$PSScriptRoot\ensure-env.ps1"

Write-Host '[setup] Subindo Ministack...'
docker compose up -d ministack
Assert-ExternalExit

Invoke-LocalScript "$PSScriptRoot\wait-ministack.ps1"

Write-Host '[setup] Inicializando Terraform...'
terraform -chdir=terraform init
Assert-ExternalExit

Invoke-LocalScript "$PSScriptRoot\tf-apply-from-env.ps1"
Invoke-LocalScript "$PSScriptRoot\sync-vite-gateway-url.ps1"

Write-Host '[setup] Atualizando terraform/rds.env e rds-ped.env...'
Invoke-LocalScript "$PSScriptRoot\write-rds-env.ps1"

Write-Host '[setup] Rebuild dos MFEs e do shell...'
docker compose build plus-mfe-auth plus-mfe-ped plus-shell
Assert-ExternalExit

Write-Host '[setup] Subindo todos os servicos...'
docker compose up -d
Assert-ExternalExit

Write-Host ''
Write-Host '[setup] Concluido.'
Write-Host '  Shell:       http://localhost:3000'
Write-Host '  Swagger:     http://localhost:3007/docs'
Write-Host '  Login teste: admindev@admin.com / Senha123'
Write-Host ''
Write-Host 'Se algum MS falhar com ECONNREFUSED, execute: make fix-rds'
Write-Host ''
