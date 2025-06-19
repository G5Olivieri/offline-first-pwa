import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { analytics } from "./services/analytics-service";
import { AnalyticsCategory } from "./types/analytics";
import Checkout from "./pages/checkout/checkout.vue";
import ListAllCustomers from "./pages/customers/all.vue";
import Customers from "./pages/customers/customers.vue";
import NewCustomer from "./pages/customers/new.vue";
import Home from "./pages/home/home.vue";
import NewOperator from "./pages/operators/new.vue";
import Operators from "./pages/operators/operators.vue";
import ImportProducts from "./pages/products/import.vue";
import NewProduct from "./pages/products/new.vue";
import Products from "./pages/products/products.vue";
import Monitoring from "./pages/utils/monitoring.vue";
import Utils from "./pages/utils/utils.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "home", component: Home },
  { path: "/operators", name: "operators", component: Operators },
  { path: "/customers", name: "customers", component: Customers },
  { path: "/customers/new", name: "new-customer", component: NewCustomer },
  { path: "/products", name: "products", component: Products },
  { path: "/checkout", name: "checkout", component: Checkout },
  { path: "/customers/all", name: "all-customers", component: ListAllCustomers },
  { path: "/operators/new", name: "new-operator", component: NewOperator },
  { path: "/products/import", name: "import-products", component: ImportProducts },
  { path: "/products/new", name: "new-product", component: NewProduct },
  { path: "/_utils", name: "utils", component: Utils },
  { path: "/_utils/monitoring", name: "monitoring", component: Monitoring },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Track navigation start time for duration calculation
let navigationStartTime = Date.now();

// Before each route change
router.beforeEach((to, from, next) => {
  navigationStartTime = Date.now();

  // Track navigation intent (before actually navigating)
  if (from.name && to.name) {
    analytics.track({
      name: 'navigation_started',
      category: AnalyticsCategory.NAVIGATION,
      properties: {
        from: String(from.name),
        to: String(to.name),
        fromPath: from.path,
        toPath: to.path,
      },
    });
  }

  next();
});

// After each route change
router.afterEach((to, from) => {
  const navigationDuration = Date.now() - navigationStartTime;

  // Track completed navigation with timing
  if (to.name) {
    analytics.trackNavigation({
      from: from.name ? String(from.name) : undefined,
      to: String(to.name),
      duration: navigationDuration,
    });

    // Track page view
    analytics.page(String(to.name), {
      path: to.path,
      query: Object.keys(to.query).length > 0 ? JSON.stringify(to.query) : '',
      params: Object.keys(to.params).length > 0 ? JSON.stringify(to.params) : '',
      fromPage: from.name ? String(from.name) : '',
      navigationDuration,
    });
  }

  // Track performance metric for navigation
  analytics.trackPerformance({
    metric: 'page_navigation_time',
    value: navigationDuration,
    unit: 'ms',
    context: {
      page: String(to.name || to.path),
      fromPage: String(from.name || from.path),
    },
  });
});

// Track navigation errors
router.onError((error) => {
  analytics.trackError({
    errorType: 'navigation_error',
    errorMessage: error.message,
    stackTrace: error.stack,
    context: {
      currentRoute: router.currentRoute.value.path,
      targetRoute: 'unknown',
    },
  });
});
