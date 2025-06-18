#!/bin/bash

# Cleanup Istio resources for POS Frontend
# This script provides comprehensive cleanup options for Istio deployment

set -e

# Configuration
NAMESPACE="${NAMESPACE:-pos-frontend}"
RELEASE_NAME="${RELEASE_NAME:-pos-frontend}"
FORCE_CLEANUP="${FORCE_CLEANUP:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Confirmation prompt
confirm() {
    if [ "$FORCE_CLEANUP" = "true" ]; then
        return 0
    fi

    read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "${YELLOW}Cleanup cancelled${NC}"
        exit 0
    fi
}

# Clean up Helm release
cleanup_helm_release() {
    log "${BLUE}Cleaning up Helm release: $RELEASE_NAME${NC}"

    if helm list -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        log "  Uninstalling Helm release..."
        helm uninstall "$RELEASE_NAME" -n "$NAMESPACE"
        log "${GREEN}  ✓ Helm release uninstalled${NC}"
    else
        log "${YELLOW}  ⚠ Helm release not found${NC}"
    fi
}

# Clean up Istio resources
cleanup_istio_resources() {
    log "${BLUE}Cleaning up Istio resources...${NC}"

    # Clean up Gateway
    if kubectl get gateway -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend > /dev/null 2>&1; then
        log "  Deleting Istio Gateway..."
        kubectl delete gateway -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend
        log "${GREEN}  ✓ Gateway deleted${NC}"
    else
        log "${YELLOW}  ⚠ No Gateway found${NC}"
    fi

    # Clean up VirtualService
    if kubectl get virtualservice -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend > /dev/null 2>&1; then
        log "  Deleting VirtualService..."
        kubectl delete virtualservice -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend
        log "${GREEN}  ✓ VirtualService deleted${NC}"
    else
        log "${YELLOW}  ⚠ No VirtualService found${NC}"
    fi

    # Clean up DestinationRule
    if kubectl get destinationrule -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend > /dev/null 2>&1; then
        log "  Deleting DestinationRule..."
        kubectl delete destinationrule -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend
        log "${GREEN}  ✓ DestinationRule deleted${NC}"
    else
        log "${YELLOW}  ⚠ No DestinationRule found${NC}"
    fi

    # Clean up ServiceMonitor (if exists)
    if kubectl get servicemonitor -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend > /dev/null 2>&1; then
        log "  Deleting ServiceMonitor..."
        kubectl delete servicemonitor -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend
        log "${GREEN}  ✓ ServiceMonitor deleted${NC}"
    else
        log "${YELLOW}  ⚠ No ServiceMonitor found${NC}"
    fi
}

# Clean up secrets
cleanup_secrets() {
    log "${BLUE}Cleaning up TLS secrets...${NC}"

    # Clean up TLS secret
    if kubectl get secret pos-frontend-tls-secret -n "$NAMESPACE" > /dev/null 2>&1; then
        log "  Deleting TLS secret..."
        kubectl delete secret pos-frontend-tls-secret -n "$NAMESPACE"
        log "${GREEN}  ✓ TLS secret deleted${NC}"
    else
        log "${YELLOW}  ⚠ No TLS secret found${NC}"
    fi
}

# Clean up application resources
cleanup_application_resources() {
    log "${BLUE}Cleaning up application resources...${NC}"

    # Clean up pods
    if kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend > /dev/null 2>&1; then
        log "  Deleting pods..."
        kubectl delete pods -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend --force --grace-period=0
        log "${GREEN}  ✓ Pods deleted${NC}"
    else
        log "${YELLOW}  ⚠ No pods found${NC}"
    fi

    # Clean up services
    if kubectl get service -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend > /dev/null 2>&1; then
        log "  Deleting services..."
        kubectl delete service -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend
        log "${GREEN}  ✓ Services deleted${NC}"
    else
        log "${YELLOW}  ⚠ No services found${NC}"
    fi

    # Clean up deployments
    if kubectl get deployment -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend > /dev/null 2>&1; then
        log "  Deleting deployments..."
        kubectl delete deployment -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend
        log "${GREEN}  ✓ Deployments deleted${NC}"
    else
        log "${YELLOW}  ⚠ No deployments found${NC}"
    fi

    # Clean up configmaps
    if kubectl get configmap -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend > /dev/null 2>&1; then
        log "  Deleting configmaps..."
        kubectl delete configmap -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend
        log "${GREEN}  ✓ ConfigMaps deleted${NC}"
    else
        log "${YELLOW}  ⚠ No configmaps found${NC}"
    fi
}

