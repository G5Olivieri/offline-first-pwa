#!/bin/bash

# CouchDB CLI Helper Script
# Provides reliable CLI-based operations as an alternative to Fauxton

set -e

# Configuration
COUCHDB_URL=${COUCHDB_URL:-http://localhost:5984}
COUCHDB_ADMIN_USER=${COUCHDB_ADMIN_USER:-admin}
COUCHDB_ADMIN_PASSWORD=${COUCHDB_ADMIN_PASSWORD:-admin}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo -e "${CYAN}=== $1 ===${NC}"
}

# Get admin password
get_admin_password() {
  echo -n "${COUCHDB_ADMIN_PASSWORD:-admin}"
}

# Function to make authenticated requests
couchdb_request() {
    local method="${1:-GET}"
    local path="$2"
    local data="$3"
    local password
    password=$(get_admin_password)

    if [[ -n "$data" ]]; then
        curl -s -u "admin:$password" -X "$method" -H "Content-Type: application/json" -d "$data" "${COUCHDB_URL}${path}"
    else
        curl -s -u "admin:$password" -X "$method" "${COUCHDB_URL}${path}"
    fi
}

# Show cluster status
show_cluster_status() {
    print_header "Cluster Status"

    print_status "Basic Info:"
    couchdb_request GET "/" | jq .

    echo ""
    print_status "Cluster Membership:"
    couchdb_request GET "/_membership" | jq .

    echo ""
    print_status "Cluster Setup:"
    couchdb_request GET "/_cluster_setup" | jq .

    echo ""
    print_status "Node Info:"
    couchdb_request GET "/_node/_local/_config/cluster" | jq .
}

# List all databases
list_databases() {
    print_header "Databases"

    local dbs
    dbs=$(couchdb_request GET "/_all_dbs")
    echo "$dbs" | jq -r '.[]' | while read -r db; do
        local info
        info=$(couchdb_request GET "/$db")
        local doc_count
        doc_count=$(echo "$info" | jq -r '.doc_count // 0')
        local disk_size
        disk_size=$(echo "$info" | jq -r '.disk_size // 0')

        printf "  📁 %-20s Documents: %-8s Size: %s bytes\n" "$db" "$doc_count" "$disk_size"
    done
}

# Create a database
create_database() {
    local db_name="$1"
    if [[ -z "$db_name" ]]; then
        print_error "Database name is required"
        return 1
    fi

    print_status "Creating database: $db_name"
    local response
    response=$(couchdb_request PUT "/$db_name")

    if echo "$response" | grep -q '"ok":true'; then
        print_success "Database '$db_name' created successfully"
    else
        print_error "Failed to create database '$db_name': $response"
        return 1
    fi
}

add_role_to_db() {
    local db_name="$1"
    local role_name="$2"

    if [[ -z "$db_name" || -z "$role_name" ]]; then
        print_error "Usage: add_role_to_db DB_NAME ROLE_NAME"
        return 1
    fi

    print_status "Adding role '$role_name' to database '$db_name'"

    local response
    response=$(couchdb_request PUT "/$db_name/_security" "{\"admins\": {\"roles\": [\"$role_name\"]}, \"members\": {\"roles\": [\"$role_name\"]}}")

    if echo "$response" | grep -q '"ok":true'; then
        print_success "Role '$role_name' added to database '$db_name'"
    else
        print_error "Failed to add role: $response"
        return 1
    fi
}

# Delete a database
delete_database() {
    local db_name="$1"
    if [[ -z "$db_name" ]]; then
        print_error "Database name is required"
        return 1
    fi

    print_warning "This will permanently delete database: $db_name"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Operation cancelled"
        return 0
    fi

    print_status "Deleting database: $db_name"
    local response
    response=$(couchdb_request DELETE "/$db_name")

    if echo "$response" | grep -q '"ok":true'; then
        print_success "Database '$db_name' deleted successfully"
    else
        print_error "Failed to delete database '$db_name': $response"
        return 1
    fi
}

# Show database info
show_database_info() {
    local db_name="$1"
    if [[ -z "$db_name" ]]; then
        print_error "Database name is required"
        return 1
    fi

    print_header "Database Info: $db_name"
    couchdb_request GET "/$db_name" | jq .
}

# List documents in a database
list_documents() {
    local db_name="$1"
    local limit="${2:-10}"
    local skip="${3:-0}"

    if [[ -z "$db_name" ]]; then
        print_error "Database name is required"
        return 1
    fi

    print_header "Documents in: $db_name (limit: $limit, skip: $skip)"
    couchdb_request GET "/$db_name/_all_docs?limit=$limit&skip=$skip&include_docs=true"
}

# Create a document
create_document() {
    local db_name="$1"
    local doc_id="$2"
    local doc_data="$3"

    if [[ -z "$db_name" || -z "$doc_data" ]]; then
        print_error "Database name and document data are required"
        return 1
    fi

    local url="/$db_name"
    if [[ -n "$doc_id" ]]; then
        url="/$db_name/$doc_id"
    fi

    print_status "Creating document in: $db_name"
    local response
    response=$(couchdb_request PUT "$url" "$doc_data")

    if echo "$response" | grep -q '"ok":true'; then
        print_success "Document created successfully"
        echo "$response" | jq .
    else
        print_error "Failed to create document: $response"
        return 1
    fi
}

# Show active tasks
show_active_tasks() {
    print_header "Active Tasks"
    couchdb_request GET "/_active_tasks" | jq .
}

# Show server stats
show_stats() {
    print_header "Server Statistics"
    couchdb_request GET "/_node/_local/_stats" | jq .
}

