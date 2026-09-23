# Windows PowerShell Installer for SentinelAI Shims
$ShimDir = Join-Path $HOME ".sentinelai\shims"
if (-not (Test-Path $ShimDir)) {
    New-Item -ItemType Directory -Path $ShimDir -Force | Out-Null
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Copy Python scripts
Copy-Item (Join-Path $ScriptDir "rm.py") (Join-Path $ShimDir "rm.py") -Force
Copy-Item (Join-Path $ScriptDir "mv.py") (Join-Path $ShimDir "mv.py") -Force

# Create cmd batch wrappers so `rm` and `mv` can be executed directly
$rmCmdContent = @"
@echo off
python "%~dp0rm.py" %*
"@
$rmCmdContent | Set-Content -Path (Join-Path $ShimDir "rm.cmd") -Encoding ASCII

$mvCmdContent = @"
@echo off
python "%~dp0mv.py" %*
"@
$mvCmdContent | Set-Content -Path (Join-Path $ShimDir "mv.cmd") -Encoding ASCII

Write-Host "SentinelAI Shims installed in $ShimDir"
Write-Host "To enable in current PowerShell session run:"
Write-Host "`$env:Path = `"$ShimDir;`$env:Path`""
