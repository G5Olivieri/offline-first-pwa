import type { Customer } from "@/types/customer";
import type { Operator } from "@/types/operator";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";

declare global {
  var createMockProduct: (overrides?: Partial<Product>) => Product;
  var createMockCustomer: (overrides?: Partial<Customer>) => Customer;
  var createMockOperator: (overrides?: Partial<Operator>) => Operator;
  var createMockOrder: (overrides?: Partial<Order>) => Order;
}
