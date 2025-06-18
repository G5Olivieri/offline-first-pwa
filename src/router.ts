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
import Utils from "./pages/utils/utils.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", component: Home },
  { path: "/operators", component: Operators },
  { path: "/operators/new", component: NewOperator },
  { path: "/customers", component: Customers },
  { path: "/customers/new", component: NewCustomer },
  { path: "/customers/all", component: ListAllCustomers },
  { path: "/_utils", component: Utils },
  { path: "/products", component: Products },
  { path: "/products/new", component: NewProduct },
  { path: "/products/import", component: ImportProducts },
  { path: "/checkout", component: Checkout },
  { path: "/orders", component: Orders },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
