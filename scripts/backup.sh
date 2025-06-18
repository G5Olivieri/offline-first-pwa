#!/bin/bash

# Backup script for POS application data
# This script backs up CouchDB data and application configuration

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
COUCHDB_URL="${COUCHDB_URL:-http://localhost:5984}"
COUCHDB_USERNAME="${COUCHDB_USERNAME:-admin}"
COUCHDB_PASSWORD="${COUCHDB_PASSWORD:-password}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Create backup directory
create_backup_dir() {
    local backup_path="$BACKUP_DIR/$TIMESTAMP"
    mkdir -p "$backup_path"
    echo "$backup_path"
}

# Backup CouchDB databases
backup_databases() {
    local backup_path="$1"
    local databases=("products" "customers" "operators" "orders")

    log "Starting database backup..."

    for db in "${databases[@]}"; do
        log "Backing up database: $db"

        # Get all documents from the database
        local db_backup_file="$backup_path/${db}.json"

        if curl -s -u "$COUCHDB_USERNAME:$COUCHDB_PASSWORD" \
           "$COUCHDB_URL/$db/_all_docs?include_docs=true" \
           -o "$db_backup_file"; then
            log "${GREEN}✓ Successfully backed up $db${NC}"
        else
            log "${RED}✗ Failed to backup $db${NC}"
            return 1
        fi
    done

    return 0
}

# Backup configuration files
backup_config() {
    local backup_path="$1"

    log "Backing up configuration files..."

    # Create config backup directory
    local config_dir="$backup_path/config"
    mkdir -p "$config_dir"

    # Copy environment files (without sensitive data)
    if [ -f ".env.example" ]; then
        cp ".env.example" "$config_dir/"
    fi

    # Copy package.json and other config files
    local config_files=("package.json" "vite.config.ts" "tsconfig.json" "README.md")

    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "$config_dir/"
            log "✓ Backed up $file"
        fi
    done

    # Create backup metadata
    cat > "$config_dir/backup-info.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(node -p "require('./package.json').version" 2>/dev/null || echo 'unknown')",
  "environment": "${NODE_ENV:-development}",
  "hostname": "$(hostname)",
  "user": "$(whoami)"
}
EOF

    return 0
}

# Compress backup
compress_backup() {
    local backup_path="$1"
    local archive_name="pos-backup-$TIMESTAMP.tar.gz"

    log "Compressing backup..."

    if tar -czf "$BACKUP_DIR/$archive_name" -C "$BACKUP_DIR" "$TIMESTAMP"; then
        log "${GREEN}✓ Backup compressed: $archive_name${NC}"

        # Remove uncompressed backup directory
        rm -rf "$backup_path"

        # Display backup size
        local size=$(du -h "$BACKUP_DIR/$archive_name" | cut -f1)
        log "Backup size: $size"

        return 0
    else
        log "${RED}✗ Failed to compress backup${NC}"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."

    if find "$BACKUP_DIR" -name "pos-backup-*.tar.gz" -mtime +$RETENTION_DAYS -type f -delete; then
        local count=$(find "$BACKUP_DIR" -name "pos-backup-*.tar.gz" -mtime +$RETENTION_DAYS -type f | wc -l)
        if [ "$count" -gt 0 ]; then
            log "${GREEN}✓ Cleaned up $count old backup(s)${NC}"
        else
            log "No old backups to clean up"
        fi
    else
        log "${YELLOW}⚠ Failed to clean up old backups${NC}"
    fi
}

# Verify backup integrity
verify_backup() {
    local archive_path="$BACKUP_DIR/pos-backup-$TIMESTAMP.tar.gz"

    log "Verifying backup integrity..."

    if tar -tzf "$archive_path" > /dev/null 2>&1; then
        log "${GREEN}✓ Backup integrity verified${NC}"
        return 0
    else
        log "${RED}✗ Backup integrity check failed${NC}"
        return 1
    fi
}

# Send notification (placeholder for integration with notification systems)
send_notification() {
    local status="$1"
    local message="$2"

    # This is where you would integrate with your notification system
    # Examples: Slack, email, SMS, etc.

    log "Notification: $status - $message"

    # Example webhook call (uncomment and configure as needed)
    # curl -X POST "$WEBHOOK_URL" \
    #      -H "Content-Type: application/json" \
    #      -d "{\"text\": \"POS Backup $status: $message\"}"
}

# Main backup function
main() {
    log "${YELLOW}Starting POS application backup...${NC}"

    # Create backup directory
    local backup_path
    backup_path=$(create_backup_dir)

    # Perform backup steps
    if backup_databases "$backup_path" && backup_config "$backup_path"; then
        if compress_backup "$backup_path" && verify_backup; then
            cleanup_old_backups

            local message="Backup completed successfully at $TIMESTAMP"
            log "${GREEN}✓ $message${NC}"
            send_notification "SUCCESS" "$message"

            exit 0
        else
            local message="Backup compression/verification failed"
            log "${RED}✗ $message${NC}"
            send_notification "FAILED" "$message"
            exit 1
        fi
    else
        local message="Database or configuration backup failed"
        log "${RED}✗ $message${NC}"
        send_notification "FAILED" "$message"
        exit 1
    fi
}

# Handle script arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "list")
        log "Available backups:"
        ls -la "$BACKUP_DIR"/pos-backup-*.tar.gz 2>/dev/null || log "No backups found"
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "help"|"--help"|"-h")
        echo "Usage: $0 [backup|list|cleanup|help]"
        echo "  backup  - Create a new backup (default)"
        echo "  list    - List available backups"
        echo "  cleanup - Clean up old backups"
        echo "  help    - Show this help message"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
