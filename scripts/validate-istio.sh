#!/bin/bash

# Istio Configuration Validator for POS Frontend
# This script validates Istio configuration and troubleshoots common issues

set -e

# Configuration
NAMESPACE="${NAMESPACE:-default}"
APP_NAME="pos-frontend"
GATEWAY_NAME="pos-frontend-gateway"
VIRTUALSERVICE_NAME="pos-frontend-vs"
DESTINATIONRULE_NAME="pos-frontend-dr"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Check Istio installation
check_istio_installation() {
    log "${BLUE}Checking Istio installation...${NC}"

    local issues=0

    # Check istio-system namespace
    if ! kubectl get namespace istio-system > /dev/null 2>&1; then
        log "${RED}✗ Istio system namespace not found${NC}"
        issues=$((issues + 1))
    else
        log "${GREEN}✓ Istio system namespace exists${NC}"
    fi

    # Check Istio control plane
    if ! kubectl get deployment istiod -n istio-system > /dev/null 2>&1; then
        log "${RED}✗ Istio control plane (istiod) not found${NC}"
        issues=$((issues + 1))
    else
        local ready_replicas=$(kubectl get deployment istiod -n istio-system -o jsonpath='{.status.readyReplicas}')
        local desired_replicas=$(kubectl get deployment istiod -n istio-system -o jsonpath='{.spec.replicas}')

        if [ "$ready_replicas" = "$desired_replicas" ]; then
            log "${GREEN}✓ Istio control plane is ready ($ready_replicas/$desired_replicas)${NC}"
        else
            log "${YELLOW}⚠ Istio control plane not fully ready ($ready_replicas/$desired_replicas)${NC}"
            issues=$((issues + 1))
        fi
    fi

    # Check Istio ingress gateway
    if ! kubectl get deployment istio-ingressgateway -n istio-system > /dev/null 2>&1; then
        log "${RED}✗ Istio ingress gateway not found${NC}"
        issues=$((issues + 1))
    else
        local ready_replicas=$(kubectl get deployment istio-ingressgateway -n istio-system -o jsonpath='{.status.readyReplicas}')
        local desired_replicas=$(kubectl get deployment istio-ingressgateway -n istio-system -o jsonpath='{.spec.replicas}')

        if [ "$ready_replicas" = "$desired_replicas" ]; then
            log "${GREEN}✓ Istio ingress gateway is ready ($ready_replicas/$desired_replicas)${NC}"
        else
            log "${YELLOW}⚠ Istio ingress gateway not fully ready ($ready_replicas/$desired_replicas)${NC}"
            issues=$((issues + 1))
        fi
    fi

    return $issues
}

# Check namespace configuration
check_namespace_config() {
    log "${BLUE}Checking namespace configuration...${NC}"

    local issues=0

    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" > /dev/null 2>&1; then
        log "${RED}✗ Namespace '$NAMESPACE' not found${NC}"
        issues=$((issues + 1))
        return $issues
    fi

    # Check Istio injection label
    local injection_label=$(kubectl get namespace "$NAMESPACE" -o jsonpath='{.metadata.labels.istio-injection}')
    if [ "$injection_label" = "enabled" ]; then
        log "${GREEN}✓ Istio sidecar injection enabled for namespace${NC}"
    else
        log "${YELLOW}⚠ Istio sidecar injection not enabled for namespace${NC}"
        log "  Run: kubectl label namespace $NAMESPACE istio-injection=enabled"
        issues=$((issues + 1))
    fi

    return $issues
}

