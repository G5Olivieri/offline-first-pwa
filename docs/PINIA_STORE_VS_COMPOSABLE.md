# Pinia Store vs Composable: A Comprehensive Comparison

## Overview

This document provides a detailed comparison between Vue 3 Composables and Pinia Stores, two powerful patterns for managing state and logic in Vue applications. Understanding when to use each approach is crucial for building maintainable and scalable applications.

## Table of Contents

1. [Fundamental Differences](#fundamental-differences)
2. [Composables](#composables)
3. [Pinia Stores](#pinia-stores)
4. [Comparison Matrix](#comparison-matrix)
5. [When to Use Each](#when-to-use-each)
6. [Migration Strategies](#migration-strategies)
7. [Best Practices](#best-practices)
8. [Real-World Examples](#real-world-examples)

## Fundamental Differences

### Composables
- **Purpose**: Encapsulate and reuse stateful logic
- **Scope**: Component-level or shared between components
- **Lifecycle**: Tied to component lifecycle
- **State**: Local to each component instance (unless explicitly shared)

### Pinia Stores
- **Purpose**: Global state management with reactive updates
- **Scope**: Application-wide
- **Lifecycle**: Persistent across component lifecycles
- **State**: Shared across all components that use the store

## Composables

### Definition
Composables are functions that leverage Vue's Composition API to encapsulate and reuse stateful logic across components.

### Structure
```typescript
// use-counter.ts
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = initialValue

  const isEven = computed(() => count.value % 2 === 0)

  return {
    count: readonly(count),
    increment,
    decrement,
    reset,
    isEven
  }
}
```

### Advantages
- **Simplicity**: Easy to understand and implement
- **Testability**: Pure functions are easy to test in isolation
- **Reusability**: Can be used across multiple components
- **Flexibility**: Each component gets its own instance
- **Performance**: No global state overhead
- **Type Safety**: Excellent TypeScript support

### Disadvantages
- **No Persistence**: State is lost when component unmounts
- **No Cross-Component Communication**: Each usage creates isolated state
- **Limited Debugging**: No centralized state inspection
- **Memory Usage**: Multiple instances can consume more memory

### Use Cases
- Form validation logic
- API request handling
- DOM manipulation utilities
- Component-specific business logic
- Temporary state management
- Utility functions with state

## Pinia Stores

### Definition
Pinia is the official state management library for Vue 3, providing a centralized store pattern with reactive state management.

### Structure
```typescript
// analytics-store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAnalyticsStore = defineStore('analytics', () => {
  // State
  const events = ref<AnalyticsEvent[]>([])
  const isEnabled = ref(true)

  // Getters (computed)
  const eventCount = computed(() => events.value.length)
  const recentEvents = computed(() => events.value.slice(-10))

  // Actions
  const trackEvent = (event: AnalyticsEvent) => {
    if (isEnabled.value) {
      events.value.push(event)
    }
  }

  const clearEvents = () => {
    events.value = []
  }

  const toggleTracking = () => {
    isEnabled.value = !isEnabled.value
  }

  return {
    // State
    events,
    isEnabled,

    // Getters
    eventCount,
    recentEvents,

    // Actions
    trackEvent,
    clearEvents,
    toggleTracking
  }
})
```

### Advantages
- **Global State**: Shared across all components
- **Persistence**: State survives component lifecycle
- **DevTools**: Excellent debugging with Vue DevTools
- **Time Travel**: State mutations can be tracked and reversed
- **SSR Support**: Server-side rendering compatibility
- **Plugin System**: Extensible with plugins
- **Hot Module Replacement**: Development-friendly

### Disadvantages
- **Complexity**: More overhead for simple use cases
- **Global Coupling**: Components become dependent on global state
- **Testing Complexity**: Requires store setup in tests
- **Memory Usage**: Global state persists even when not needed
- **Overuse Risk**: Tendency to put everything in stores

### Use Cases
- Application-wide state (user authentication, theme, settings)
- Cross-component communication
- Data caching and synchronization
- Complex business logic
- State that needs to persist across routes
- Analytics and tracking
- WebSocket connections

## Comparison Matrix

| Aspect | Composables | Pinia Stores |
|--------|-------------|--------------|
| **State Scope** | Component-local | Global |
| **Persistence** | Component lifecycle | Application lifecycle |
| **Testing** | ⭐⭐⭐⭐⭐ Easy | ⭐⭐⭐ Moderate |
| **Debugging** | ⭐⭐⭐ Basic | ⭐⭐⭐⭐⭐ Advanced |
| **Performance** | ⭐⭐⭐⭐⭐ Minimal overhead | ⭐⭐⭐⭐ Some overhead |
| **Reusability** | ⭐⭐⭐⭐⭐ Highly reusable | ⭐⭐⭐ Singleton pattern |
| **Type Safety** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent |
| **Setup Complexity** | ⭐⭐⭐⭐⭐ Minimal | ⭐⭐⭐ Requires store setup |
| **Learning Curve** | ⭐⭐⭐⭐ Easy | ⭐⭐⭐ Moderate |
| **DevTools** | ⭐⭐ Limited | ⭐⭐⭐⭐⭐ Full support |
| **SSR Support** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |

## When to Use Each

### Use Composables When:
- **Local Component Logic**: State and logic specific to a component
- **Utility Functions**: Reusable logic that doesn't need global state
- **Form Handling**: Component-specific form validation and management
- **API Calls**: When each component needs its own data fetching
- **Temporary State**: Short-lived state that doesn't need persistence
- **Simple State**: Basic reactive state without complex interactions

### Use Pinia Stores When:
- **Global State**: Data that needs to be shared across multiple components
- **User Authentication**: Login state, user profile, permissions
- **Application Settings**: Theme, language, preferences
- **Data Caching**: Shared data that should be cached and reused
- **Complex Business Logic**: Multi-step processes that span components
- **Real-time Data**: WebSocket connections, live updates
- **Analytics**: Event tracking and application metrics

## Migration Strategies

### From Composable to Pinia Store

```typescript
// Before: Composable
export function useAuth() {
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)

  const login = async (credentials) => {
    // login logic
  }

  return { user, isAuthenticated, login }
}

// After: Pinia Store
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)

  const login = async (credentials) => {
    // login logic
  }

  return { user, isAuthenticated, login }
})
```

### From Pinia Store to Composable

```typescript
// Before: Pinia Store (over-engineered for simple case)
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
})

// After: Composable
export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const increment = () => count.value++
  return { count, increment }
}
```

## Best Practices

### Composables Best Practices

1. **Naming Convention**: Use `use` prefix
2. **Return Readonly**: Expose readonly refs when appropriate
3. **Cleanup**: Handle cleanup in `onUnmounted`
4. **Type Safety**: Use proper TypeScript types
5. **Pure Functions**: Avoid side effects in composables

```typescript
export function useApi<T>(url: string) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetch = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(url)
      data.value = response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  onMounted(fetch)

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    refetch: fetch
  }
}
```

### Pinia Store Best Practices

1. **Single Responsibility**: Each store should have a clear purpose
2. **Computed Properties**: Use computed for derived state
3. **Action Grouping**: Group related actions together
4. **Error Handling**: Implement proper error handling
5. **Loading States**: Track loading states for async operations

```typescript
export const useProductStore = defineStore('product', () => {
  // State
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeProducts = computed(() =>
    products.value.filter(p => p.active)
  )

  // Actions
  const fetchProducts = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/products')
      products.value = response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const addProduct = async (product: Product) => {
    try {
      const response = await api.post('/products', product)
      products.value.push(response.data)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    // State
    products,
    loading,
    error,

    // Getters
    activeProducts,

    // Actions
    fetchProducts,
    addProduct
  }
})
```

## Real-World Examples

### Example 1: Analytics System

Our POS application demonstrates both approaches:

**Composable Approach** (Old):
```typescript
// use-analytics.ts
export function useAnalytics() {
  const trackEvent = (event: AnalyticsEvent) => {
    analytics.track(event)
  }

  const trackPageView = (page: string) => {
    analytics.page(page)
  }

  return { trackEvent, trackPageView }
}
```

**Pinia Store Approach** (New):
```typescript
// analytics-store.ts
export const useAnalyticsStore = defineStore('analytics', () => {
  const events = ref<AnalyticsEvent[]>([])
  const sessionId = ref('')

  const trackEvent = (event: AnalyticsEvent) => {
    events.value.push(enrichEvent(event))
  }

  const flush = async () => {
    // Send events to server
  }

  return { events, sessionId, trackEvent, flush }
})
```

**Why We Migrated**: Analytics needs to persist across components and routes, track global application state, and provide centralized event management.

### Example 2: Form Validation

**Composable Approach** (Recommended):
```typescript
// use-form-validation.ts
export function useFormValidation<T>(schema: ZodSchema<T>) {
  const errors = ref<Record<string, string>>({})
  const isValid = ref(false)

  const validate = (data: T) => {
    const result = schema.safeParse(data)
    if (!result.success) {
      errors.value = result.error.flatten().fieldErrors
      isValid.value = false
    } else {
      errors.value = {}
      isValid.value = true
    }
    return result.success
  }

  return { errors, isValid, validate }
}
```

**Why Composable**: Form validation is component-specific, doesn't need global persistence, and benefits from being isolated per form instance.

### Example 3: Theme Management

**Pinia Store Approach** (Recommended):
```typescript
// theme-store.ts
export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark'>('light')
  const primaryColor = ref('#3B82F6')

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme()
  }

  const applyTheme = () => {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return { theme, primaryColor, toggleTheme }
})
```

**Why Store**: Theme affects the entire application, needs to persist across routes, and should be globally accessible.

## Decision Framework

Use this decision tree to choose between composables and Pinia stores:

```
Does the state need to persist across component unmount/mount cycles?
├── Yes → Consider Pinia Store
└── No → Do multiple unrelated components need to share this state?
    ├── Yes → Use Pinia Store
    └── No → Is this utility logic that could be reused?
        ├── Yes → Use Composable
        └── No → Use local component state
```

## Conclusion

Both composables and Pinia stores are powerful tools in the Vue 3 ecosystem. The key is understanding their strengths and using them appropriately:

- **Composables** excel at encapsulating reusable logic and component-specific state
- **Pinia Stores** are ideal for global state management and cross-component communication

In practice, most applications will use both patterns. Start with composables for local logic and migrate to stores when you need global state management. The migration path is straightforward due to the similar API patterns.

Remember: **Don't over-engineer**. Use the simplest solution that meets your requirements. You can always refactor later as your application grows in complexity.

## Further Reading

- [Vue 3 Composition API Guide](https://vuejs.org/guide/reusability/composables.html)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue 3 Best Practices](https://vuejs.org/style-guide/)
- [State Management Patterns](https://vuejs.org/guide/scaling-up/state-management.html)
