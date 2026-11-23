# =====================================================================
# SentinelAI - Live Presentation Demonstration Runner (Semester 5)
# Executes 8 distinct AI agents with diverse risk scores and actions.
# Runs sequentially once (no loop) with 1.5s pacing for live demo.
# =====================================================================

$daemonUrl = "http://127.0.0.1:8765"

Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "       SENTINELAI: LIVE MULTI-AGENT DEMONSTRATION FOR PRESENTATION        " -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verifying connection to SentinelAI Security Daemon on $daemonUrl..." -ForegroundColor Gray

try {
    $health = Invoke-RestMethod -Uri "$daemonUrl/health" -Method Get -TimeoutSec 3
    Write-Host "[OK] Connected to SentinelAI Security Daemon (Port 8765)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Could not connect to SentinelAI Daemon on port 8765!" -ForegroundColor Red
    Write-Host "Please start the daemon first: run START_SENTINELAI.bat" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting 8 diverse AI agent simulation events..." -ForegroundColor Cyan
Write-Host "Watch the live workstation dashboard (http://localhost:3000) update in real time!" -ForegroundColor Gray
Write-Host ""

$scenarios = @(
    @{
        Step = "1/8"
        Agent = "Cursor AI"
        Type = "IDE_ASSISTANT"
        Action = "FILE_READ"
        Op = "READ"
        Target = "frontend/src/app/page.tsx"
        Cmd = "read frontend/src/app/page.tsx"
        Desc = "Safe source code reading during normal developer workflow"
    },
    @{
        Step = "2/8"
        Agent = "GitHub Copilot CLI"
        Type = "TERMINAL_COPILOT"
        Action = "COMMAND_EXECUTE"
        Op = "EXECUTE"
        Target = "workspace"
        Cmd = "git status --short"
        Desc = "Safe repository inspection command"
    },
    @{
        Step = "3/8"
        Agent = "LangChain Scraper"
        Type = "DATA_RETRIEVAL"
        Action = "FILE_WRITE"
        Op = "WRITE"
        Target = "temp_cache_data.tmp"
        Cmd = "echo data > temp_cache_data.tmp"
        Desc = "Writing temporary data cache file within allowed workspace"
    },
    @{
        Step = "4/8"
        Agent = "Devin AI"
        Type = "AUTONOMOUS"
        Action = "FILE_WRITE"
        Op = "WRITE"
        Target = "frontend/src/utils/math_helper.ts"
        Cmd = "touch frontend/src/utils/math_helper.ts"
        Desc = "Creating standard application utility module"
    },
    @{
        Step = "5/8"
        Agent = "Claude Code"
        Type = "AUTONOMOUS_CLI"
        Action = "FILE_DELETE"
        Op = "DELETE"
        Target = "scripts/scratch_test_file.tmp"
        Cmd = "rm scripts/scratch_test_file.tmp"
        Desc = "Deleting file in workspace requiring risk inspection"
    },
    @{
        Step = "6/8"
        Agent = "OpenDevin"
        Type = "AUTONOMOUS_RUNNER"
        Action = "COMMAND_EXECUTE"
        Op = "EXECUTE"
        Target = "git-repository"
        Cmd = "git clean -fd"
        Desc = "Destructive git clean operation caught by policy rule"
    },
    @{
        Step = "7/8"
        Agent = "AutoGPT Agent"
        Type = "RECURSIVE_AGENT"
        Action = "FILE_READ"
        Op = "READ"
        Target = "~/.ssh/id_rsa"
        Cmd = "cat ~/.ssh/id_rsa"
        Desc = "Unauthorized credential extraction attempt against private keys"
    },
    @{
        Step = "8/8"
        Agent = "BlackHat Adversary Bot"
        Type = "ROGUE_PROCESS"
        Action = "FILE_DELETE"
        Op = "DELETE"
        Target = "sentinel_canary.env"
        Cmd = "del sentinel_canary.env"
        Desc = "Honeypot Canary Tripwire access triggering instant hard block"
    }
)

$results = @()

foreach ($s in $scenarios) {
    Write-Host "--------------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "[$($s.Step)] Agent: $($s.Agent) ($($s.Type))" -ForegroundColor Yellow
    Write-Host "       Action: $($s.Action) | Target: $($s.Target)" -ForegroundColor White
    Write-Host "       Intent: $($s.Desc)" -ForegroundColor Gray
    if ($s.Step -eq "5/8") {
        Write-Host "       >>> LIVE PROMPT: LOOK AT DASHBOARD (http://localhost:3000) TO CONFIRM / DENY <<<" -ForegroundColor Yellow
    }

    $payload = @{
        agent_id = $s.Agent
        agent_type = $s.Type
        action_type = $s.Action
        operation = $s.Op
        target_path = $s.Target
        command = $s.Cmd
    } | ConvertTo-Json

    try {
        $res = Invoke-RestMethod -Uri "$daemonUrl/daemon/intercept" -Method Post -Body $payload -ContentType "application/json"
        
        $decisionColor = if ($res.decision -eq "ALLOW") { "Green" } else { "Red" }
        $riskColor = if ($res.risk_score -ge 80) { "Red" } elseif ($res.risk_score -ge 40) { "Yellow" } else { "Green" }

        Write-Host "  ---> Verdict  : " -NoNewline
        Write-Host "$($res.decision)" -ForegroundColor $decisionColor -NoNewline
        Write-Host " | Risk Score: " -NoNewline
        Write-Host "$($res.risk_score)/100 ($($res.risk_category))" -ForegroundColor $riskColor
        Write-Host "  ---> Reason   : $($res.explanation)" -ForegroundColor Gray

        $results += [PSCustomObject]@{
            Agent = $s.Agent
            Risk = "$($res.risk_score)/100"
            Category = $res.risk_category
            Verdict = $res.decision
        }
    } catch {
        Write-Host "  ---> Error sending event to daemon: $_" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 1400
}

Write-Host "--------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Green
Write-Host "                PRESENTATION DEMONSTRATION COMPLETED                      " -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Green
Write-Host ""
$results | Format-Table -AutoSize
Write-Host "All events have been securely signed into the SQLite SHA-256 flight recorder." -ForegroundColor Cyan
Write-Host "View results live in the dashboard at: http://localhost:3000" -ForegroundColor White
Write-Host ""
