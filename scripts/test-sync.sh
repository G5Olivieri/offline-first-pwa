#!/bin/bash

# Sync Integration Test Runner
# This script sets up CouchDB and runs sync integration tests

set -e

echo "🚀 Starting Sync Integration Test Runner"
echo "========================================"

# Configuration
COUCHDB_URL=${VITE_COUCHDB_URL:-"http://localhost:5984"}
COUCHDB_USER=${VITE_COUCHDB_USERNAME:-"admin"}
COUCHDB_PASS=${VITE_COUCHDB_PASSWORD:-"admin"}
TEST_DB_PREFIX="test_pos_sync_"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if CouchDB is running
check_couchdb() {
    log_info "Checking CouchDB connectivity..."

    if curl -s -f "$COUCHDB_URL" > /dev/null 2>&1; then
        log_success "CouchDB is running at $COUCHDB_URL"
        return 0
    else
        log_error "CouchDB is not accessible at $COUCHDB_URL"
        log_info "Make sure CouchDB is running. You can start it with:"
        echo "  docker run -d -p 5984:5984 -e COUCHDB_USER=$COUCHDB_USER -e COUCHDB_PASSWORD=$COUCHDB_PASS apache/couchdb:3.3"
        return 1
    fi
}

# Clean up test databases
cleanup_test_databases() {
    log_info "Cleaning up test databases..."

    # Get list of all databases
    local databases=$(curl -s -X GET "$COUCHDB_URL/_all_dbs" | jq -r '.[]' 2>/dev/null || echo "")

    if [ -n "$databases" ]; then
        echo "$databases" | grep "^$TEST_DB_PREFIX" | while read -r db; do
            if [ -n "$db" ]; then
                log_info "Deleting test database: $db"
                curl -s -X DELETE "$COUCHDB_URL/$db" > /dev/null 2>&1 || true
            fi
        done
        log_success "Test databases cleaned up"
    else
        log_warning "Could not retrieve database list (this is normal if jq is not installed)"
    fi
}

# Run the tests
run_tests() {
    log_info "Running sync integration tests..."

    # Export environment variables for tests
    export VITE_COUCHDB_URL="$COUCHDB_URL"
    export VITE_COUCHDB_USERNAME="$COUCHDB_USER"
    export VITE_COUCHDB_PASSWORD="$COUCHDB_PASS"
    export VITE_SYNCING="true"

    # Run specific sync tests
    if [ "$1" = "basic" ]; then
        log_info "Running basic sync tests..."
        npm run test -- src/test/sync-basic.test.ts
    elif [ "$1" = "integration" ]; then
        log_info "Running integration sync tests..."
        npm run test -- src/test/sync-integration.test.ts
    elif [ "$1" = "all" ]; then
        log_info "Running all sync tests..."
        npm run test -- src/test/sync-*.test.ts
    else
        log_info "Running basic sync tests (default)..."
        npm run test -- src/test/sync-basic.test.ts
    fi
}

# Display usage
usage() {
    echo "Usage: $0 [basic|integration|all] [--no-cleanup]"
    echo ""
    echo "Options:"
    echo "  basic       Run basic sync tests (default)"
    echo "  integration Run integration sync tests"
    echo "  all         Run all sync tests"
    echo "  --no-cleanup Skip database cleanup"
    echo ""
    echo "Environment Variables:"
    echo "  VITE_COUCHDB_URL      CouchDB URL (default: http://localhost:5984)"
    echo "  VITE_COUCHDB_USERNAME CouchDB username (default: admin)"
    echo "  VITE_COUCHDB_PASSWORD CouchDB password (default: admin)"
}

# Parse arguments
TEST_TYPE="basic"
CLEANUP=true

while [[ $# -gt 0 ]]; do
    case $1 in
        basic|integration|all)
            TEST_TYPE="$1"
            shift
            ;;
        --no-cleanup)
            CLEANUP=false
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo "Configuration:"
    echo "  CouchDB URL: $COUCHDB_URL"
    echo "  Test Type: $TEST_TYPE"
    echo "  Cleanup: $CLEANUP"
    echo ""

    # Check CouchDB connectivity
    if ! check_couchdb; then
        exit 1
    fi

    # Cleanup before tests if requested
    if [ "$CLEANUP" = true ]; then
        cleanup_test_databases
    fi

    # Run tests
    if run_tests "$TEST_TYPE"; then
        log_success "All tests passed!"

        # Cleanup after tests if requested
        if [ "$CLEANUP" = true ]; then
            cleanup_test_databases
        fi

        log_success "Sync integration tests completed successfully!"
    else
        log_error "Some tests failed"

        # Cleanup after tests even on failure if requested
        if [ "$CLEANUP" = true ]; then
            cleanup_test_databases
        fi

        exit 1
    fi
}

# Run main function
main "$@"
