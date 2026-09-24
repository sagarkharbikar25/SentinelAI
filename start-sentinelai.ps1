$root = $PSScriptRoot
$daemonPath = Join-Path $root 'daemon'

Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$root'; npm run dev"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$daemonPath'; python -m sentinel.main"

Write-Host 'SentinelAI unified portal and daemon are starting.'
Write-Host 'Portal:  http://localhost:5173'
Write-Host 'Daemon:  http://127.0.0.1:8765/docs'
