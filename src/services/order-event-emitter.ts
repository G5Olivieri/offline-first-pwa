import type { Customer } from "@/types/customer";
import type { Operator } from "@/types/operator";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";

export type OrderEventTypeMap = {
  stock_limit_reached: {
    product: Product;
    currentQuantity?: number;
    stockLimit?: number;
  };
  out_of_stock: { product: Product; currentQuantity?: number };
  product_added: {
    product: Product;
    currentQuantity?: number;
    stockLimit?: number;
  };
  quantity_increased: { product: Product; currentQuantity?: number };
  quantity_decreased: { product: Product; currentQuantity?: number };
  customer_selected: { customer: Customer };
  customer_unselected: { customer: Customer | null };
  operator_selected: { operator: Operator };
  operator_unselected: { operator: Operator | null };
  payment_validation_failed: {
    message: string;
    details?: Record<string, unknown>;
  };
  order_abandoned: { order: Order };
  order_completed: { order: Order };
  order_created: { order: Order };
  order_loaded: { order: Order };
  order_error: { error: Error; context?: Record<string, unknown> };
  order_load_failed: { error: Error; context?: Record<string, unknown> };
};

export type OrderEventType = keyof OrderEventTypeMap;

export interface OrderEvent<T extends OrderEventType> {
  type: T;
  payload: OrderEventTypeMap[T];
  timestamp: Date;
}

type Listener<T> = (event: T) => void;

export class OrderEventEmitter {
  constructor(
    private readonly listeners: Map<
      OrderEventType,
      Array<Listener<unknown>>
    > = new Map()
  ) {}

  emit = <T extends OrderEventType>(type: T, payload: OrderEventTypeMap[T]) => {
    const event: OrderEvent<T> = {
      type,
      payload,
      timestamp: new Date(),
    };

    const eventListeners = this.listeners.get(type) || [];
    eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in order event listener for ${type}:`, error);
      }
    });
  };

  public on<T extends OrderEventType>(
    type: T,
    listener: Listener<OrderEvent<T>>
  ) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener as Listener<unknown>);

    return () => {
      const eventListeners = this.listeners.get(type);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener as Listener<unknown>);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }

  public off<T extends OrderEventType>(
    type: T,
    listener?: Listener<OrderEvent<T>>
  ) {
    if (!listener) {
      this.listeners.delete(type);
    } else {
      const eventListeners = this.listeners.get(type);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener as Listener<unknown>);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }
  }

  public clear() {
    this.listeners.clear();
  }
}

export const orderEventEmitter = new OrderEventEmitter();
