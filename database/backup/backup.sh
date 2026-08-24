#!/bin/bash
# SentinelAI Database Backup Script (pg_dump)

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./database/backup"
BACKUP_FILE="$BACKUP_DIR/sentinel_db_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "Starting SentinelAI database backup..."
pg_dump -h localhost -U sentinel_user -d sentinel_db > $BACKUP_FILE

echo "Backup completed successfully: $BACKUP_FILE"
