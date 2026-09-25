@echo off
title Stop SentinelAI Services
color 0C
cd /d "%~dp0"

echo =====================================================================
echo                Stopping All SentinelAI Services...
echo =====================================================================
echo.

:: 1. Run PowerShell stop script for comprehensive tree-kill and window closing
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-sentinelai.ps1"

:: 2. Fallback: Force-kill any lingering process trees on ports 8765 and 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8765" ^| findstr "LISTENING"') do (
    taskkill /F /T /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /T /PID %%a >nul 2>nul
)

echo =====================================================================
echo   [DONE] Services stopped. You can close this window.
echo =====================================================================
echo.
timeout /t 3 >nul
