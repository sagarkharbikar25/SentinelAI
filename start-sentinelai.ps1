$root = $PSScriptRoot
$frontendPath = Join-Path $root 'frontend'
$daemonPath = Join-Path $root 'daemon'

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "       Starting SentinelAI Cybersecurity Supervisor      " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Ollama Server Minimized (Port 11434)
Write-Host "[1/3] Checking Ollama Background Server..." -ForegroundColor Yellow
try {
    Start-Process -WindowStyle Minimized -FilePath "ollama" -ArgumentList "serve" -ErrorAction SilentlyContinue
    Write-Host "  -> Ollama service ready." -ForegroundColor Green
} catch {
    Write-Host "  -> Ollama not detected, using heuristic fallback." -ForegroundColor Gray
}

# 2. Start Python Security Daemon (Port 8765)
Write-Host "[2/3] Launching Python Security Daemon (Port 8765)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'SentinelAI - Python Security Daemon (Port 8765)'; Set-Location '$daemonPath'; Write-Host '=== SentinelAI Python Security Daemon (Port 8765) ===' -ForegroundColor Green; python -m sentinel.main"

# 3. Start Next.js Dashboard Frontend (Port 3000)
Write-Host "[3/3] Launching Next.js Dashboard Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'SentinelAI - Dashboard Frontend (Port 3000)'; Set-Location '$frontendPath'; Write-Host '=== SentinelAI Dashboard Frontend (Port 3000) ===' -ForegroundColor Cyan; npm run dev"

# 4. Wait for bootstrapping and open browser
Write-Host ""
Write-Host "Waiting 4 seconds for services to boot..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

Write-Host "Opening Web Dashboard: http://localhost:3000" -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  [SUCCESS] All SentinelAI services launched!" -ForegroundColor Green
Write-Host "  - Dashboard : http://localhost:3000" -ForegroundColor White
Write-Host "  - Daemon API: http://127.0.0.1:8765/docs" -ForegroundColor White
Write-Host "  - Database  : ~/.sentinelai/sentinel.db" -ForegroundColor White
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""
