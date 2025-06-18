# POS Development Guide

This guide provides comprehensive information for developers working on the POS (Point of Sale) system.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Architecture Overview](#architecture-overview)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Performance Optimization](#performance-optimization)
- [Debugging and Troubleshooting](#debugging-and-troubleshooting)
- [Deployment Procedures](#deployment-procedures)

## Development Environment Setup

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git
- A modern code editor (VS Code recommended)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vue-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Start CouchDB (if using Docker)**
   ```bash
   docker run -p 5984:5984 -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password apache/couchdb:3.3
   ```

### Development Tools

#### VS Code Extensions (Recommended)
- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Thunder Client (for API testing)

#### Browser Extensions
- Vue.js devtools
- React Developer Tools (for debugging)

## Architecture Overview

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AppModal.vue    # Global modal component
│   ├── ToastContainer.vue # Notification system
│   └── ...
├── composables/        # Vue composition functions
│   ├── use-notifications.ts
│   ├── use-keyboard-shortcuts.ts
│   └── ...
├── config/             # Configuration utilities
│   └── env.ts          # Environment variable handling
├── pages/              # Route components
│   ├── home/
│   ├── products/
│   ├── customers/
│   └── utils/          # Utility pages (monitoring, etc.)
├── stores/             # Pinia state management
├── types/              # TypeScript type definitions
└── assets/             # Static assets
```

### Key Technologies

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Pinia** for state management
- **Vue Router** for navigation
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **PouchDB/CouchDB** for data persistence
- **PWA** capabilities for offline support

### Data Flow

1. **UI Components** trigger actions
2. **Stores** manage application state
3. **Database Layer** (PouchDB) handles data persistence
4. **Sync Layer** communicates with CouchDB
5. **Offline Support** through service workers

## Code Standards

### TypeScript Guidelines

```typescript
// Use interfaces for object types
interface Product {
  id: string
  name: string
  price: number
  barcode?: string
}

// Use type for unions and computed types
type OrderStatus = 'pending' | 'completed' | 'cancelled'

// Always provide return types for functions
function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

// Use const assertions for readonly data
const ORDER_STATUSES = ['pending', 'completed', 'cancelled'] as const
```

### Vue 3 Composition API Patterns

```vue
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useStore } from '@/stores/product-store'

// Props with types
interface Props {
  productId: string
  isEditable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditable: false
})

// Emits with types
interface Emits {
  (e: 'save', product: Product): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// Reactive state
const isLoading = ref(false)
const error = ref<string | null>(null)

// Store usage
const productStore = useStore()

// Computed properties
const canSave = computed(() => {
  return props.isEditable && !isLoading.value
})

// Lifecycle hooks
onMounted(async () => {
  await loadProduct()
})

// Methods
const loadProduct = async () => {
  try {
    isLoading.value = true
    await productStore.loadProduct(props.productId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}
</script>
```

### Styling Guidelines

```vue
<template>
  <!-- Use semantic class names -->
  <div class="product-card">
    <!-- Use Tailwind utility classes -->
    <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <!-- Use responsive classes -->
      <h3 class="text-lg font-semibold text-gray-900 md:text-xl">
        {{ product.name }}
      </h3>

      <!-- Use state-based classes -->
      <button
        class="btn btn-primary"
        :class="{ 'btn-disabled': isLoading }"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles */
.product-card {
  @apply max-w-sm mx-auto;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
```

## Testing Guidelines

### Unit Testing (Future Implementation)

```typescript
// Example test structure
describe('ProductStore', () => {
  let store: ReturnType<typeof useProductStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useProductStore()
  })

  it('should add product to order', async () => {
    const product = createMockProduct()
    await store.addProduct(product)

    expect(store.products).toContain(product)
  })

  it('should handle product not found', async () => {
    const result = await store.findProductByBarcode('invalid')
    expect(result).toBeNull()
  })
})
```

### E2E Testing Scenarios

1. **Order Flow**
   - Scan product barcode
   - Add multiple products
   - Apply discounts
   - Complete checkout

2. **Customer Management**
   - Create new customer
   - Search existing customers
   - Update customer information

3. **Offline Functionality**
   - Work offline
   - Sync when connection restored
   - Handle conflicts

## Performance Optimization

### Bundle Size Optimization

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'ui': ['@headlessui/vue', '@heroicons/vue'],
          'db': ['pouchdb', 'pouchdb-find']
        }
      }
    }
  }
})
```

### Code Splitting

```typescript
// Route-based code splitting
const routes = [
  {
    path: '/products',
    component: () => import('@/pages/products/products.vue')
  },
  {
    path: '/customers',
    component: () => import('@/pages/customers/customers.vue')
  }
]
```

### Image Optimization

```vue
<template>
  <!-- Use modern image formats -->
  <picture>
    <source srcset="/images/product.webp" type="image/webp">
    <source srcset="/images/product.avif" type="image/avif">
    <img src="/images/product.jpg" alt="Product" loading="lazy">
  </picture>
</template>
```

### Performance Monitoring

```typescript
// Use the performance monitoring composable
import { usePerformanceMonitoring } from '@/composables/use-performance-monitoring'

const { metrics, getPerformanceGrade } = usePerformanceMonitoring()

// Monitor critical user journeys
const trackCheckout = () => {
  performance.mark('checkout-start')
  // ... checkout logic
  performance.mark('checkout-end')
  performance.measure('checkout-duration', 'checkout-start', 'checkout-end')
}
```

## Debugging and Troubleshooting

### Development Tools

```typescript
// Environment-based debugging
import { isDebugMode, log } from '@/config/env'

if (isDebugMode) {
  log('debug', 'Order state:', order)
}

// Vue DevTools integration
app.config.globalProperties.$log = log
```

### Common Issues

#### 1. Database Sync Issues
```bash
# Check CouchDB status
curl http://localhost:5984

# Reset local database
localStorage.clear()
```

#### 2. Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Type check
npm run type-check
```

#### 3. Performance Issues
```bash
# Analyze bundle
npm run build
npx vite-bundle-analyzer dist
```

### Error Handling Patterns

```typescript
// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)

  // Send to error tracking service
  // trackError(err, { component: instance?.$options.name, info })
}

// Component-level error handling
const handleAsyncError = async (operation: () => Promise<void>) => {
  try {
    await operation()
  } catch (error) {
    console.error('Operation failed:', error)
    $notify.error('Operation Failed', error.message)
  }
}
```

## Deployment Procedures

### Environment Preparation

```bash
# Validate environment
npm run env:validate

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Or use docker-compose
docker-compose up -d
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes
npm run k8s:deploy

# Check deployment status
kubectl get pods -l app=pos-frontend

# View logs
kubectl logs -l app=pos-frontend
```

### Health Checks

```bash
# Application health
npm run health-check

# Database backup
npm run backup

# Monitor system
# Access /utils/monitoring in the application
```

## Maintenance Tasks

### Regular Maintenance

1. **Daily**: Check error logs and performance metrics
2. **Weekly**: Review database size and performance
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Performance audit and optimization

### Backup Procedures

```bash
# Create backup
npm run backup

# List backups
npm run backup:list

# Clean old backups
npm run backup:cleanup
```

### Monitoring

- Access the monitoring dashboard at `/utils/monitoring`
- Check health endpoint: `/health`
- Review error logs in the monitoring interface
- Monitor Web Vitals and performance metrics

## Contributing Guidelines

1. **Branch Naming**: `feature/description` or `fix/description`
2. **Commit Messages**: Follow conventional commits format
3. **Pull Requests**: Include description, testing notes, and screenshots
4. **Code Review**: All changes require review
5. **Documentation**: Update relevant documentation

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [CouchDB Documentation](https://docs.couchdb.org/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

---

For more information or support, please refer to the main README.md or contact the development team.
