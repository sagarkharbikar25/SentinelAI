@echo off
title SentinelAI - Live Presentation Multi-Agent Demonstration
color 0B
cd /d "%~dp0"

echo ==========================================================================
echo        SENTINELAI: LIVE MULTI-AGENT PRESENTATION DEMONSTRATION
echo   (Runs 8 diverse agents with distinct risk levels for your evaluation)
echo ==========================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run_presentation_demo.ps1"

echo.
echo Press any key to close this demonstration window...
pause >nul