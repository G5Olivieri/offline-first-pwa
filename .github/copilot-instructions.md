# Copilot Instructions for POS Frontend - Vue 3 PWA with PouchDB

## Project Overview

This is a **Point of Sale (POS) Frontend Application** built as an offline-first Progressive Web App. The application manages products, customers, operators, and orders with full offline capability and real-time sync when online.

## Project Stack

- **Framework**: Vue 3 with TypeScript (Composition API with `<script setup>`)
- **Build Tool**: Vite 6.x
- **PWA**: Vite PWA Plugin (`vite-plugin-pwa`) with Workbox for offline caching
- **Database**: PouchDB Browser (`pouchdb-browser`) for indexeddb, CouchDB for remote sync
- **State Management**: Pinia stores for reactive state management
- **Validation**: Vee-Validate with Zod schemas
- **Styling**: Tailwind CSS with custom components
- **Configuration**: Environment-based configuration with type safety (`/src/config/env.ts`)
- **Deployment**: Docker with nginx, Kubernetes with Helm charts, Istio service mesh
- **TypeScript**: Full TypeScript support with strict type checking

## Core Business Entities

- **Products**: Items for sale with barcode, name, price, inventory
- **Customers**: Customer information and purchase history
- **Operators**: POS system users with authentication
- **Orders**: Sales transactions with line items and totals

## File Naming Convention

- **Use kebab-case for file names** (actual project convention):
  - Store files: `customer-store.ts`, `product-store.ts`, `online-status-store.ts`
  - Vue components/pages: `customers.vue`, `checkout.vue`, `all.vue`, `new.vue`
  - Type files: `operator.ts`, `order.ts`, `product.ts`
  - Config files: `vite.config.ts`, `app.vue`
- **Folder names**: Use lowercase with optional hyphens (e.g., `customers/`, `checkout/`)

## Copilot Coding Guidelines

### 1. Project Structure

- Project designed by entities packages `src/products`, `src/customers`, `src/operators`, `src/orders`, don't by functionality.
- Use Vite’s default project structure.
- Place PouchDB logic in `/src/<module>/*-db.ts`.
- Place service worker and PWA logic in `/src/pwa/`.
- Use Vue SFCs (`.vue`) for all components.
- All file and folder names must follow the **kebab-case** convention.

### 2. PWA Integration

- Use `vite-plugin-pwa` in `vite.config.ts` for automatic service worker generation.
- Register the service worker on app startup with `registerType: "autoUpdate"`.
- Include manifest with relevant app metadata (name, icons, start_url, theme_color).
- Environment variables control app title, theme colors, and feature flags.
- Workbox strategies for caching assets and API calls.

### 3. PouchDB Usage

- Provides typed database instances for each entity (products, customers, operators, orders).
- Includes sync logic to remote CouchDB endpoint when `SYNCING` is enabled.
- Environment-controlled sync behavior with proper error handling.
- Database instances are singletons with lazy initialization.

### 4. Offline-First Patterns

- Ensure all critical app functionality is usable offline.
- Show clear UI indicators for online/offline status.
- Queue changes locally and auto-sync in the background on reconnect.
- Use optimistic UI updates for a responsive app feel.

### 5. Example Tasks for Copilot

- Scaffold a new Vue 3 + Vite PWA with `vite-plugin-pwa`.
- Set up PouchDB instance with local and remote sync logic using TypeScript.
- Show how to register and update the service worker.
- Add Pinia stores for state management with PouchDB integration.
- Provide TypeScript types for all business entities.
- Implement a sync status indicator component.
- Demonstrate how to cache API responses for offline use.

### 6. Best Practices

- Use async/await for all DB and network logic.
- Use Vue’s reactivity for syncing DB changes to UI.
- Keep all state in Vue’s Composition API or Pinia.
- Keep all logic modular and composable.
- **Always use kebab-case for all file names and helpers.**
- Use always alias imports for better readability (e.g., `@/products` for database imports).
- Don't comment the code.

### 7. VueJS Best Practices

1. Template Best Practices

- Keep Templates Simple: Avoid complex logic in templates; move it to computed properties or methods.
- Use v-bind and v-on Shorthand: Use : for v-bind and @ for v-on to keep the code concise.
- Key Attribute: Always use a unique key when rendering lists with v-for.
- Avoid Inline Handlers: Define methods in the script section instead of inline event handlers.

2. Script Section

- Prop Validation: Always define and validate props with proper types and default values.
- Avoid Mutating Props: Use computed properties or data to handle derived or mutable values.
- Use watch Sparingly: Prefer computed properties over watch for reactive transformations.
- Error Handling: Use try-catch blocks for async operations and handle errors gracefully.

3. State Management

- Use Pinia: For shared state, use Pinia instead of relying on $root or $parent.
- Avoid Overusing Global State: Keep state local to components unless truly shared.

4. Performance Optimization

- Lazy Loading: Use dynamic imports for components to enable lazy loading.
- Debounce Expensive Operations: Debounce or throttle expensive operations like API calls.
- Avoid Unnecessary Re-renders: Use v-once or v-memo for static content.

5. Accessibility and UX

- ARIA Attributes: Add ARIA attributes for better accessibility.
- Keyboard Navigation: Ensure interactive elements are keyboard-accessible.
- Loading States: Provide visual feedback for async operations (e.g., spinners).

6. Testing and Debugging

- Unit Tests: Write unit tests for components using tools like Vue Test Utils.
- Linting: Use ESLint with Vue-specific rules to enforce consistent code style.
- DevTools: Leverage Vue DevTools for debugging and performance monitoring.

---

**Copilot: Always prefer patterns that emphasize offline-first reliability, modular code, Vite/Vue best practices, don't comment code, and kebab-case file naming.**
