@echo off
title SentinelAI Launcher
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-sentinelai.ps1"
pause
