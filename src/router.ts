import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import Checkout from "./pages/checkout/checkout.vue";
import ListAllCustomers from "./pages/customers/all.vue";
import Customers from "./pages/customers/customers.vue";
import NewCustomer from "./pages/customers/new.vue";
import Home from "./pages/home/home.vue";
import NewOperator from "./pages/operators/new.vue";
import Operators from "./pages/operators/operators.vue";
import ProductDetail from "./pages/products/detail-simple.vue";
import EditProduct from "./pages/products/edit.vue";
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
  { path: "/_utils/monitoring", name: "monitoring", component: Monitoring },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
