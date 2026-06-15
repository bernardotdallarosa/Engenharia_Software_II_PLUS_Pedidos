# Se o Ministack ainda tiver bucket/RDS de uma corrida anterior mas o .tfstate nao os referencia,
# o apply falha com BucketAlreadyExists / DBInstanceAlreadyExists. Importa so o que faltar no state.
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
    Write-Host "[make] Estado sem '$address'; a importar se ja existir no Ministack ($importId)..."
    $null = & terraform "-chdir=terraform" import -input=false $address $importId 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[make]   import ignorado (recurso ainda nao existe; sera criado pelo apply)."
    }
}

Import-IfAbsent "aws_s3_bucket.media" "plus-media"
Import-IfAbsent "aws_s3_bucket_versioning.media" "plus-media"
Import-IfAbsent "aws_db_instance.auth" "plus-auth-db"
Import-IfAbsent "aws_db_instance.ped" "plus-ped-db"
Import-IfAbsent "aws_sqs_queue.order_events" "plus-order-events"

Pop-Location
exit 0
