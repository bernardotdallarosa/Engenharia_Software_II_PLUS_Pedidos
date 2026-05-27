# Aguarda o endpoint de health do Ministack até serviços estarem registados no JSON (equivalente ao loop bash do Makefile).
$ErrorActionPreference = "Continue"
$url = if ($env:MINISTACK_URL) { $env:MINISTACK_URL } else { "http://localhost:4566/_localstack/health" }

Write-Host "[make] Aguardando Ministack ficar disponível..."

for ($i = 1; $i -le 30; $i++) {
    try {
        $r = Invoke-RestMethod -Uri $url -TimeoutSec 10 -Method Get
        $svc = $r.services
        if ($null -ne $svc -and ($svc.PSObject.Properties | Measure-Object).Count -gt 0) {
            Write-Host "[make] Ministack pronto."
            exit 0
        }
        $status = "not-ready"
    }
    catch {
        $status = "not-ready"
    }
    Write-Host "[make]   status: $status (tentativa $i/30)"
    Start-Sleep -Seconds 5
}

Write-Host "[make] ERRO: Ministack não ficou disponível a tempo."
exit 1
