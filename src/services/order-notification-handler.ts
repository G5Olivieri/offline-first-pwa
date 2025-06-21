import type { ErrorTracking } from "@/error/error-tracking";
import type { Product } from "@/product/product";
import type { NotificationService } from "./notification-service";
import { orderEventEmitter, type OrderEvent } from "./order-event-emitter";

export class OrderNotificationHandler {
  private unsubscribeFunctions: Array<() => void> = [];

  constructor(
    private notification: NotificationService,
    private errorTracking: ErrorTracking,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Stock and inventory events
    this.unsubscribeFunctions.push(
      orderEventEmitter.on(
        "stock_limit_reached",
        this.handleStockLimitReached.bind(this),
      ),
    );
    this.unsubscribeFunctions.push(
      orderEventEmitter.on("out_of_stock", this.handleOutOfStock.bind(this)),
    );

    // Order lifecycle events
    this.unsubscribeFunctions.push(
      orderEventEmitter.on(
        "order_completed",
        this.handleOrderCompleted.bind(this),
      ),
    );
    this.unsubscribeFunctions.push(
      orderEventEmitter.on(
        "order_abandoned",
        this.handleOrderAbandoned.bind(this),
      ),
    );

    // Customer and operator events
    this.unsubscribeFunctions.push(
      orderEventEmitter.on(
        "customer_selected",
        this.handleCustomerSelected.bind(this),
      ),
    );
    this.unsubscribeFunctions.push(
      orderEventEmitter.on(
        "operator_selected",
        this.handleOperatorSelected.bind(this),
      ),
    );

    // Error events
    this.unsubscribeFunctions.push(
      orderEventEmitter.on("order_error", this.handleOrderError.bind(this)),
    );
    this.unsubscribeFunctions.push(
      orderEventEmitter.on(
        "payment_validation_failed",
        this.handlePaymentValidationFailed.bind(this),
      ),
    );
    this.unsubscribeFunctions.push(
      orderEventEmitter.on(
        "order_load_failed",
        this.handleOrderLoadFailed.bind(this),
      ),
    );
  }

  private handleStockLimitReached(event: OrderEvent<"stock_limit_reached">) {
    const payload = event.payload as {
      product: Product;
      currentQuantity?: number;
      stockLimit?: number;
    };
    this.notification.showWarning(
      "Stock Limit Reached",
      `Cannot add more ${payload.product.name}. Only ${
        payload.stockLimit || 0
      } items available in stock.`,
      4000,
    );
  }

  private handleOutOfStock(event: OrderEvent<"out_of_stock">) {
    const payload = event.payload;
    this.notification.showError(
      "Out of Stock",
      `${payload.product.name} is currently out of stock and cannot be added to the order.`,
    );
  }

  private handleOrderCompleted(event: OrderEvent<"order_completed">) {
    const payload = event.payload;
    this.notification.showSuccess(
      "Order Completed",
      `Order #${payload.order._id.slice(-8)} has been successfully completed!`,
    );
  }

  private handleOrderAbandoned(event: OrderEvent<"order_abandoned">) {
    this.errorTracking.track(new Error("Order Abandoned"), {
      component: "OrderStore",
      operation: "abandonOrder",
      timestamp: event.timestamp,
    });
    this.notification.showSuccess(
      "Order Abandoned",
      "The current order has been successfully abandoned.",
    );
  }

  private handleCustomerSelected(event: OrderEvent<"customer_selected">) {
    const payload = event.payload;
    this.notification.showSuccess(
      "Customer Selected",
      `${payload.customer.name} has been added to the order.`,
    );
  }

  private handleOperatorSelected(event: OrderEvent<"operator_selected">) {
    const payload = event.payload;
    this.notification.showSuccess(
      "Operator Selected",
      `${payload.operator.name} is now handling this order.`,
    );
  }

  private handleOrderError(event: OrderEvent<"order_error">) {
    const payload = event.payload;
    this.notification.showError(
      "Order Error",
      payload.error.message ||
        "An unexpected error occurred while processing your order.",
    );

    // Log the error for tracking
    this.errorTracking.track(payload.error, {
      component: "OrderStore",
      timestamp: event.timestamp,
      context: payload.context,
    });

    // Show user-friendly notification
    this.notification.showError(
      "Order Error",
      payload.error.message ||
        "An unexpected error occurred while processing your order.",
    );
  }

  private handlePaymentValidationFailed(
    event: OrderEvent<"payment_validation_failed">,
  ) {
    const payload = event.payload as {
      message: string;
      details?: Record<string, unknown>;
    };
    this.notification.showWarning("Payment Validation Failed", payload.message);
  }

  private handleOrderLoadFailed(event: OrderEvent<"order_load_failed">) {
    const payload = event.payload;
    this.errorTracking.track(payload.error, {
      component: "OrderStore",
      operation: "loadOrder",
      timestamp: event.timestamp,
      context: payload.context,
    });

    this.notification.showError(
      "Error Loading Order",
      "An error occurred while loading the current order. Starting with a new order.",
    );
  }

  public destroy() {
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeFunctions = [];
  }
}

// Singleton instance for global use
let orderNotificationHandler: OrderNotificationHandler | null = null;

export const startOrderNotificationHandler = (
  notificationService: NotificationService,
  errorTracking: ErrorTracking,
): OrderNotificationHandler => {
  if (!orderNotificationHandler) {
    orderNotificationHandler = new OrderNotificationHandler(
      notificationService,
      errorTracking,
    );
  }
  return orderNotificationHandler;
};

export const destroyOrderNotificationHandler = () => {
  if (orderNotificationHandler) {
    orderNotificationHandler.destroy();
    orderNotificationHandler = null;
  }
};
