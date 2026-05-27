# Se o Ministack ainda tiver bucket/RDS de uma corrida anterior mas o .tfstate não os referencia,
# o apply falha com BucketAlreadyExists / DBInstanceAlreadyExists. Importa só o que faltar no state.
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Push-Location $root

function Get-StateAddresses {
    $raw = & terraform "-chdir=terraform" state list 2>$null
    if ($LASTEXITCODE -ne 0) { return @() }
    return @($raw -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}

function Import-IfAbsent([string]$address, [string]$importId) {
    $addrs = Get-StateAddresses
    if ($addrs -contains $address) { return }
    Write-Host "[make] Estado sem '$address'; a importar recurso existente do Ministack ($importId)..."
    & terraform "-chdir=terraform" import -input=false $address $importId 2>&1 | Out-Host
}

Import-IfAbsent "aws_s3_bucket.media" "plus-media"
Import-IfAbsent "aws_s3_bucket_versioning.media" "plus-media"
Import-IfAbsent "aws_db_instance.auth" "plus-auth-db"

Pop-Location
exit 0
