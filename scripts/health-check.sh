#!/bin/bash

# Health check script for the POS application
# This script can be used by monitoring systems, load balancers, or container orchestrators

set -e

# Configuration
APP_URL="${APP_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-10}"
RETRY_COUNT="${RETRY_COUNT:-3}"
RETRY_DELAY="${RETRY_DELAY:-2}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Health check function
check_health() {
    local url="$1"
    local attempt=1

    while [ $attempt -le $RETRY_COUNT ]; do
        log "Health check attempt $attempt/$RETRY_COUNT for $url"

        # Check if the application is responding
        if curl -f -s --max-time $TIMEOUT "$url" > /dev/null; then
            log "${GREEN}✓ Application is healthy${NC}"
            return 0
        else
            log "${YELLOW}⚠ Health check failed (attempt $attempt/$RETRY_COUNT)${NC}"
            if [ $attempt -lt $RETRY_COUNT ]; then
                sleep $RETRY_DELAY
            fi
        fi

        attempt=$((attempt + 1))
    done

    log "${RED}✗ Application health check failed after $RETRY_COUNT attempts${NC}"
    return 1
}

# Check database connectivity
check_database() {
    local db_url="${COUCHDB_URL:-http://localhost:5984}"

    log "Checking database connectivity..."

    if curl -f -s --max-time $TIMEOUT "$db_url" > /dev/null; then
        log "${GREEN}✓ Database is accessible${NC}"
        return 0
    else
        log "${RED}✗ Database is not accessible${NC}"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    local threshold="${DISK_THRESHOLD:-80}"

    log "Checking disk space..."

    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    if [ "$usage" -lt "$threshold" ]; then
        log "${GREEN}✓ Disk usage is ${usage}% (threshold: ${threshold}%)${NC}"
        return 0
    else
        log "${RED}✗ Disk usage is ${usage}% (threshold: ${threshold}%)${NC}"
        return 1
    fi
}

# Check memory usage
check_memory() {
    local threshold="${MEMORY_THRESHOLD:-80}"

    log "Checking memory usage..."

    local usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')

    if [ "$usage" -lt "$threshold" ]; then
        log "${GREEN}✓ Memory usage is ${usage}% (threshold: ${threshold}%)${NC}"
        return 0
    else
        log "${RED}✗ Memory usage is ${usage}% (threshold: ${threshold}%)${NC}"
        return 1
    fi
}

# Main health check
main() {
    log "Starting health check for POS application..."

    local exit_code=0

    # Check application health
    if ! check_health "$APP_URL"; then
        exit_code=1
    fi

    # Check database (if not in CI/test environment)
    if [ "${CI:-false}" != "true" ] && [ "${NODE_ENV:-development}" != "test" ]; then
        if ! check_database; then
            exit_code=1
        fi
    fi

    # Check system resources
    if ! check_disk_space; then
        exit_code=1
    fi

    if ! check_memory; then
        exit_code=1
    fi

    if [ $exit_code -eq 0 ]; then
        log "${GREEN}✓ All health checks passed${NC}"
    else
        log "${RED}✗ Some health checks failed${NC}"
    fi

    exit $exit_code
}

# Run main function
main "$@"