# Remove Istio injection label from namespace
cleanup_namespace_labels() {
    log "${BLUE}Cleaning up namespace labels...${NC}"

    if kubectl get namespace "$NAMESPACE" -o jsonpath='{.metadata.labels.istio-injection}' 2>/dev/null | grep -q "enabled"; then
        log "  Removing Istio injection label from namespace..."
        kubectl label namespace "$NAMESPACE" istio-injection-
        log "${GREEN}  ✓ Istio injection label removed${NC}"
    else
        log "${YELLOW}  ⚠ Namespace not labeled for Istio injection${NC}"
    fi
}

# Clean up temporary files
cleanup_temp_files() {
    log "${BLUE}Cleaning up temporary files...${NC}"

    # Remove any leftover certificate files
    for file in pos-frontend-key.pem pos-frontend-cert.pem; do
        if [ -f "$file" ]; then
            rm -f "$file"
            log "${GREEN}  ✓ Removed $file${NC}"
        fi
    done
}

# Show cleanup status
show_cleanup_status() {
    log "${BLUE}Cleanup Status Summary:${NC}"

    echo ""
    echo "Remaining resources in namespace $NAMESPACE:"

    # Check for any remaining resources
    echo "Pods:"
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend 2>/dev/null || echo "  None found"

    echo ""
    echo "Services:"
    kubectl get services -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend 2>/dev/null || echo "  None found"

    echo ""
    echo "Istio Resources:"
    kubectl get gateway,virtualservice,destinationrule -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend 2>/dev/null || echo "  None found"

    echo ""
    echo "Secrets:"
    kubectl get secret pos-frontend-tls-secret -n "$NAMESPACE" 2>/dev/null || echo "  None found"

    echo ""
    echo "Helm Releases:"
    helm list -n "$NAMESPACE" | grep "$RELEASE_NAME" || echo "  None found"
}

# Full cleanup
full_cleanup() {
    log "${YELLOW}Starting full cleanup of POS Frontend Istio deployment...${NC}"
    log "  Namespace: $NAMESPACE"
    log "  Release: $RELEASE_NAME"
    echo ""

    confirm

    cleanup_helm_release
    cleanup_istio_resources
    cleanup_secrets
    cleanup_application_resources
    cleanup_temp_files

    log "${GREEN}✓ Full cleanup completed${NC}"
}

# Cleanup only Istio resources
istio_only_cleanup() {
    log "${YELLOW}Cleaning up only Istio resources...${NC}"
    log "  Namespace: $NAMESPACE"
    echo ""

    confirm

    cleanup_istio_resources
    cleanup_secrets

    log "${GREEN}✓ Istio resources cleanup completed${NC}"
}

# Cleanup everything including namespace labels
complete_cleanup() {
    log "${YELLOW}Starting complete cleanup (including namespace labels)...${NC}"
    log "  Namespace: $NAMESPACE"
    log "  Release: $RELEASE_NAME"
    echo ""

    confirm

    cleanup_helm_release
    cleanup_istio_resources
    cleanup_secrets
    cleanup_application_resources
    cleanup_namespace_labels
    cleanup_temp_files

    log "${GREEN}✓ Complete cleanup finished${NC}"
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  full       - Clean up Helm release, Istio resources, and secrets (default)"
    echo "  istio      - Clean up only Istio resources (Gateway, VirtualService, etc.)"
    echo "  complete   - Full cleanup including namespace labels"
    echo "  status     - Show cleanup status and remaining resources"
    echo "  help       - Show this help message"
    echo ""
    echo "Options:"
    echo "  --force    - Skip confirmation prompts"
    echo ""
    echo "Environment Variables:"
    echo "  NAMESPACE      - Kubernetes namespace (default: default)"
    echo "  RELEASE_NAME   - Helm release name (default: pos-frontend)"
    echo "  FORCE_CLEANUP  - Skip confirmation (default: false)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full cleanup with confirmation"
    echo "  $0 --force           # Full cleanup without confirmation"
    echo "  $0 istio             # Clean up only Istio resources"
    echo "  $0 complete          # Complete cleanup including namespace labels"
    echo "  NAMESPACE=production $0 full  # Cleanup in production namespace"
}

# Main execution
main() {
    # Parse arguments
    COMMAND="full"

    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE_CLEANUP="true"
                shift
                ;;
            full|istio|complete|status|help)
                COMMAND="$1"
                shift
                ;;
            *)
                log "${RED}Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done

    # Execute command
    case "$COMMAND" in
        "full")
            full_cleanup
            echo ""
            show_cleanup_status
            ;;
        "istio")
            istio_only_cleanup
            echo ""
            show_cleanup_status
            ;;
        "complete")
            complete_cleanup
            echo ""
            show_cleanup_status
            ;;
        "status")
            show_cleanup_status
            ;;
        "help")
            show_help
            ;;
        *)
            log "${RED}Unknown command: $COMMAND${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