# Check application deployment
check_app_deployment() {
    log "${BLUE}Checking application deployment...${NC}"

    local issues=0

    # Check if deployment exists
    if ! kubectl get deployment "$APP_NAME" -n "$NAMESPACE" > /dev/null 2>&1; then
        log "${RED}✗ Application deployment '$APP_NAME' not found${NC}"
        issues=$((issues + 1))
        return $issues
    fi

    # Check deployment status
    local ready_replicas=$(kubectl get deployment "$APP_NAME" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
    local desired_replicas=$(kubectl get deployment "$APP_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')

    if [ "$ready_replicas" = "$desired_replicas" ]; then
        log "${GREEN}✓ Application deployment is ready ($ready_replicas/$desired_replicas)${NC}"
    else
        log "${YELLOW}⚠ Application deployment not fully ready ($ready_replicas/$desired_replicas)${NC}"
        issues=$((issues + 1))
    fi

    # Check if pods have Istio sidecar
    local pods=$(kubectl get pods -n "$NAMESPACE" -l app="$APP_NAME" -o jsonpath='{.items[*].metadata.name}')
    for pod in $pods; do
        local containers=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.containers[*].name}')
        if echo "$containers" | grep -q "istio-proxy"; then
            log "${GREEN}✓ Pod '$pod' has Istio sidecar${NC}"
        else
            log "${RED}✗ Pod '$pod' missing Istio sidecar${NC}"
            issues=$((issues + 1))
        fi
    done

    return $issues
}

# Check Istio Gateway
check_gateway() {
    log "${BLUE}Checking Istio Gateway...${NC}"

    local issues=0

    if ! kubectl get gateway "$GATEWAY_NAME" -n "$NAMESPACE" > /dev/null 2>&1; then
        log "${RED}✗ Gateway '$GATEWAY_NAME' not found${NC}"
        issues=$((issues + 1))
        return $issues
    fi

    log "${GREEN}✓ Gateway '$GATEWAY_NAME' exists${NC}"

    # Validate gateway configuration
    local hosts=$(kubectl get gateway "$GATEWAY_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.servers[*].hosts[*]}')
    log "  Configured hosts: $hosts"

    local ports=$(kubectl get gateway "$GATEWAY_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.servers[*].port.number}')
    log "  Configured ports: $ports"

    return $issues
}

# Check VirtualService
check_virtualservice() {
    log "${BLUE}Checking VirtualService...${NC}"

    local issues=0

    if ! kubectl get virtualservice "$VIRTUALSERVICE_NAME" -n "$NAMESPACE" > /dev/null 2>&1; then
        log "${RED}✗ VirtualService '$VIRTUALSERVICE_NAME' not found${NC}"
        issues=$((issues + 1))
        return $issues
    fi

    log "${GREEN}✓ VirtualService '$VIRTUALSERVICE_NAME' exists${NC}"

    # Validate VirtualService configuration
    local hosts=$(kubectl get virtualservice "$VIRTUALSERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.hosts[*]}')
    log "  Configured hosts: $hosts"

    local gateways=$(kubectl get virtualservice "$VIRTUALSERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.gateways[*]}')
    log "  Configured gateways: $gateways"

    return $issues
}

# Check DestinationRule
check_destinationrule() {
    log "${BLUE}Checking DestinationRule...${NC}"

    local issues=0

    if ! kubectl get destinationrule "$DESTINATIONRULE_NAME" -n "$NAMESPACE" > /dev/null 2>&1; then
        log "${YELLOW}⚠ DestinationRule '$DESTINATIONRULE_NAME' not found (optional)${NC}"
        return $issues
    fi

    log "${GREEN}✓ DestinationRule '$DESTINATIONRULE_NAME' exists${NC}"

    # Validate DestinationRule configuration
    local host=$(kubectl get destinationrule "$DESTINATIONRULE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.host}')
    log "  Configured host: $host"

    return $issues
}

# Test connectivity
test_connectivity() {
    log "${BLUE}Testing connectivity...${NC}"

    local issues=0

    # Get ingress gateway service details
    local ingress_host=$(kubectl get service istio-ingressgateway -n istio-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    local ingress_port=$(kubectl get service istio-ingressgateway -n istio-system -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')

    if [ -z "$ingress_host" ]; then
        ingress_host=$(kubectl get service istio-ingressgateway -n istio-system -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    fi

    if [ -z "$ingress_host" ]; then
        ingress_host="localhost"
        ingress_port=$(kubectl get service istio-ingressgateway -n istio-system -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
    fi

    log "Testing connectivity to: $ingress_host:$ingress_port"

    # Test HTTP connectivity
    if curl -f -s --max-time 10 -H "Host: pos-frontend.localhost" "http://$ingress_host:$ingress_port" > /dev/null 2>&1; then
        log "${GREEN}✓ HTTP connectivity test passed${NC}"
    else
        log "${RED}✗ HTTP connectivity test failed${NC}"
        log "  Try: curl -H 'Host: pos-frontend.localhost' http://$ingress_host:$ingress_port"
        issues=$((issues + 1))
    fi

    return $issues
}

# Show Istio proxy configuration
show_proxy_config() {
    log "${BLUE}Istio Proxy Configuration:${NC}"

    local pods=$(kubectl get pods -n "$NAMESPACE" -l app="$APP_NAME" -o jsonpath='{.items[0].metadata.name}')
    if [ -n "$pods" ]; then
        local pod=$(echo "$pods" | cut -d' ' -f1)
        log "Checking proxy config for pod: $pod"

        # Show listeners
        echo ""
        echo "Listeners:"
        kubectl exec "$pod" -n "$NAMESPACE" -c istio-proxy -- pilot-agent request GET listeners

        # Show clusters
        echo ""
        echo "Clusters:"
        kubectl exec "$pod" -n "$NAMESPACE" -c istio-proxy -- pilot-agent request GET clusters

        # Show routes
        echo ""
        echo "Routes:"
        kubectl exec "$pod" -n "$NAMESPACE" -c istio-proxy -- pilot-agent request GET routes
    fi
}

# Troubleshooting guide
show_troubleshooting() {
    log "${BLUE}Troubleshooting Guide:${NC}"

    echo ""
    echo "Common Issues and Solutions:"
    echo ""
    echo "1. Istio sidecar not injected:"
    echo "   - kubectl label namespace $NAMESPACE istio-injection=enabled"
    echo "   - kubectl rollout restart deployment/$APP_NAME -n $NAMESPACE"
    echo ""
    echo "2. Gateway not accessible:"
    echo "   - Check /etc/hosts: <INGRESS_IP> pos-frontend.localhost"
    echo "   - Verify gateway selector matches ingress gateway"
    echo ""
    echo "3. VirtualService not working:"
    echo "   - Check host matching between Gateway and VirtualService"
    echo "   - Verify destination service name and port"
    echo ""
    echo "4. Certificate issues (HTTPS):"
    echo "   - Check TLS secret exists: kubectl get secret pos-frontend-tls-secret -n $NAMESPACE"
    echo "   - Verify certificate is valid"
    echo ""
    echo "5. Performance issues:"
    echo "   - Check DestinationRule circuit breaker settings"
    echo "   - Monitor Istio proxy metrics"
    echo ""
    echo "Useful commands:"
    echo "   - istioctl proxy-config cluster <POD> -n $NAMESPACE"
    echo "   - istioctl proxy-config listener <POD> -n $NAMESPACE"
    echo "   - istioctl proxy-config route <POD> -n $NAMESPACE"
    echo "   - istioctl proxy-status"
    echo "   - kubectl logs -l app=$APP_NAME -c istio-proxy -n $NAMESPACE"
}

# Main validation function
main() {
    log "${YELLOW}Starting Istio configuration validation...${NC}"
    log "Namespace: $NAMESPACE"
    log "Application: $APP_NAME"
    log ""

    local total_issues=0

    check_istio_installation
    total_issues=$((total_issues + $?))

    check_namespace_config
    total_issues=$((total_issues + $?))

    check_app_deployment
    total_issues=$((total_issues + $?))

    check_gateway
    total_issues=$((total_issues + $?))

    check_virtualservice
    total_issues=$((total_issues + $?))

    check_destinationrule
    total_issues=$((total_issues + $?))

    test_connectivity
    total_issues=$((total_issues + $?))

    echo ""
    if [ $total_issues -eq 0 ]; then
        log "${GREEN}✓ All validations passed! Istio configuration is correct.${NC}"
    else
        log "${RED}✗ Found $total_issues issue(s) in Istio configuration.${NC}"
        log "${YELLOW}Run '$0 troubleshoot' for troubleshooting guide.${NC}"
    fi

    exit $total_issues
}

# Handle command line arguments
case "${1:-validate}" in
    "validate")
        main
        ;;
    "proxy-config")
        show_proxy_config
        ;;
    "troubleshoot")
        show_troubleshooting
        ;;
    "help"|"--help"|"-h")
        echo "Usage: $0 [validate|proxy-config|troubleshoot|help]"
        echo ""
        echo "Commands:"
        echo "  validate      - Validate Istio configuration (default)"
        echo "  proxy-config  - Show Istio proxy configuration"
        echo "  troubleshoot  - Show troubleshooting guide"
        echo "  help          - Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  NAMESPACE - Kubernetes namespace (default: default)"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
