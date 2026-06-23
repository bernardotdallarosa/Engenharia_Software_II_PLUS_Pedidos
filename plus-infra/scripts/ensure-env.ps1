# Garante plus-infra/.env e gera JWT_SECRET se ainda for placeholder.
param(
    [string]$EnvFile = ".env",
    [string]$ExampleFile = ".env.example"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path $EnvFile)) {
    if (-not (Test-Path $ExampleFile)) {
        Write-Error "[ensure-env] $ExampleFile não encontrado."
    }
    Copy-Item $ExampleFile $EnvFile
    Write-Host "[ensure-env] Criado $EnvFile a partir de $ExampleFile."
}

$lines = Get-Content $EnvFile
$placeholders = @("change-me-in-production", "change-me", "dev-secret", "")
$jwtIndex = -1
$jwtValue = $null

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*JWT_SECRET\s*=\s*(.*)\s*$') {
        $jwtIndex = $i
        $jwtValue = $Matches[1].Trim().Trim('"').Trim("'")
        break
    }
}

$needsSecret = $false
if ($jwtIndex -lt 0) {
    $needsSecret = $true
} elseif ($placeholders -contains $jwtValue -or $jwtValue.Length -lt 16) {
    $needsSecret = $true
}

if ($needsSecret) {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)

    if ($jwtIndex -ge 0) {
        $lines[$jwtIndex] = "JWT_SECRET=$secret"
    } else {
        $lines += "JWT_SECRET=$secret"
    }

    Set-Content -Path $EnvFile -Value $lines -Encoding utf8
    Write-Host "[ensure-env] JWT_SECRET gerado automaticamente (não commite o .env)."
} else {
    Write-Host "[ensure-env] JWT_SECRET já definido em $EnvFile."
}
