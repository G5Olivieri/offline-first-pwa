#!/bin/bash

# Deploy POS Frontend with Istio Service Mesh
# This script deploys the application with Istio Gateway and VirtualService

set -e

# Configuration
NAMESPACE="${NAMESPACE:-pos-frontend}"
RELEASE_NAME="${RELEASE_NAME:-pos-frontend}"
CHART_PATH="${CHART_PATH:-./helm-chart}"
VALUES_FILE="${VALUES_FILE:-values-istio.yaml}"
ENVIRONMENT="${ENVIRONMENT:-development}"

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

# Check if Istio is installed
check_istio() {
    log "${BLUE}Checking Istio installation...${NC}"

    if ! kubectl get namespace istio-system > /dev/null 2>&1; then
        log "${RED}✗ Istio system namespace not found${NC}"
        log "${YELLOW}Please install Istio first:${NC}"
        log "  curl -L https://istio.io/downloadIstio | sh -"
        log "  istioctl install --set values.defaultRevision=default"
        exit 1
    fi

    if ! kubectl get deployment istiod -n istio-system > /dev/null 2>&1; then
        log "${RED}✗ Istio control plane not found${NC}"
        exit 1
    fi

    # Check if Istio gateway is running
    if ! kubectl get deployment istio-ingressgateway -n istio-system > /dev/null 2>&1; then
        log "${YELLOW}⚠ Istio ingress gateway not found${NC}"
        log "${YELLOW}Installing Istio ingress gateway...${NC}"
        istioctl install --set values.gateways.istio-ingressgateway.enabled=true
    fi

    log "${GREEN}✓ Istio is properly installed${NC}"
}

# Enable Istio injection for namespace
enable_istio_injection() {
    log "${BLUE}Enabling Istio sidecar injection for namespace: $NAMESPACE${NC}"

    if ! kubectl get namespace "$NAMESPACE" > /dev/null 2>&1; then
        log "${YELLOW}Creating namespace: $NAMESPACE${NC}"
        kubectl create namespace "$NAMESPACE"
    fi

    kubectl label namespace "$NAMESPACE" istio-injection=enabled --overwrite
    log "${GREEN}✓ Istio injection enabled for namespace $NAMESPACE${NC}"
}

# Deploy TLS certificates (development only)
setup_tls_certs() {
    if [ "$ENVIRONMENT" = "development" ]; then
        log "${BLUE}Setting up development TLS certificates...${NC}"

        # Create self-signed certificate for development
        openssl req -x509 -newkey rsa:4096 -keyout pos-frontend-key.pem -out pos-frontend-cert.pem \
            -days 365 -nodes -subj "/CN=pos-frontend.localhost"

        # Create Kubernetes secret
        kubectl create secret tls pos-frontend-tls-secret \
            --cert=pos-frontend-cert.pem \
            --key=pos-frontend-key.pem \
            -n "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

        # Cleanup certificate files
        rm -f pos-frontend-key.pem pos-frontend-cert.pem

        log "${GREEN}✓ Development TLS certificates created${NC}"
    fi
}

# Deploy with Helm
deploy_helm_chart() {
    log "${BLUE}Deploying POS Frontend with Istio...${NC}"

    # Check if chart exists
    if [ ! -d "$CHART_PATH" ]; then
        log "${RED}✗ Helm chart not found at: $CHART_PATH${NC}"
        exit 1
    fi

    # Check if values file exists
    if [ ! -f "$CHART_PATH/$VALUES_FILE" ]; then
        log "${RED}✗ Values file not found: $CHART_PATH/$VALUES_FILE${NC}"
        exit 1
    fi

    # Deploy with Helm
    helm upgrade --install "$RELEASE_NAME" "$CHART_PATH" \
        --namespace "$NAMESPACE" \
        --values "$CHART_PATH/$VALUES_FILE" \
        --set environment="$ENVIRONMENT" \
        --wait --timeout=300s

    log "${GREEN}✓ Helm deployment completed${NC}"
}

