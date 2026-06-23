# Mock documentado do consumidor MS4 (Estoque) — lê eventos order.* da fila SQS local
# e imprime a baixa/reserva de stock conforme contrato assumido pelo Grupo 8.
# Uso: após confirmar/reservar pedido na UI, em outro terminal:
#   cd plus-infra
#   powershell -File scripts/mock-ms4-consumer.ps1

param(
    [int]$MaxMessages = 5,
    [string]$QueueUrl = $env:ORDER_EVENTS_QUEUE_URL
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
            $verb = if ($order.type -eq "PURCHASE") { "ENTRADA" } else { "SAÍDA" }
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

Write-Host "[MS4 mock] Contrato assumido: eventName + data.items[].productVariantId/quantity (ver ADR.md §4)"
Write-Host "[MS4 mock] Fila: $QueueUrl"
Write-Host "[MS4 mock] A ler até $MaxMessages mensagem(ns)...`n"

$endpoint = $env:AWS_ENDPOINT
if (-not $endpoint) { $endpoint = "http://localhost:4566" }

$awslocal = Get-Command awslocal -ErrorAction SilentlyContinue
$aws = if ($awslocal) { "awslocal" } else { "aws" }

$json = & $aws --endpoint-url $endpoint sqs receive-message `
    --queue-url $QueueUrl `
    --max-number-of-messages $MaxMessages `
    --wait-time-seconds 2 `
    --output json 2>$null

if (-not $json) {
    Write-Host "[MS4 mock] Nenhuma mensagem (confirme um pedido antes ou verifique a fila)."
    exit 0
}

$parsed = $json | ConvertFrom-Json
$messages = @($parsed.Messages)

if ($messages.Count -eq 0) {
    Write-Host "[MS4 mock] Fila vazia."
    exit 0
}

foreach ($msg in $messages) {
    $body = $msg.Body | ConvertFrom-Json
    Write-Host "Evento: $($body.eventName) @ $($body.occurredAt)"
    Apply-MockStockMovement -Event $body
    Write-Host ""
}

Write-Host "[MS4 mock] Nota: isto é simulação local; MS4 real substituirá este script quando existir."
