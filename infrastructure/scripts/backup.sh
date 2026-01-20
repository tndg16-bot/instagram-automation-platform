#!/bin/bash
# Database backup script

set -e

BACKUP_DIR="/backups/instaflow"
DATE=$(date +%Y%m%d_%H%M%S)
DB_HOST="$DB_HOST"
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"
DB_PASSWORD="$DB_PASSWORD"
S3_BUCKET="$S3_BACKUP_BUCKET"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $DATE..."

# PostgreSQL backup
pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/backup_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/backup_$DATE.sql"

echo "Backup completed: backup_$DATE.sql.gz"

# Upload to S3
if [ -n "$S3_BUCKET" ]; then
    echo "Uploading to S3..."
    aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" "s3://$S3_BUCKET/backups/"

    echo "Upload completed to s3://$S3_BUCKET/backups/backup_$DATE.sql.gz"
fi

# Delete old backups (30+ days)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete

echo "Old backups cleaned up"
echo "Backup process completed successfully!"