# Verify deployment
verify_deployment() {
    log "${BLUE}Verifying Istio deployment...${NC}"

    # Check pods
    log "Checking pods..."
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend

    # Check services
    log "Checking services..."
    kubectl get services -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend

    # Check Istio Gateway
    log "Checking Istio Gateway..."
    kubectl get gateway -n "$NAMESPACE"

    # Check VirtualService
    log "Checking VirtualService..."
    kubectl get virtualservice -n "$NAMESPACE"

    # Check DestinationRule
    log "Checking DestinationRule..."
    kubectl get destinationrule -n "$NAMESPACE"

    # Get Istio ingress gateway external IP
    INGRESS_HOST=$(kubectl get service istio-ingressgateway -n istio-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    INGRESS_PORT=$(kubectl get service istio-ingressgateway -n istio-system -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')

    if [ -z "$INGRESS_HOST" ]; then
        INGRESS_HOST=$(kubectl get service istio-ingressgateway -n istio-system -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    fi

    if [ -z "$INGRESS_HOST" ]; then
        INGRESS_HOST="localhost"
        INGRESS_PORT=$(kubectl get service istio-ingressgateway -n istio-system -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
    fi

    log "${GREEN}✓ Deployment verification completed${NC}"
    log ""
    log "${YELLOW}Access Information:${NC}"
    log "  Application URL: http://pos-frontend.localhost:${INGRESS_PORT:-80}"
    log "  Ingress Host: $INGRESS_HOST"
    log "  Ingress Port: $INGRESS_PORT"
    log ""
    log "${YELLOW}Add this to your /etc/hosts file for local development:${NC}"
    log "  $INGRESS_HOST pos-frontend.localhost"
}

# Show Istio configuration
show_istio_config() {
    log "${BLUE}Istio Configuration Summary:${NC}"

    echo ""
    echo "Gateway Configuration:"
    kubectl get gateway -n "$NAMESPACE" -o yaml

    echo ""
    echo "VirtualService Configuration:"
    kubectl get virtualservice -n "$NAMESPACE" -o yaml

    echo ""
    echo "DestinationRule Configuration:"
    kubectl get destinationrule -n "$NAMESPACE" -o yaml
}

# Show monitoring endpoints
show_monitoring() {
    log "${BLUE}Monitoring Endpoints:${NC}"

    # Kiali
    echo "Kiali (Service Mesh Observability):"
    echo "  kubectl port-forward -n istio-system svc/kiali 20001:20001"
    echo "  http://localhost:20001/kiali"

    # Jaeger
    echo ""
    echo "Jaeger (Distributed Tracing):"
    echo "  kubectl port-forward -n istio-system svc/jaeger 16686:16686"
    echo "  http://localhost:16686"

    # Grafana
    echo ""
    echo "Grafana (Metrics Dashboard):"
    echo "  kubectl port-forward -n istio-system svc/grafana 3000:3000"
    echo "  http://localhost:3000"

    # Prometheus
    echo ""
    echo "Prometheus (Metrics Collection):"
    echo "  kubectl port-forward -n istio-system svc/prometheus 9090:9090"
    echo "  http://localhost:9090"
}

# Main deployment function
main() {
    log "${YELLOW}Starting Istio deployment for POS Frontend...${NC}"
    log "Environment: $ENVIRONMENT"
    log "Namespace: $NAMESPACE"
    log "Release: $RELEASE_NAME"
    log ""

    check_istio
    enable_istio_injection
    setup_tls_certs
    deploy_helm_chart
    verify_deployment

    log "${GREEN}✓ Istio deployment completed successfully!${NC}"
    log ""

    # Show additional information based on flags
    if [ "${SHOW_CONFIG:-false}" = "true" ]; then
        show_istio_config
    fi

    if [ "${SHOW_MONITORING:-false}" = "true" ]; then
        show_monitoring
    fi
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "verify")
        verify_deployment
        ;;
    "config")
        show_istio_config
        ;;
    "monitoring")
        show_monitoring
        ;;
    "clean")
        log "${YELLOW}Cleaning up Istio deployment...${NC}"
        helm uninstall "$RELEASE_NAME" -n "$NAMESPACE" || true
        kubectl delete gateway,virtualservice,destinationrule -n "$NAMESPACE" -l app.kubernetes.io/name=pos-frontend || true
        log "${GREEN}✓ Cleanup completed${NC}"
        ;;
    "help"|"--help"|"-h")
        echo "Usage: $0 [deploy|verify|config|monitoring|clean|help]"
        echo ""
        echo "Commands:"
        echo "  deploy     - Deploy POS Frontend with Istio (default)"
        echo "  verify     - Verify the deployment status"
        echo "  config     - Show Istio configuration"
        echo "  monitoring - Show monitoring setup instructions"
        echo "  clean      - Remove the deployment"
        echo "  help       - Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  NAMESPACE      - Kubernetes namespace (default: default)"
        echo "  RELEASE_NAME   - Helm release name (default: pos-frontend)"
        echo "  CHART_PATH     - Path to Helm chart (default: ./helm-chart)"
        echo "  VALUES_FILE    - Values file name (default: values-istio.yaml)"
        echo "  ENVIRONMENT    - Deployment environment (default: development)"
        echo "  SHOW_CONFIG    - Show Istio config after deployment"
        echo "  SHOW_MONITORING - Show monitoring endpoints after deployment"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
