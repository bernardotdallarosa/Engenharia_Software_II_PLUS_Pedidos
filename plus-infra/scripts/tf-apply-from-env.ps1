# Lê plus-infra/.env e corre terraform apply com os TF_VAR esperados pelo Makefile UNIX.
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Push-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Test-Path ".env")) {
    Write-Host "[make] ERRO: .env não encontrado na raiz do plus-infra."
    exit 1
}

$vars = @{}
Get-Content ".env" -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $eq = $line.IndexOf("=")
    if ($eq -lt 1) { return }
    $k = $line.Substring(0, $eq).Trim()
    $v = $line.Substring($eq + 1).Trim()
    $vars[$k] = $v
}

function Get-EnvDefault([string]$key, [string]$default) {
    if ($vars.ContainsKey($key) -and $vars[$key]) { return $vars[$key] }
    return $default
}

$env:TF_VAR_db_name       = Get-EnvDefault "DB_NAME" "plus_auth"
$env:TF_VAR_db_user       = Get-EnvDefault "DB_USER" "plus"
$env:TF_VAR_db_password   = Get-EnvDefault "DB_PASSWORD" "plus_secret"
$env:TF_VAR_ms_auth_port  = Get-EnvDefault "MS_AUTH_PORT" "3001"
$env:TF_VAR_endpoint      = Get-EnvDefault "AWS_ENDPOINT" "http://localhost:4566"

Write-Host "[make] Sincronizando estado com S3/RDS já existentes no Ministack (se aplicável)..."
& "$PSScriptRoot\tf-import-existing-s3-rds.ps1"

Write-Host "[make] Provisionando recursos via Terraform..."
& terraform "-chdir=terraform" apply -auto-approve
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& "$PSScriptRoot\write-rds-env.ps1"
exit 0
