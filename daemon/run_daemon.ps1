# Run SentinelAI Security Daemon on port 8765
$daemonDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $daemonDir
$env:PYTHONPATH = $daemonDir

$PythonPath = "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe"
if (-not (Test-Path $PythonPath)) {
    $PythonPath = "python"
}

Write-Host "Starting SentinelAI Security Daemon on http://127.0.0.1:8765 using $PythonPath..." -ForegroundColor Cyan
& $PythonPath -m sentinel.main
