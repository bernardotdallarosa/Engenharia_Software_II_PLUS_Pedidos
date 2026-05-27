# Atualiza VITE_MS_AUTH_URL no .env com o output do Terraform (evita copiar/colar manualmente).
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Push-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Test-Path ".env")) {
    Write-Host "[make] ERRO: .env nao encontrado em plus-infra."
    exit 1
}

$tfOut = & terraform "-chdir=terraform" output -raw gateway_url 2>$null
$tfExit = $LASTEXITCODE
if ($tfExit -ne 0 -or [string]::IsNullOrWhiteSpace($tfOut)) {
    Write-Host "[make] Aviso: terraform output gateway_url indisponivel - mantenha VITE_MS_AUTH_URL no .env manualmente se precisar do MFE via Gateway."
    Pop-Location
    exit 0
}
$url = $tfOut.Trim()
$path = Join-Path (Get-Location) ".env"
$lines = Get-Content $path -Encoding UTF8
$found = $false
$newLines = foreach ($line in $lines) {
    if ($line -match '^\s*VITE_MS_AUTH_URL=') {
        $found = $true
        "VITE_MS_AUTH_URL=$url"
    } else {
        $line
    }
}
if (-not $found) {
    $newLines = @($newLines) + "VITE_MS_AUTH_URL=$url"
}
$newLines | Set-Content $path -Encoding UTF8
Write-Host "[make] VITE_MS_AUTH_URL sincronizado com o API Gateway (Terraform)."
Pop-Location
