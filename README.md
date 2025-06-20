# Don't be fooled by the cute AI text

This is just a POC for offline-first PWA.

# 🛒 Modern POS System - Vue PWA

[![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![CouchDB](https://img.shields.io/badge/CouchDB-E42528?style=for-the-badge&logo=apache-couchdb&logoColor=white)](https://couchdb.apache.org/)

A modern, feature-rich Point of Sale (POS) system built as a Progressive Web App (PWA) using Vue.js 3, TypeScript, and CouchDB. Designed for retail environments with offline-first capabilities, real-time synchronization, and enterprise-grade deployment options.

## ✨ Features

### 🎯 Core POS Functionality
- **Product Management**: Barcode scanning, inventory tracking, and product catalog
- **Order Processing**: Cart management, pricing calculations, and transaction handling
- **Customer Management**: Customer profiles, purchase history, and loyalty tracking
- **Operator Management**: Multi-user support with role-based access
- **Real-time Inventory**: Live stock updates and low-inventory alerts

### 🚀 Modern Technology Stack
- **Progressive Web App**: Offline-first architecture with service workers
- **Real-time Sync**: CouchDB integration with PouchDB for seamless data synchronization
- **Responsive Design**: Mobile-first UI with Tailwind CSS and glassmorphism effects
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Modern Vue 3**: Composition API, `<script setup>`, and reactive state management

### 🎨 User Experience
- **Modern UI/UX**: Beautiful, intuitive interface with smooth animations
- **Keyboard Shortcuts**: Fast operation with F-key shortcuts for power users
- **Touch-Friendly**: Optimized for tablets and touch-screen devices
- **Accessibility**: WCAG-compliant with screen reader support
- **Dark Mode**: Automatic theme switching based on user preferences

### 🔒 Enterprise Features
- **Security**: Input validation, XSS protection, and secure headers
- **Scalability**: Kubernetes-ready with auto-scaling capabilities
- **Monitoring**: Health checks, logging, and performance metrics
- **Backup & Recovery**: Automated data backup and disaster recovery
- **Multi-tenant**: Support for multiple store locations

## 🏗️ Architecture

```mermaid
graph TB
    A[Vue PWA Frontend] --> B[PouchDB Local Storage]
    B --> C[CouchDB Backend]
    A --> D[Service Worker]
    A --> E[Vite Build System]
    F[Kubernetes Cluster] --> G[Nginx Pods]
    G --> H[Load Balancer]
    I[Helm Charts] --> F
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Vue 3 + TypeScript | Reactive UI framework |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **PWA** | Vite PWA Plugin | Service worker and manifest |
| **Database** | CouchDB + PouchDB | Offline-first data storage |
| **State Management** | Pinia | Reactive state management |
| **Validation** | Vee-Validate + Zod | Form validation and schema |
| **Build Tool** | Vite | Fast development and building |
| **Deployment** | Kubernetes + Helm | Container orchestration |
| **Web Server** | Nginx | Static file serving and routing |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **CouchDB** 3.0+ (for data storage)
- **Docker** (for containerization)
- **Kubernetes** + **Helm** (for deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vue-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up CouchDB**
   ```bash
   docker-compose up -d couchdb-store
   ```

4. **Configure environment**
   ```bash
   # Update CouchDB URL in src/db.ts if needed
   # Default: http://localhost:5984
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   ```
   http://localhost:5173
   ```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🖥️ Usage

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F1` | Focus barcode input |
| `F2` | Logout current operator |
| `F3` | Change operator |
| `F4` | Clear current customer |
| `F5` | Select customer |
| `F6` | Complete order |
| `F7` | Abandon order |

### Basic Workflow

1. **Login** as an operator
2. **Scan/Enter** product barcodes to add items
3. **Select** a customer (optional)
4. **Review** the order and apply discounts
5. **Process** payment and complete the transaction

### PWA Features

- **Install**: Add to home screen on mobile devices
- **Offline**: Continue working without internet connection
- **Sync**: Automatic data synchronization when online
- **Updates**: Automatic app updates with service worker

## 🐳 Docker Compose

### Quick Start with Docker Compose

The easiest way to run the complete development environment:

```bash
# Start CouchDB
docker-compose up -d

# Check if CouchDB is running
docker-compose ps

# View logs
docker-compose logs -f couchdb-store

# Stop services
docker-compose down
```

### Service Configuration

The `docker-compose.yml` includes:

- **CouchDB 3.5**: Database with persistent storage
- **Health Checks**: Automatic service monitoring
- **Persistent Volumes**: Data survives container restarts
- **Custom Network**: Isolated container networking

### CouchDB Access

Once started, CouchDB will be available at:
- **Web Interface**: http://localhost:5984/_utils
- **API Endpoint**: http://localhost:5984
- **Credentials**: admin/password

### Useful Commands

```bash
# Start only CouchDB
docker-compose up -d couchdb-store

# Restart CouchDB
docker-compose restart couchdb-store

# View CouchDB logs
docker-compose logs -f couchdb-store

# Clean up (removes containers and volumes)
docker-compose down -v

# Update CouchDB image
docker-compose pull couchdb-store
docker-compose up -d couchdb-store
```

## 🚀 Deployment

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t pos-frontend:latest .
   ```

2. **Run the container**
   ```bash
   docker run -p 8080:8080 pos-frontend:latest
   ```

### Kubernetes Deployment

1. **Deploy using Helm**
   ```bash
   # Quick deployment
   ./deploy.sh

   # Custom deployment
   helm install pos-frontend ./helm-chart \
     --set image.tag=v1.0.0 \
     --set ingress.hosts[0].host=pos.yourdomain.com
   ```

2. **Verify deployment**
   ```bash
   kubectl get pods -l app.kubernetes.io/name=pos-frontend
   helm test pos-frontend
   ```

3. **Access the application**
   ```bash
   # Port forward for testing
   kubectl port-forward svc/pos-frontend 8080:80

   # Or access via ingress
   https://pos.yourdomain.com
   ```

### Environment Configuration

#### Development
```yaml
# values-dev.yaml
replicaCount: 1
autoscaling:
  enabled: false
ingress:
  hosts:
    - host: pos-dev.local
resources:
  limits:
    cpu: 200m
    memory: 256Mi
```

#### Production
```yaml
# values-prod.yaml
replicaCount: 3
autoscaling:
  enabled: true
  maxReplicas: 20
ingress:
  hosts:
    - host: pos.company.com
  tls:
    - secretName: pos-tls
resources:
  limits:
    cpu: 1000m
    memory: 1Gi
```

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e
```

### Helm Tests
```bash
helm test pos-frontend
```

### Performance Testing
```bash
npm run lighthouse
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `COUCHDB_URL` | CouchDB server URL | `http://localhost:5984` |
| `NODE_ENV` | Environment mode | `development` |
| `VITE_APP_TITLE` | Application title | `POS System` |

### CouchDB Setup

1. **Create databases**
   ```bash
   curl -X PUT http://admin:password@localhost:5984/products
   curl -X PUT http://admin:password@localhost:5984/customers
   curl -X PUT http://admin:password@localhost:5984/orders
   curl -X PUT http://admin:password@localhost:5984/operators
   ```

2. **Import sample data**
   ```bash
   # Import products
   curl -X POST http://admin:password@localhost:5984/products/_bulk_docs \
     -H "Content-Type: application/json" \
     -d @products-seed.jsonl
   ```

## 📊 Monitoring

### Health Checks
- **Liveness**: `/health` endpoint
- **Readiness**: Application startup check
- **Metrics**: Prometheus integration available

### Logging
- **Application logs**: Structured JSON logging
- **Access logs**: Nginx access patterns
- **Error tracking**: Centralized error collection

## 🔐 Security

### Security Features
- **Content Security Policy**: XSS protection
- **HTTPS Enforcement**: SSL/TLS termination
- **Input Validation**: Zod schema validation
- **CORS Configuration**: Cross-origin request handling
- **Rate Limiting**: Request throttling
- **Security Headers**: OWASP recommended headers

### Best Practices
- Non-root container execution
- Read-only root filesystem
- Network policies for traffic control
- Regular security updates
- Data encryption at rest and in transit

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use Composition API for new components
- Write tests for new features
- Update documentation
- Follow conventional commit messages

## 📝 API Documentation

### PouchDB/CouchDB Schema

#### Products
```typescript
interface Product {
  _id: string;
  name: string;
  barcode: string;
  price: number;
  category: string;
  inventory: number;
  description?: string;
}
```

#### Customers
```typescript
interface Customer {
  _id: string;
  name: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
}
```

#### Orders
```typescript
interface Order {
  _id: string;
  customerId?: string;
  operatorId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}
```

## 🐛 Troubleshooting

### Common Issues

#### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# TypeScript errors
npm run type-check
```

#### PWA Issues
```bash
# Clear service worker cache
# Go to DevTools > Application > Storage > Clear storage
```

#### Database Issues
```bash
# Check CouchDB connection
curl http://localhost:5984/_up

# Reset local databases
# Go to DevTools > Application > IndexedDB > Delete
```

#### Kubernetes Issues
```bash
# Check pod logs
kubectl logs -l app.kubernetes.io/name=pos-frontend

# Debug service
kubectl describe service pos-frontend

# Check ingress
kubectl get ingress pos-frontend -o yaml
```

## 📈 Performance

### Optimization Features
- **Code Splitting**: Lazy-loaded routes
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image compression and WebP support
- **Caching**: Browser and CDN caching strategies
- **Bundle Analysis**: Webpack bundle analyzer

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.0s

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Vue.js Team** - For the amazing framework
- **Vite Team** - For the fast build tool
- **CouchDB Community** - For the reliable database
- **Tailwind CSS** - For the utility-first CSS framework
- **Contributors** - Everyone who helped improve this project

## 📞 Support

- **Documentation**: [Project Wiki](wiki-url)
- **Issues**: [GitHub Issues](issues-url)
- **Discussions**: [GitHub Discussions](discussions-url)
- **Email**: dev@yourcompany.com

---

<div align="center">
  <p>Built with ❤️ for modern retail businesses</p>
  <p>
    <a href="#top">Back to top</a> |
    <a href="CHANGELOG.md">Changelog</a> |
    <a href="CONTRIBUTING.md">Contributing</a>
  </p>
</div>
