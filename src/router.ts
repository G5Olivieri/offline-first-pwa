import { useAuthStore } from "@/stores/auth-store";
import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { trackingService } from "./tracking/singleton";
import { EventType } from "./tracking/tracking";

const routes: RouteRecordRaw[] = [
  {
    path: "",
    name: "layout",
    redirect: "/home",
    component: () => import("@/layout.vue"),
    children: [
      {
        path: "/home",
        name: "home",
        component: () => import("@/pages/home/home.vue"),
      },
      {
        path: "/operators",
        name: "operators",
        component: () => import("@/pages/operators/operators.vue"),
      },
      {
        path: "/customers",
        name: "customers",
        component: () => import("@/pages/customers/customers.vue"),
      },
      {
        path: "/customers/new",
        name: "new-customer",
        component: () => import("@/pages/customers/new.vue"),
      },
      {
        path: "/products",
        name: "products",
        component: () => import("@/pages/products/products.vue"),
      },
      {
        path: "/products/:id",
        name: "product-detail",
        component: () => import("@/pages/products/detail.vue"),
      },
      {
        path: "/products/:id/edit",
        name: "edit-product",
        component: () => import("@/pages/products/edit.vue"),
      },
      {
        path: "/checkout",
        name: "checkout",
        component: () => import("@/pages/checkout/checkout.vue"),
      },
      {
        path: "/customers/all",
        name: "all-customers",
        component: () => import("@/pages/customers/all.vue"),
      },
      {
        path: "/operators/new",
        name: "new-operator",
        component: () => import("@/pages/operators/new.vue"),
      },
      {
        path: "/products/import",
        name: "import-products",
        component: () => import("@/pages/products/import.vue"),
      },
      {
        path: "/products/new",
        name: "new-product",
        component: () => import("@/pages/products/new.vue"),
      },
      {
        path: "/_utils",
        name: "utils",
        component: () => import("@/pages/utils/utils.vue"),
      },
    ],
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/pages/login.vue"),
  },
  // must be last
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/pages/not-found.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  trackingService.track(EventType.USER, {
    eventType: "navigation.before",
    from: from.name as string | null,
    to: to.name as string | null,
    url: to.fullPath,
  });
  const auth = useAuthStore();
  if (to.path !== "/login" && !auth.isLoggedIn) {
    next({ path: "/login", query: { next: to.fullPath } });
  } else {
    next();
  }
});

router.afterEach((to, from) => {
  trackingService.track(EventType.USER, {
    eventType: "navigation.after",
    from: from.name as string | null,
    to: to.name as string | null,
    url: to.fullPath,
  });
});
