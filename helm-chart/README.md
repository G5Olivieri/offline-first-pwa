# POS Frontend Helm Chart

This Helm chart deploys the Vue.js POS (Point of Sale) PWA application to Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.8+
- NGINX Ingress Controller (if ingress is enabled)
- cert-manager (if TLS is enabled)

## Installation

### Quick Start

```bash
# Add the repository (if using a Helm repository)
helm repo add pos-charts https://your-charts-repo.com
helm repo update

# Install the chart
helm install pos-frontend pos-charts/pos-frontend

# Or install from local directory
helm install pos-frontend ./helm-chart
```

### Custom Installation

```bash
# Install with custom values
helm install pos-frontend ./helm-chart \
  --set image.repository=your-registry/pos-frontend \
  --set image.tag=v1.2.3 \
  --set ingress.hosts[0].host=pos.your-domain.com \
  --set ingress.tls[0].secretName=pos-tls \
  --set ingress.tls[0].hosts[0]=pos.your-domain.com
```

## Configuration

The following table lists the configurable parameters and their default values.

### Application Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `2` |
| `image.repository` | Image repository | `pos-frontend` |
| `image.tag` | Image tag | `"latest"` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `nameOverride` | Override the name | `""` |
| `fullnameOverride` | Override the full name | `""` |

### Service Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `80` |
| `service.targetPort` | Container port | `8080` |

### Ingress Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `"nginx"` |
| `ingress.hosts[0].host` | Hostname | `pos-frontend.local` |
| `ingress.hosts[0].paths[0].path` | Path | `/` |
| `ingress.hosts[0].paths[0].pathType` | Path type | `Prefix` |
| `ingress.tls[0].secretName` | TLS secret name | `pos-frontend-tls` |

### Resource Management

| Parameter | Description | Default |
|-----------|-------------|---------|
| `resources.limits.cpu` | CPU limit | `500m` |
| `resources.limits.memory` | Memory limit | `512Mi` |
| `resources.requests.cpu` | CPU request | `250m` |
| `resources.requests.memory` | Memory request | `256Mi` |

### Autoscaling

| Parameter | Description | Default |
|-----------|-------------|---------|
| `autoscaling.enabled` | Enable HPA | `true` |
| `autoscaling.minReplicas` | Minimum replicas | `2` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | CPU target | `80` |
| `autoscaling.targetMemoryUtilizationPercentage` | Memory target | `80` |

### Security Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `podSecurityContext.fsGroup` | File system group | `101` |
| `podSecurityContext.runAsNonRoot` | Run as non-root | `true` |
| `podSecurityContext.runAsUser` | User ID | `101` |
| `securityContext.allowPrivilegeEscalation` | Allow privilege escalation | `false` |
| `securityContext.readOnlyRootFilesystem` | Read-only root filesystem | `true` |

## Building and Pushing the Docker Image

```bash
# Build the Docker image
docker build -t your-registry/pos-frontend:v1.0.0 .

# Push to registry
docker push your-registry/pos-frontend:v1.0.0
```

## Deployment Examples

### Development Environment

```bash
helm install pos-frontend ./helm-chart \
  --set replicaCount=1 \
  --set autoscaling.enabled=false \
  --set ingress.hosts[0].host=pos-dev.local \
  --set resources.limits.cpu=200m \
  --set resources.limits.memory=256Mi
```

### Production Environment

```bash
helm install pos-frontend ./helm-chart \
  --set replicaCount=3 \
  --set image.repository=your-registry/pos-frontend \
  --set image.tag=v1.0.0 \
  --set ingress.hosts[0].host=pos.your-company.com \
  --set ingress.tls[0].secretName=pos-prod-tls \
  --set ingress.tls[0].hosts[0]=pos.your-company.com \
  --set resources.limits.cpu=1000m \
  --set resources.limits.memory=1Gi \
  --set autoscaling.maxReplicas=20
```

## Monitoring and Health Checks

The application includes:
- **Liveness Probe**: Checks if the application is running
- **Readiness Probe**: Checks if the application is ready to serve traffic
- **Health Endpoint**: Available at `/health` for external monitoring

## Security Features

- Non-root container execution
- Read-only root filesystem
- Security headers configured in nginx
- Network policies for traffic control
- Service account with minimal permissions
- Pod security context with restricted privileges

## PWA Features

The application is configured as a Progressive Web App with:
- Service worker support
- Web app manifest
- Offline capability
- Caching strategies for static assets

## Upgrading

```bash
# Upgrade to a new version
helm upgrade pos-frontend ./helm-chart \
  --set image.tag=v1.1.0

# Rollback if needed
helm rollback pos-frontend 1
```

## Uninstalling

```bash
# Uninstall the release
helm uninstall pos-frontend
```

## Testing

```bash
# Run Helm tests
helm test pos-frontend
```

## Troubleshooting

### Common Issues

1. **Pod not starting**: Check resource limits and node capacity
2. **Ingress not working**: Verify ingress controller and DNS configuration
3. **Image pull errors**: Check image repository and credentials
4. **Health check failures**: Verify nginx configuration and port settings

### Debugging Commands

```bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=pos-frontend

# View pod logs
kubectl logs -l app.kubernetes.io/name=pos-frontend

# Describe deployment
kubectl describe deployment pos-frontend

# Check service endpoints
kubectl get endpoints pos-frontend

# Test service connectivity
kubectl run debug --image=curlimages/curl -it --rm -- curl http://pos-frontend/health
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with different configurations
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