# Show usage help
show_help() {
    echo "CouchDB CLI Helper - Alternative to Fauxton Web UI"
    echo ""
    echo "Usage: $0 COMMAND [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  bulk-docs DB_NAME FILE          Bulk upload documents from file"
    echo "  cors                            Enable CORS support"
    echo "  create-db DB_NAME               Create a database"
    echo "  create-doc DB_NAME [ID] JSON    Create a document"
    echo "  databases                       List all databases"
    echo "  db-info DB_NAME                 Show database information"
    echo "  delete-db DB_NAME               Delete a database"
    echo "  docs DB_NAME [LIMIT]            List documents in database"
    echo "  add-role-to-db DB_NAME ROLE     Add a role to a database"
    echo "  help                            Show this help"
    echo "  interactive                     Start interactive mode"
    echo "  request METHOD PATH [DATA]      Make a raw HTTP request"
    echo "  setup-cluster                   Setup cluster (finish setup)"
    echo "  stats                           Show server statistics"
    echo "  status                          Show cluster status"
    echo "  tasks                           Show active tasks"
    echo ""
    echo "Environment Variables:"
    echo "  NAMESPACE                  Kubernetes namespace (default: couchdb)"
    echo "  RELEASE_NAME              Helm release name (default: couchdb)"
    echo "  COUCHDB_URL               CouchDB URL (default: http://couchdb.localhost)"
    echo ""
    echo "Examples:"
    echo "  $0 status                  # Show cluster status"
    echo "  $0 databases               # List all databases"
    echo "  $0 create-db myapp         # Create 'myapp' database"
    echo "  $0 docs myapp 5            # Show 5 documents from 'myapp'"
    echo "  $0 create-doc myapp user1 '{\"name\":\"John\", \"email\":\"john@example.com\"}'"
}

# Interactive mode
interactive_mode() {
    print_header "CouchDB Interactive CLI"
    print_status "Type 'help' for available commands, 'quit' to exit"

    while true; do
        echo ""
        read -r -p "couchdb> " command args

        case "$command" in
            "quit"|"exit"|"q")
                print_status "Goodbye!"
                break
                ;;
            "help"|"h")
                show_help
                ;;
            "status"|"cluster")
                show_cluster_status
                ;;
            "databases"|"dbs")
                list_databases
                ;;
            "tasks")
                show_active_tasks
                ;;
            "stats")
                show_stats
                ;;
            "request")
                # Handle raw request command
                read -r -p "Enter HTTP method (GET/POST/PUT/DELETE): " method
                read -r -p "Enter path (e.g., /_all_dbs): " path
                read -r -p "Enter data (JSON, optional): " data
                if [[ -z "$data" ]]; then
                    couchdb_request "$method" "$path"
                else
                    couchdb_request "$method" "$path" "$data"
                fi
                ;;
            "")
                continue
                ;;
            *)
                # Parse command with arguments
                if [[ -n "$args" ]]; then
                    main "$command" $args
                else
                    main "$command"
                fi
                ;;
        esac
    done
}

enable_cors() {
    print_status "Enabling CORS..."
    local response
    response=$(couchdb_request PUT "/_node/_local/_config/chttpd/enable_cors" '{"value":true}')
    if echo "$response" | grep -q '"ok":true'; then
        print_success "CORS enabled successfully"
    else
        print_error "Failed to enable CORS: $response"
    fi
}

setup_cluster() {
	print_status "Setting up cluster..."
	couchdb_request POST "/_cluster_setup" '{"action": "finish_cluster"}' | jq .
}

bulk_docs() {
    local db_name="$1"
    local file_path="$2"

    if [[ -z "$db_name" || -z "$file_path" ]]; then
        print_error "Usage: bulk DB_NAME FILE_PATH"
        return 1
    fi

    if [[ ! -f "$file_path" ]]; then
        print_error "File not found: $file_path"
        return 1
    fi

    print_status "Bulk uploading from $file_path to database $db_name"

    local url="/$db_name/_bulk_docs"

    local response
    response=$(couchdb_request POST "$url" "@$file_path")

    if echo "$response" | grep -q '"ok":true'; then
        print_success "Bulk upload successful"
        echo "$response" | jq .
    else
        print_error "Bulk upload failed: $response"
        return 1
    fi
}

# Main function
main() {
    local command="$1"
    shift || true

    case "$command" in
        "status"|"cluster")
            show_cluster_status
            ;;
        "databases"|"dbs")
            list_databases
            ;;
        "add-role-to-db")
            add_role_to_db "$1" "$2"
            ;;
        "create-db")
            create_database "$1"
            ;;
        "delete-db")
            delete_database "$1"
            ;;
        "db-info")
            show_database_info "$1"
            ;;
        "bulk-docs")
            bulk_docs "$1" "$2"
            ;;
        "docs")
            list_documents "$1" "$2" "$3"
            ;;
        "create-doc")
            create_document "$1" "$2" "$3"
            ;;
        "cors")
            enable_cors
            ;;
        "tasks")
            show_active_tasks
            ;;
        "stats")
            show_stats
            ;;
        "interactive"|"i")
            interactive_mode
            ;;
        "request")
            local method="$1"
            local path="$2"
            local data="$3"
            if [[ -z "$method" || -z "$path" ]]; then
                print_error "Usage: request METHOD PATH [DATA]"
                return 1
            fi
            couchdb_request "$method" "$path" "$data"
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
	"setup-cluster")
		setup_cluster
		;;
        *)
            print_error "Unknown command: $command"
            echo "Use 'help' for available commands"
            exit 1
            ;;
    esac
}

# Check dependencies
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is required but not installed"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    print_error "curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_warning "jq is recommended for better JSON formatting"
fi

# Run main function with all arguments
main "$@"
