import { useNotificationStore } from '@/stores/notification-store';
import { useErrorTrackingStore } from '@/stores/error-tracking-store';
import { useOrderEventsStore, type OrderEvent } from '@/stores/order-events-store';
import type { Product } from '@/types/product';
import type { Customer } from '@/types/customer';
import type { Operator } from '@/types/operator';
import type { Order } from '@/types/order';

/**
 * Order Notification Handler
 * Handles the translation of order events to user notifications
 * This keeps the order store decoupled from the notification system
 */
export class OrderNotificationHandler {
  private notificationStore = useNotificationStore();
  private errorTrackingStore = useErrorTrackingStore();
  private orderEventsStore = useOrderEventsStore();
  private unsubscribeFunctions: Array<() => void> = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Stock and inventory events
    this.unsubscribeFunctions.push(
      this.orderEventsStore.on('stock_limit_reached', this.handleStockLimitReached.bind(this))
    );
    this.unsubscribeFunctions.push(
      this.orderEventsStore.on('out_of_stock', this.handleOutOfStock.bind(this))
    );

    // Order lifecycle events
    this.unsubscribeFunctions.push(
      this.orderEventsStore.on('order_completed', this.handleOrderCompleted.bind(this))
    );
    this.unsubscribeFunctions.push(
      this.orderEventsStore.on('order_abandoned', this.handleOrderAbandoned.bind(this))
    );

    // Customer and operator events
    this.unsubscribeFunctions.push(
      this.orderEventsStore.on('customer_selected', this.handleCustomerSelected.bind(this))
    );
    this.unsubscribeFunctions.push(
      this.orderEventsStore.on('operator_selected', this.handleOperatorSelected.bind(this))
    );

    // Error events
    this.unsubscribeFunctions.push(
      this.orderEventsStore.on('order_error', this.handleOrderError.bind(this))
    );
    this.unsubscribeFunctions.push(
      this.orderEventsStore.on('payment_validation_failed', this.handlePaymentValidationFailed.bind(this))
    );
    this.unsubscribeFunctions.push(
      this.orderEventsStore.on('order_load_failed', this.handleOrderLoadFailed.bind(this))
    );
  }

  private handleStockLimitReached(event: OrderEvent) {
    const payload = event.payload as { product: Product; currentQuantity?: number; stockLimit?: number };
    this.notificationStore.showWarning(
      'Stock Limit Reached',
      `Cannot add more ${payload.product.name}. Only ${payload.stockLimit || 0} items available in stock.`,
      4000
    );
  }

  private handleOutOfStock(event: OrderEvent) {
    const payload = event.payload as { product: Product };
    this.notificationStore.showError(
      'Out of Stock',
      `${payload.product.name} is currently out of stock and cannot be added to the order.`
    );
  }

  private handleOrderCompleted(event: OrderEvent) {
    const payload = event.payload as { order: Order };
    this.notificationStore.showSuccess(
      'Order Completed',
      `Order #${payload.order._id.slice(-8)} has been successfully completed!`
    );
  }

  private handleOrderAbandoned() {
    this.notificationStore.showSuccess('Order Abandoned', 'The current order has been successfully abandoned.');
  }

  private handleCustomerSelected(event: OrderEvent) {
    const payload = event.payload as { customer: Customer };
    this.notificationStore.showSuccess(
      'Customer Selected',
      `${payload.customer.name} has been added to the order.`
    );
  }

  private handleOperatorSelected(event: OrderEvent) {
    const payload = event.payload as { operator: Operator };
    this.notificationStore.showSuccess(
      'Operator Selected',
      `${payload.operator.name} is now handling this order.`
    );
  }

  private handleOrderError(event: OrderEvent) {
    const payload = event.payload as { error: Error; context?: Record<string, unknown> };

    // Log the error for tracking
    this.errorTrackingStore.logError(payload.error, {
      component: 'OrderStore',
      operation: payload.context?.operation as string || 'unknown',
      timestamp: event.timestamp
    });

    // Show user-friendly notification
    this.notificationStore.showError(
      'Order Error',
      payload.error.message || 'An unexpected error occurred while processing your order.'
    );
  }

  private handlePaymentValidationFailed(event: OrderEvent) {
    const payload = event.payload as { message: string; details?: Record<string, unknown> };
    this.notificationStore.showWarning(
      'Payment Validation Failed',
      payload.message
    );
  }

  private handleOrderLoadFailed(event: OrderEvent) {
    const payload = event.payload as { error: Error };
    this.errorTrackingStore.logError(payload.error, {
      component: 'OrderStore',
      operation: 'loadOrder',
      timestamp: event.timestamp
    });

    this.notificationStore.showError(
      'Error Loading Order',
      'An error occurred while loading the current order. Starting with a new order.'
    );
  }

  /**
   * Clean up all event listeners
   */
  public destroy() {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }
}

// Singleton instance for global use
let orderNotificationHandler: OrderNotificationHandler | null = null;

export const getOrderNotificationHandler = (): OrderNotificationHandler => {
  if (!orderNotificationHandler) {
    orderNotificationHandler = new OrderNotificationHandler();
  }
  return orderNotificationHandler;
};

export const destroyOrderNotificationHandler = () => {
  if (orderNotificationHandler) {
    orderNotificationHandler.destroy();
    orderNotificationHandler = null;
  }
};
