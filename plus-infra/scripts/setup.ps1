# Setup completo da stack local (equivalente a `make setup` no Windows, sem precisar de Make).
# Uso: cd plus-infra && powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host ""
Write-Host "[setup] plus-infra — iniciando setup completo"
Write-Host ""

& "$PSScriptRoot\ensure-env.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[setup] Subindo Ministack..."
docker compose up -d ministack
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& "$PSScriptRoot\wait-ministack.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[setup] Inicializando Terraform..."
terraform -chdir=terraform init
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& "$PSScriptRoot\tf-apply-from-env.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& "$PSScriptRoot\sync-vite-gateway-url.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[setup] Atualizando terraform/rds.env e rds-ped.env (IPs do Postgres emulado)..."
& "$PSScriptRoot\write-rds-env.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[setup] Rebuild dos MFEs e do shell (variaveis de build)..."
docker compose build plus-mfe-auth plus-mfe-ped plus-shell
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[setup] Subindo todos os servicos..."
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "[setup] Concluido."
Write-Host "  Shell:       http://localhost:3000"
Write-Host "  Swagger:     http://localhost:3007/docs"
Write-Host "  Login teste: admindev@admin.com / Senha123"
Write-Host ""
Write-Host "Se algum MS falhar com ECONNREFUSED, execute: make fix-rds"
Write-Host ""
