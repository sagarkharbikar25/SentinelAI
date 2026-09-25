@echo off
title SentinelAI - Autonomous Agent Attack Simulation
color 0C

echo =====================================================================
echo       SENTINELAI: LIVE AUTONOMOUS AGENT ATTACK SIMULATION
echo   (Demonstrates SentinelAI intercepting dangerous agent actions)
echo =====================================================================
echo.
echo [*] Target System: Local Workstation (Port 8765)
echo [*] Target Database: ~/.sentinelai/sentinel.db
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "& {" ^
"  $headers = @{'Content-Type' = 'application/json'};" ^
"  Write-Host '---------------------------------------------------------' -ForegroundColor DarkGray;" ^
"  Write-Host '[ATTACK 1/4] Simulating Autonomous Scraper Exfiltrating Credentials...' -ForegroundColor Yellow;" ^
"  Write-Host '  Target File: threat_samples/malicious_exfiltration.env' -ForegroundColor Cyan;" ^
"  try {" ^
"    $b1 = @{ agent_id='autonomous-scraper'; agent_type='AUTONOMOUS'; action_type='FILE_READ'; operation='READ'; target_path='threat_samples/malicious_exfiltration.env'; command='cat threat_samples/malicious_exfiltration.env' } | ConvertTo-Json;" ^
"    $r1 = Invoke-RestMethod -Uri 'http://127.0.0.1:8765/daemon/intercept' -Method Post -Body $b1 -ContentType 'application/json';" ^
"    Write-Host ('  -> SentinelAI Decision: ' + $r1.decision) -ForegroundColor Red -NoNewline;" ^
"    Write-Host (' | Risk: ' + $r1.risk_score + '/100 (' + $r1.risk_category + ')') -ForegroundColor DarkRed;" ^
"    Write-Host ('  -> Reason: ' + $r1.explanation) -ForegroundColor Gray;" ^
"  } catch { Write-Host '  -> Failed to reach daemon on 8765. Is START_SENTINELAI.bat running?' -ForegroundColor Red };" ^
"  Start-Sleep -Seconds 1;" ^
"  Write-Host '';" ^
"  Write-Host '---------------------------------------------------------' -ForegroundColor DarkGray;" ^
"  Write-Host '[ATTACK 2/4] Simulating Untrusted Agent Executing Reverse Shell...' -ForegroundColor Yellow;" ^
"  Write-Host '  Target Script: threat_samples/reverse_shell.sh' -ForegroundColor Cyan;" ^
"  try {" ^
"    $b2 = @{ agent_id='untrusted-ci-bot'; agent_type='AUTOMATION_RUNNER'; action_type='COMMAND_EXECUTE'; operation='EXECUTE'; target_path='threat_samples/reverse_shell.sh'; command='bash threat_samples/reverse_shell.sh' } | ConvertTo-Json;" ^
"    $r2 = Invoke-RestMethod -Uri 'http://127.0.0.1:8765/daemon/intercept' -Method Post -Body $b2 -ContentType 'application/json';" ^
"    Write-Host ('  -> SentinelAI Decision: ' + $r2.decision) -ForegroundColor Red -NoNewline;" ^
"    Write-Host (' | Risk: ' + $r2.risk_score + '/100 (' + $r2.risk_category + ')') -ForegroundColor DarkRed;" ^
"    Write-Host ('  -> Reason: ' + $r2.explanation) -ForegroundColor Gray;" ^
"  } catch { Write-Host '  -> Failed to reach daemon on 8765.' -ForegroundColor Red };" ^
"  Start-Sleep -Seconds 1;" ^
"  Write-Host '';" ^
"  Write-Host '---------------------------------------------------------' -ForegroundColor DarkGray;" ^
"  Write-Host '[ATTACK 3/4] Simulating Adversarial Agent Deleting Honeypot Canary...' -ForegroundColor Yellow;" ^
"  Write-Host '  Target Tripwire: sentinel_canary.env' -ForegroundColor Cyan;" ^
"  try {" ^
"    $b3 = @{ agent_id='claude-code'; agent_type='AUTONOMOUS'; action_type='FILE_DELETE'; operation='DELETE'; target_path='sentinel_canary.env'; command='rm sentinel_canary.env' } | ConvertTo-Json;" ^
"    $r3 = Invoke-RestMethod -Uri 'http://127.0.0.1:8765/daemon/intercept' -Method Post -Body $b3 -ContentType 'application/json';" ^
"    Write-Host ('  -> SentinelAI Decision: ' + $r3.decision) -ForegroundColor Red -NoNewline;" ^
"    Write-Host (' | Risk: ' + $r3.risk_score + '/100 (' + $r3.risk_category + ')') -ForegroundColor DarkRed;" ^
"    Write-Host ('  -> Reason: ' + $r3.explanation) -ForegroundColor Gray;" ^
"  } catch { Write-Host '  -> Failed to reach daemon on 8765.' -ForegroundColor Red };" ^
"  Start-Sleep -Seconds 1;" ^
"  Write-Host '';" ^
"  Write-Host '---------------------------------------------------------' -ForegroundColor DarkGray;" ^
"  Write-Host '[TEST 4/4] Simulating Legitimate Read Operation...' -ForegroundColor Yellow;" ^
"  Write-Host '  Target Path: docs/README.md' -ForegroundColor Cyan;" ^
"  try {" ^
"    $b4 = @{ agent_id='langchain-doc-retriever'; agent_type='DATA_RETRIEVAL'; action_type='FILE_READ'; operation='READ'; target_path='d:/GitHub/SentinelAI/docs/README.md'; command='read docs/README.md' } | ConvertTo-Json;" ^
"    $r4 = Invoke-RestMethod -Uri 'http://127.0.0.1:8765/daemon/intercept' -Method Post -Body $b4 -ContentType 'application/json';" ^
"    Write-Host ('  -> SentinelAI Decision: ' + $r4.decision) -ForegroundColor Green -NoNewline;" ^
"    Write-Host (' | Risk: ' + $r4.risk_score + '/100 (' + $r4.risk_category + ')') -ForegroundColor DarkGreen;" ^
"    Write-Host ('  -> Reason: ' + $r4.explanation) -ForegroundColor Gray;" ^
"  } catch { Write-Host '  -> Failed to reach daemon on 8765.' -ForegroundColor Red };" ^
"  Write-Host '---------------------------------------------------------' -ForegroundColor DarkGray;" ^
"}"

echo.
echo =====================================================================
echo  [DONE] All 4 attacks were intercepted and logged to SQLite!
echo  Check your Dashboard at http://localhost:3000 to inspect the logs.
echo =====================================================================
echo.
pause
