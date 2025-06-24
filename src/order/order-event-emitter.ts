import type { Customer } from "@/customer/customer";
import type { ErrorTracking } from "@/error/error-tracking";
import { errorTrackingService } from "@/error/singleton";
import {
  AbstractTypedEventEmitter,
  type ExtractEvent,
  type TypedEventEmitter,
} from "@/interfaces/typed-event-emitter";
import type { Operator } from "@/operator/operator";
import type { Order } from "@/order/order";
import type { Product } from "@/product/product";

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

export type OrderEvent<T extends keyof OrderEventTypeMap> = ExtractEvent<
  T,
  OrderEventTypeMap
>;

export class OrderEventEmitter
  extends AbstractTypedEventEmitter<OrderEventTypeMap>
  implements TypedEventEmitter<OrderEventTypeMap>
{
  public constructor(private readonly errorTracking: ErrorTracking) {
    super();
  }

  protected handleListenerError(
    error: unknown,
    eventType: keyof OrderEventTypeMap,
  ): void {
    this.errorTracking.track(
      new Error(`Error in listener for event type "${eventType}": ${error}`),
      {
        eventType,
        error,
        timestamp: new Date(),
      },
    );
  }
}

export const orderEventEmitter = new OrderEventEmitter(errorTrackingService);
