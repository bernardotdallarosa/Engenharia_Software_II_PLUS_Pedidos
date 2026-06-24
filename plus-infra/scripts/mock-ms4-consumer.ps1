# Mock documentado do consumidor MS4 (Estoque) — le eventos order.* da fila SQS local
# e imprime a baixa/reserva de stock conforme contrato assumido pelo Grupo 8.
# Uso: apos confirmar/reservar pedido na UI, em outro terminal:
#   cd plus-infra
#   powershell -File scripts/mock-ms4-consumer.ps1
#
# Nao exige AWS CLI no host: tenta awslocal/aws local; senao usa docker exec no contentor ministack.

param(
    [int]$MaxMessages = 5,
    [string]$QueueUrl = $env:ORDER_EVENTS_QUEUE_URL,
    [string]$MinistackContainer = "ministack"
)

$ErrorActionPreference = "Stop"

if (-not $QueueUrl) {
    $QueueUrl = "http://localhost:4566/000000000000/plus-order-events"
}

function Apply-MockStockMovement {
    param($Event)

    $name = $Event.eventName
    $order = $Event.data
    $items = @($order.items)

    switch ($name) {
        "order.reserved" {
            foreach ($item in $items) {
                Write-Host "  [MS4 mock] RESERVA +$($item.quantity) em $($item.productVariantId) (pedido $($order.id))"
            }
        }
        "order.confirmed" {
            $verb = if ($order.type -eq "PURCHASE") { "ENTRADA" } else { "SAIDA" }
            foreach ($item in $items) {
                $sign = if ($order.type -eq "PURCHASE") { "+" } else { "-" }
                Write-Host "  [MS4 mock] $verb $sign$($item.quantity) em $($item.productVariantId) (pedido $($order.id))"
            }
        }
        "order.reservation.released" {
            foreach ($item in $items) {
                Write-Host "  [MS4 mock] LIBERA reserva -$($item.quantity) em $($item.productVariantId) (pedido $($order.id))"
            }
        }
        default {
            Write-Host "  [MS4 mock] evento desconhecido: $name"
        }
    }
}

function Receive-SqsMessagesViaCli {
    param(
        [string]$Cli,
        [string[]]$ExtraArgs,
        [string]$Endpoint,
        [string]$Url,
        [int]$Max
    )

    if (-not (Get-Command $Cli -ErrorAction SilentlyContinue)) {
        return $null
    }

    $args = @()
    if ($Cli -eq "aws") {
        $args += "--endpoint-url", $Endpoint
    }
    $args += $ExtraArgs
    $args += "sqs", "receive-message",
        "--queue-url", $Url,
        "--max-number-of-messages", "$Max",
        "--wait-time-seconds", "2",
        "--output", "json"

    $output = & $Cli @args 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $output) {
        return $null
    }

    return ($output | Out-String).Trim()
}

function Receive-SqsMessagesViaDocker {
    param(
        [string]$Container,
        [string]$Url,
        [int]$Max
    )

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        return $null
    }

    $running = docker ps --filter "name=^/${Container}$" --format "{{.Names}}" 2>$null
    if (-not $running) {
        return $null
    }

    $output = docker exec $Container awslocal sqs receive-message `
        --queue-url $Url `
        --max-number-of-messages $Max `
        --wait-time-seconds 2 `
        --output json 2>$null

    if ($LASTEXITCODE -ne 0 -or -not $output) {
        return $null
    }

    return ($output | Out-String).Trim()
}

function Receive-SqsMessagesViaHttp {
    param(
        [string]$Endpoint,
        [string]$Url,
        [int]$Max
    )

    $form = @{
        Action               = "ReceiveMessage"
        Version              = "2012-11-05"
        QueueUrl             = $Url
        MaxNumberOfMessages  = "$Max"
        WaitTimeSeconds      = "2"
    }

    $response = Invoke-WebRequest -Uri $Endpoint.TrimEnd("/") + "/" `
        -Method POST `
        -Body $form `
        -ContentType "application/x-www-form-urlencoded" `
        -UseBasicParsing

    [xml]$xml = $response.Content
    $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace("sqs", "http://queue.amazonaws.com/doc/2012-11-05/")

    $messageNodes = $xml.SelectNodes("//sqs:Message", $ns)
    if (-not $messageNodes -or $messageNodes.Count -eq 0) {
        return $null
    }

    $messages = foreach ($node in $messageNodes) {
        [PSCustomObject]@{
            Body = $node.Body
        }
    }

    return (@{ Messages = $messages } | ConvertTo-Json -Depth 6 -Compress)
}

Write-Host "[MS4 mock] Contrato assumido: eventName + data.items[].productVariantId/quantity (ver ADR.md secao 4)"
Write-Host "[MS4 mock] Fila: $QueueUrl"
Write-Host "[MS4 mock] A ler ate $MaxMessages mensagem(ns)...`n"

$endpoint = $env:AWS_ENDPOINT
if (-not $endpoint) { $endpoint = "http://localhost:4566" }

$json = Receive-SqsMessagesViaCli -Cli "awslocal" -ExtraArgs @() -Endpoint $endpoint -Url $QueueUrl -Max $MaxMessages
$transport = "awslocal (host)"

if (-not $json) {
    $json = Receive-SqsMessagesViaCli -Cli "aws" -ExtraArgs @() -Endpoint $endpoint -Url $QueueUrl -Max $MaxMessages
    $transport = "aws CLI (host)"
}

if (-not $json) {
    $json = Receive-SqsMessagesViaDocker -Container $MinistackContainer -Url $QueueUrl -Max $MaxMessages
    $transport = "docker exec $MinistackContainer awslocal"
}

if (-not $json) {
    $json = Receive-SqsMessagesViaHttp -Endpoint $endpoint -Url $QueueUrl -Max $MaxMessages
    $transport = "HTTP LocalStack ($endpoint)"
}

if (-not $json) {
    Write-Host "[MS4 mock] ERRO: nao foi possivel ler a fila."
    Write-Host "  - Confirme que o Ministack esta no ar (docker ps | findstr ministack)"
    Write-Host "  - Ou instale AWS CLI / awslocal no PATH"
    exit 1
}

Write-Host "[MS4 mock] Transporte: $transport`n"

$parsed = $json | ConvertFrom-Json
$messages = @($parsed.Messages)

if ($messages.Count -eq 0 -or ($messages.Count -eq 1 -and -not $messages[0])) {
    Write-Host "[MS4 mock] Fila vazia (reserve ou confirme um pedido antes)."
    exit 0
}

foreach ($msg in $messages) {
    if (-not $msg.Body) { continue }
    $body = $msg.Body | ConvertFrom-Json
    Write-Host "Evento: $($body.eventName) @ $($body.occurredAt)"
    Apply-MockStockMovement -Event $body
    Write-Host ""
}

Write-Host "[MS4 mock] Nota: simulacao local; MS4 real substituira este script quando existir."
