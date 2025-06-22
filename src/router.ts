import Checkout from "@/pages/checkout/checkout.vue";
import ListAllCustomers from "@/pages/customers/all.vue";
import Customers from "@/pages/customers/customers.vue";
import NewCustomer from "@/pages/customers/new.vue";
import Home from "@/pages/home/home.vue";
import NotFound from "@/pages/not-found.vue";
import NewOperator from "@/pages/operators/new.vue";
import Operators from "@/pages/operators/operators.vue";
import ProductDetail from "@/pages/products/detail.vue";
import EditProduct from "@/pages/products/edit.vue";
import ImportProducts from "@/pages/products/import.vue";
import NewProduct from "@/pages/products/new.vue";
import Products from "@/pages/products/products.vue";
import SyncTest from "@/pages/sync-test.vue";
import Utils from "@/pages/utils/utils.vue";
import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { userTrackingService } from "./user-tracking/singleton";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "home", component: Home },
  { path: "/operators", name: "operators", component: Operators },
  { path: "/customers", name: "customers", component: Customers },
  { path: "/customers/new", name: "new-customer", component: NewCustomer },
  { path: "/products", name: "products", component: Products },
  { path: "/products/:id", name: "product-detail", component: ProductDetail },
  { path: "/products/:id/edit", name: "edit-product", component: EditProduct },
  { path: "/checkout", name: "checkout", component: Checkout },
  {
    path: "/customers/all",
    name: "all-customers",
    component: ListAllCustomers,
  },
  { path: "/operators/new", name: "new-operator", component: NewOperator },
  {
    path: "/products/import",
    name: "import-products",
    component: ImportProducts,
  },
  { path: "/products/new", name: "new-product", component: NewProduct },
  { path: "/_utils", name: "utils", component: Utils },
  { path: "/_sync-test", name: "sync-test", component: SyncTest },
  // must be last
  { path: "/:pathMatch(.*)*", name: "not-found", component: NotFound },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to, from) => {
  userTrackingService.track("navigation.after", {
    from: from.name as string | null,
    to: to.name as string | null,
    url: to.fullPath,
  });
});

router.beforeEach((to, from) => {
  userTrackingService.track("navigation.before", {
    from: from.name as string | null,
    to: to.name as string | null,
    url: to.fullPath,
  });
});
