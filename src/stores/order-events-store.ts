import type { Customer } from "@/types/customer";
import type { Operator } from "@/types/operator";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";
import { defineStore } from "pinia";
import { ref } from "vue";

export interface OrderEvent {
  type: OrderEventType;
  payload: OrderEventPayload;
  timestamp: Date;
}

export type OrderEventType =
  | "stock_limit_reached"
  | "out_of_stock"
  | "product_added"
  | "quantity_increased"
  | "quantity_decreased"
  | "order_abandoned"
  | "order_completed"
  | "customer_selected"
  | "customer_unselected"
  | "operator_selected"
  | "operator_unselected"
  | "payment_validation_failed"
  | "order_created"
  | "order_error"
  | "order_loaded"
  | "order_load_failed";

export type OrderEventPayload =
  | { product: Product; currentQuantity?: number; stockLimit?: number }
  | { customer: Customer }
  | { operator: Operator }
  | { order: Order }
  | { error: Error; context?: Record<string, unknown> }
  | { message: string; details?: Record<string, unknown> };

export const useOrderEventsStore = defineStore("orderEvents", () => {
  const listeners = ref<
    Map<OrderEventType, Array<(event: OrderEvent) => void>>
  >(new Map());

  const emit = (type: OrderEventType, payload: OrderEventPayload) => {
    const event: OrderEvent = {
      type,
      payload,
      timestamp: new Date(),
    };

    // Notify all listeners for this event type
    const eventListeners = listeners.value.get(type) || [];
    eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in order event listener for ${type}:`, error);
      }
    });
  };

  const on = (type: OrderEventType, listener: (event: OrderEvent) => void) => {
    if (!listeners.value.has(type)) {
      listeners.value.set(type, []);
    }
    listeners.value.get(type)!.push(listener);

    // Return unsubscribe function
    return () => {
      const eventListeners = listeners.value.get(type);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  };

  const off = (
    type: OrderEventType,
    listener?: (event: OrderEvent) => void
  ) => {
    if (!listener) {
      // Remove all listeners for this event type
      listeners.value.delete(type);
    } else {
      // Remove specific listener
      const eventListeners = listeners.value.get(type);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }
  };

  const clear = () => {
    listeners.value.clear();
  };

  return {
    emit,
    on,
    off,
    clear,
  };
});
