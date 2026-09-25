# =========================================================
# SentinelAI Stop Script - Clean Shutdown of All Services
# =========================================================

Write-Host "=========================================================" -ForegroundColor Red
Write-Host "       Stopping SentinelAI Cybersecurity Supervisor      " -ForegroundColor Red
Write-Host "=========================================================" -ForegroundColor Red
Write-Host ""

$ports = @(8765, 3000)

function Kill-ProcessTree([int]$pidToKill) {
    if ($pidToKill -gt 0) {
        # Try to kill parent shell window if applicable
        try {
            $parent = Get-CimInstance Win32_Process -Filter "ProcessId = $pidToKill" -ErrorAction SilentlyContinue
            if ($parent -and $parent.ParentProcessId -gt 0) {
                $parentProc = Get-Process -Id $parent.ParentProcessId -ErrorAction SilentlyContinue
                if ($parentProc -and ($parentProc.ProcessName -in @('powershell', 'cmd', 'pwsh'))) {
                    Write-Host "  -> Closing parent console (PID: $($parentProc.Id))..." -ForegroundColor DarkYellow
                    & taskkill.exe /F /T /PID $parentProc.Id 2>$null
                }
            }
        } catch {}

        # Kill target process and its tree
        & taskkill.exe /F /T /PID $pidToKill 2>$null
    }
}

# 1. Terminate listeners on ports 8765 & 3000
foreach ($port in $ports) {
    Write-Host "[*] Checking port $port..." -ForegroundColor Yellow
    $found = $false

    # A. Get-NetTCPConnection
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($c in $conns) {
                if ($c.OwningProcess -gt 0) {
                    Write-Host "  -> Found listener on port $port (PID: $($c.OwningProcess))" -ForegroundColor Cyan
                    Kill-ProcessTree $c.OwningProcess
                    $found = $true
                }
            }
        }
    } catch {}

    # B. netstat fallback
    try {
        $netstatOutput = netstat -ano
        $matches = $netstatOutput | Select-String ":$port\s+.*LISTENING"
        foreach ($line in $matches) {
            $tokens = ($line.ToString().Trim() -split '\s+')
            $p = $tokens[-1]
            if ($p -match '^\d+$' -and [int]$p -gt 0) {
                Write-Host "  -> Terminating netstat PID on port $port (PID: $p)" -ForegroundColor Cyan
                Kill-ProcessTree ([int]$p)
                $found = $true
            }
        }
    } catch {}

    if (-not $found) {
        Write-Host "  -> Port $port is already free." -ForegroundColor Gray
    }
}

# 2. Terminate PowerShell windows launched by SentinelAI
Write-Host ""
Write-Host "[*] Checking for SentinelAI console windows..." -ForegroundColor Yellow
$closedAny = $false

Get-Process powershell, pwsh -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = $_
    $shouldKill = $false

    # Match by Window Title
    if ($proc.MainWindowTitle -like '*SentinelAI*') {
        $shouldKill = $true
    }

    # Match by Command Line if accessible
    try {
        $cim = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue
        if ($cim -and ($cim.CommandLine -like '*sentinel.main*' -or $cim.CommandLine -like '*npm run dev*' -or $cim.CommandLine -like '*start-sentinelai*')) {
            $shouldKill = $true
        }
    } catch {}

    if ($shouldKill) {
        Write-Host "  -> Closing SentinelAI window (PID: $($proc.Id), Title: '$($proc.MainWindowTitle)')..." -ForegroundColor Cyan
        & taskkill.exe /F /T /PID $proc.Id 2>$null
        $closedAny = $true
    }
}

if (-not $closedAny) {
    Write-Host "  -> No active SentinelAI console windows remaining." -ForegroundColor Gray
}

# 3. Final Verification
Start-Sleep -Milliseconds 800
$port8765Free = -not (netstat -ano | Select-String ":8765\s+.*LISTENING")
$port3000Free = -not (netstat -ano | Select-String ":3000\s+.*LISTENING")

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Green
if ($port8765Free -and $port3000Free) {
    Write-Host "  [SUCCESS] All SentinelAI services and ports are STOPPED." -ForegroundColor Green
    Write-Host "  - Port 8765 (Daemon)   : CLOSED" -ForegroundColor White
    Write-Host "  - Port 3000 (Frontend) : CLOSED" -ForegroundColor White
} else {
    Write-Host "  [NOTICE] Services stopping in progress..." -ForegroundColor Yellow
}
Write-Host "=========================================================" -ForegroundColor Green
Write-Host ""
