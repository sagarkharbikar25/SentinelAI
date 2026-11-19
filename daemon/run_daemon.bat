@echo off
set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
if not exist "%PYTHON_EXE%" (
    set "PYTHON_EXE=python"
)
echo Starting SentinelAI Security Daemon on http://127.0.0.1:8765...
"%PYTHON_EXE%" -m sentinel.main
pause
