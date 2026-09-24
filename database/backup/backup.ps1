# SentinelAI Cross-Platform Database Backup Script (PowerShell)
# Backs up both SQLite Local Daemon DB and PostgreSQL database

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Backup SQLite Daemon Database if present
$sqliteSource = Join-Path $env:USERPROFILE ".sentinelai\sentinel.db"
if (Test-Path $sqliteSource) {
    $sqliteBackup = Join-Path $backupDir "sentinel_daemon_backup_$timestamp.db"
    Copy-Item $sqliteSource $sqliteBackup -Force
    Write-Host "[SentinelAI Backup] SQLite daemon database backed up to: $sqliteBackup"
}

# 2. Backup PostgreSQL if pg_dump is available
if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    $pgBackup = Join-Path $backupDir "sentinel_pg_backup_$timestamp.sql"
    & pg_dump -h localhost -U sentinel_user -d sentinel_db > $pgBackup
    Write-Host "[SentinelAI Backup] PostgreSQL database backed up to: $pgBackup"
} else {
    Write-Host "[SentinelAI Backup] pg_dump not found in PATH; skipped PostgreSQL export."
}

exit 0
