# Copilot Instructions for POS Frontend - Vue 3 PWA with PouchDB

## Project Overview

This is a **Point of Sale (POS) Frontend Application** built as an offline-first Progressive Web App. The application manages products, customers, operators, and orders with full offline capability and real-time sync when online.

## Project Stack

- **Framework**: Vue 3 with TypeScript (Composition API with `<script setup>`)
- **Build Tool**: Vite 6.x
- **PWA**: Vite PWA Plugin (`vite-plugin-pwa`) with Workbox for offline caching
- **Database**: PouchDB Browser (`pouchdb-browser`) for local storage, CouchDB for remote sync
- **State Management**: Pinia stores for reactive state management
- **Validation**: Vee-Validate with Zod schemas (planned)
- **Styling**: Tailwind CSS with custom components (planned)
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

- Use Vite’s default project structure.
- Place PouchDB logic in `/src/db/`.
- Place service worker and PWA logic in `/src/pwa/`.
- Use Vue SFCs (`.vue`) for all components.
- All file and folder names must follow the **snake_case** convention.

### 2. PWA Integration

- Use `vite-plugin-pwa` in `vite.config.ts` for automatic service worker generation.
- Register the service worker on app startup with `registerType: "autoUpdate"`.
- Include manifest with relevant app metadata (name, icons, start_url, theme_color).
- Environment variables control app title, theme colors, and feature flags.
- Workbox strategies for caching assets and API calls.

### 3. PouchDB Usage

- Initialization and configuration in `/src/db.ts` using `pouchdb-browser`.
- Uses `pouchdb-find` plugin for advanced queries with indexes.
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
- **Always use snake_case for all file names and helpers.**
- Use always alias imports for better readability (e.g., `@/db` for database imports).
- Code should be self-explanatory, don't comment the code.

## Example Snippets

### PouchDB Initialization (src/db.ts)

```typescript
import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import type { Product } from "./types/product";

PouchDB.plugin(PouchDBFind);

let _productDB: PouchDB.Database<Product> | null = null;
export const getProductDB = (): PouchDB.Database<Product> => {
  if (_productDB) {
    return _productDB;
  }

  _productDB = new PouchDB("products");
  _productDB.createIndex({
    index: { fields: ["barcode"] },
  });

  return _productDB;
};
```

### Vite PWA Plugin Setup (vite.config.ts)

```typescript
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        manifest: {
          name: env.VITE_APP_TITLE || "Modern POS System",
          short_name: "POS",
          theme_color: env.VITE_THEME_PRIMARY_COLOR || "#3B82F6",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.couchdb\.com\/.*/i,
              handler: "NetworkFirst",
              options: { cacheName: "couchdb-cache" },
            },
          ],
        },
      }),
    ],
  };
});
```

### Online/Offline Composable (src/composables/use-online-status.ts)

```typescript
import { ref, onMounted, onUnmounted } from "vue";

export function useOnlineStatus() {
  const online = ref(navigator.onLine);

  const updateOnlineStatus = () => {
    online.value = navigator.onLine;
  };

  onMounted(() => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  });

  onUnmounted(() => {
    window.removeEventListener("online", updateOnlineStatus);
    window.removeEventListener("offline", updateOnlineStatus);
  });

  return { online };
}
```

---

**Copilot: Always prefer patterns that emphasize offline-first reliability, modular code, Vite/Vue best practices, don't comment code, and kebab-case file naming.**
