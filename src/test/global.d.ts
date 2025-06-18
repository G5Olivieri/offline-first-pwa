import type { Product } from '../types/product';
import type { Order } from '../types/order';
import type { Operator } from '../types/operator';

declare global {
  var createMockProduct: (overrides?: Partial<Product>) => Product;
  var createMockCustomer: (overrides?: Partial<any>) => any;
  var createMockOperator: (overrides?: Partial<Operator>) => Operator;
  var createMockOrder: (overrides?: Partial<Order>) => Order;
}
