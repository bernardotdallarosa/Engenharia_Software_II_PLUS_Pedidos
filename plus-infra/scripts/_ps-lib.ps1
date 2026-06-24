# Helpers partilhados pelos scripts PowerShell do plus-infra (Windows).
function Invoke-LocalScript {
    param([string]$Path)
    & $Path
    if (-not $?) { exit 1 }
}

function Assert-ExternalExit {
    if ((Test-Path variable:LASTEXITCODE) -and $LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

function Get-ExternalExitCode {
    if (Test-Path variable:LASTEXITCODE) { return $LASTEXITCODE }
    return 0
}
