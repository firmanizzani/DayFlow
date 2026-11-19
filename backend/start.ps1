$ErrorActionPreference = 'Stop'
$backendScript = Join-Path (Split-Path $PSScriptRoot -Parent) 'scripts/backend.ps1'
& powershell -ExecutionPolicy Bypass -File $backendScript run
exit $LASTEXITCODE
