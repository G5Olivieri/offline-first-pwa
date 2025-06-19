import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import Checkout from "./pages/checkout/checkout.vue";
import ListAllCustomers from "./pages/customers/all.vue";
import Customers from "./pages/customers/customers.vue";
import NewCustomer from "./pages/customers/new.vue";
import Home from "./pages/home/home.vue";
import NewOperator from "./pages/operators/new.vue";
import Operators from "./pages/operators/operators.vue";
import Orders from "./pages/orders/orders.vue";
import ImportProducts from "./pages/products/import.vue";
import NewProduct from "./pages/products/new.vue";
import Products from "./pages/products/products.vue";
import Monitoring from "./pages/utils/monitoring.vue";
import Utils from "./pages/utils/utils.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", component: Home },
  { path: "/operators", component: Operators },
  { path: "/customers", component: Customers },
  { path: "/customers/new", component: NewCustomer },
  { path: "/products", component: Products },
  { path: "/checkout", component: Checkout },
  { path: "/orders", component: Orders },
  { path: "/customers/all", component: ListAllCustomers },
  { path: "/operators/new", component: NewOperator },
  { path: "/products/import", component: ImportProducts },
  { path: "/products/new", component: NewProduct },
  { path: "/_utils", component: Utils },
  { path: "/_utils/monitoring", component: Monitoring },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
