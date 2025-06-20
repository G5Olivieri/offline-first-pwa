import { useLocalStorage } from "@vueuse/core";
import throttle from "lodash.throttle";
import { defineStore } from "pinia";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { getOrderDB } from "@/db";
import { customerService } from "@/services/customer-service";
import { operatorService } from "@/services/operator-service";
import { productService } from "@/services/product-service";
import { recommendationEngine } from "@/services/recommendation-engine";
import type { Customer } from "@/types/customer";
import type { Operator } from "@/types/operator";
import type { Item, Order, PaymentMethod } from "@/types/order";
import { OrderStatus } from "@/types/order";
import type { Product } from "@/types/product";
import { useTerminalStore } from "./terminal-store";
import { useNotificationStore } from "./notification-store";
import { useErrorTrackingStore } from "./error-tracking-store";

export const useOrderStore = defineStore("orderStore", () => {
  const orderDB = getOrderDB();
  const notificationStore = useNotificationStore();
  const errorTrackingStore = useErrorTrackingStore();

  // order
  const id = useLocalStorage("currentOrderId", "");
  const rev = useLocalStorage("currentOrderRev", "");
  const createdAt = useLocalStorage("orderCreatedAt", "");
  const amount = ref("");
  const amountError = ref<string | null>(null);
  const paymentMethod = ref<PaymentMethod>("card");
  const change = ref<number | null>(null);

  // operator
  const operator = ref<Operator | null>(null);
  const operatorId = useLocalStorage("operatorId", "");

  // customer
  const customer = ref<Customer | null>(null);
  const customerId = useLocalStorage("customerId", "");

  const terminalStore = useTerminalStore();

  const itemsMap = reactive<Map<string, Item>>(new Map());
  const items = computed(() => Array.from(itemsMap.values()));
  const total = computed(() =>
    items.value.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    ),
  );

  const mapOrderToDocument = (
    status: OrderStatus = OrderStatus.PENDING,
  ): Order => {
    if (id.value === "") {
      id.value = crypto.randomUUID();
    }

    if (createdAt.value === "") {
      createdAt.value = new Date().toISOString();
    }

    return {
      _id: id.value,
      _rev: rev.value || undefined,
      items: Array.from(itemsMap.values()),
      total: total.value,
      status,
      terminal_id: terminalStore.terminalId,
      payment_method: paymentMethod.value,
      amount: paymentMethod.value === "cash" ? parseFloat(amount.value) : null,
      operator_id: operatorId.value || undefined,
      customer_id: customerId.value || undefined,
      created_at: createdAt.value,
      updated_at: new Date().toISOString(),
    };
  };

  const putOrder = throttle(async (order: Order) => {
    const result = await orderDB.put(order);
    rev.value = result.rev;
  }, 1000);

  const addProduct = (product: Product) => {
    try {
      if (itemsMap.has(product._id)) {
        const existingItem = itemsMap.get(product._id);
        if (existingItem) {
          if (!product.stock || existingItem.quantity < product.stock) {
            existingItem.quantity++;
            existingItem.total = calculateTotal(existingItem);
          } else {
            // Use error handling system instead of alert
            const error = new Error(
              `Cannot increase quantity beyond stock limit for product: ${product.name}`,
            );
            errorTrackingStore.logError(error, {
              component: "OrderStore",
              operation: "addProduct",
              timestamp: new Date(),
            });

            notificationStore.showWarning(
              "Stock Limit Reached",
              `Cannot add more ${product.name}. Only ${product.stock} items available in stock.`,
              4000,
            );
            return;
          }
        }
      } else {
        // Check if there's stock available for new item
        if (product.stock && product.stock <= 0) {
          const error = new Error(
            `Cannot add out-of-stock product: ${product.name}`,
          );
          errorTrackingStore.logError(error, {
            component: "OrderStore",
            operation: "addProduct",
            timestamp: new Date(),
          });

          notificationStore.showError(
            "Out of Stock",
            `${product.name} is currently out of stock and cannot be added to the order.`,
          );
          return;
        }

        itemsMap.set(product._id, {
          quantity: 1,
          product,
          total: product.price,
        });
      }

      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    } catch (error) {
      // Handle any unexpected errors
      errorTrackingStore.logError(error as Error, {
        component: "OrderStore",
        operation: "addProduct",
        timestamp: new Date(),
      });

      notificationStore.showError(
        "Error Adding Product",
        "An unexpected error occurred while adding the product to your order. Please try again.",
      );
    }
  };

  const increase = (item: Item) => {
    try {
      if (!item.product.stock || item.quantity < item.product.stock) {
        item.quantity++;
        item.total = calculateTotal(item);
      } else {
        // Use error handling system instead of alert
        const error = new Error(
          `Cannot increase quantity beyond stock limit for product: ${item.product.name}`,
        );
        errorTrackingStore.logError(error, {
          component: "OrderStore",
          operation: "increase",
          timestamp: new Date(),
        });

        notificationStore.showWarning(
          "Stock Limit Reached",
          `Cannot increase quantity for ${item.product.name}. Only ${item.product.stock} items available in stock.`,
          4000,
        );
        return;
      }

      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    } catch (error) {
      // Handle any unexpected errors
      errorTrackingStore.logError(error as Error, {
        component: "OrderStore",
        operation: "increase",
        timestamp: new Date(),
      });

      notificationStore.showError(
        "Error Updating Quantity",
        "An unexpected error occurred while updating the item quantity. Please try again.",
      );
    }
  };

  const decrease = async (item: Item) => {
    try {
      if (item.quantity > 1) {
        item.quantity--;
        item.total = calculateTotal(item);
      } else {
        itemsMap.delete(item.product._id);
      }
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    } catch (error) {
      errorTrackingStore.logError(error as Error, {
        component: "OrderStore",
        operation: "decrease",
        timestamp: new Date(),
      });

      notificationStore.showError(
        "Error Updating Quantity",
        "An unexpected error occurred while updating the item quantity. Please try again.",
      );
    }
  };

  const abandon = async () => {
    try {
      if (!id.value) {
        notificationStore.showInfo(
          "No Active Order",
          "There is no active order to abandon.",
        );
        return;
      }
      if (itemsMap.size === 0) {
        notificationStore.showInfo(
          "Empty Order",
          "The order is already empty.",
        );
        return;
      }

      putOrder(mapOrderToDocument(OrderStatus.CANCELLED));
      await putOrder.flush();
      await createNewOrder();

      notificationStore.showSuccess(
        "Order Abandoned",
        "The current order has been successfully abandoned.",
      );
    } catch (error) {
      errorTrackingStore.logError(error as Error, {
        component: "OrderStore",
        operation: "abandon",
        timestamp: new Date(),
      });

      notificationStore.showError(
        "Error Abandoning Order",
        "An error occurred while abandoning the order. Please try again.",
      );
    }
  };

  const createNewOrder = async () => {
    itemsMap.clear();
    id.value = "";
    rev.value = "";
    createdAt.value = "";
    unselectCustomer();
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const calculateTotal = (item: Item) => {
    return item.product.price * item.quantity;
  };

  const complete = async () => {
    try {
      if (!id.value) {
        notificationStore.showWarning(
          "No Active Order",
          "There is no active order to complete.",
        );
        return;
      }
      if (itemsMap.size === 0) {
        notificationStore.showWarning(
          "Empty Order",
          "Cannot complete an empty order. Please add items first.",
        );
        return;
      }
      if (paymentMethod.value === "cash" && !amount.value) {
        amountError.value = "Please enter the amount paid.";
        notificationStore.showWarning(
          "Payment Required",
          "Please enter the amount paid for cash transactions.",
        );
        return;
      }
      if (
        paymentMethod.value === "cash" &&
        parseFloat(amount.value) < total.value
      ) {
        amountError.value = "Amount paid is less than the total.";
        notificationStore.showWarning(
          "Insufficient Payment",
          `Amount paid (${parseFloat(amount.value).toFixed(
            2,
          )}) is less than the total (${total.value.toFixed(2)}).`,
        );
        return;
      }

      amountError.value = null;
      amount.value = "";
      paymentMethod.value = "card";

      const orderDocument = mapOrderToDocument(OrderStatus.COMPLETED);
      putOrder(orderDocument);
      await putOrder.flush();

      await recommendationEngine.updateProductAffinities(orderDocument);
      await recommendationEngine.updateCustomerPreferences(orderDocument);

      const productsToUpdate: [string, number][] = Array.from(
        itemsMap.values(),
      ).map((item) => [item.product._id, item.product.stock - item.quantity]);

      await productService.changeStock(new Map(productsToUpdate));
      await createNewOrder();

      notificationStore.showSuccess(
        "Order Completed",
        `Order #${orderDocument._id.slice(-8)} has been successfully completed!`,
      );
    } catch (error) {
      errorTrackingStore.logError(error as Error, {
        component: "OrderStore",
        operation: "complete",
        timestamp: new Date(),
      });

      notificationStore.showError(
        "Error Completing Order",
        "An error occurred while completing the order. Please check the details and try again.",
      );
    }
  };

  const loadOrder = async () => {
    try {
      if (id.value === "") {
        putOrder(mapOrderToDocument(OrderStatus.PENDING));
        return;
      }

      const doc = await orderDB.get(id.value);
      if (
        !doc ||
        doc.status === OrderStatus.COMPLETED ||
        doc.status === OrderStatus.CANCELLED
      ) {
        id.value = "";
        rev.value = "";
        // Will be defined later
        customerId.value = "";
        customer.value = null;
        createdAt.value = "";
        putOrder(mapOrderToDocument(OrderStatus.PENDING));
        return;
      }

      rev.value = doc._rev;
      itemsMap.clear();
      doc.items.forEach((item: Item) => {
        itemsMap.set(item.product._id, item);
      });

      if (doc.customer_id && !customerId.value) {
        customerId.value = doc.customer_id;
      }

      if (doc.operator_id && !operatorId.value) {
        operatorId.value = doc.operator_id;
      }

      if (customerId.value) {
        try {
          const result = await customerService.getCustomerByID(
            customerId.value,
          );
          customer.value = result;
        } catch (error) {
          errorTrackingStore.logError(error as Error, {
            component: "OrderStore",
            operation: "loadOrder-getCustomer",
            timestamp: new Date(),
          });
        }
      }

      if (operatorId.value) {
        try {
          const result = await operatorService.getOperatorByID(
            operatorId.value,
          );
          operator.value = result;
        } catch (error) {
          errorTrackingStore.logError(error as Error, {
            component: "OrderStore",
            operation: "loadOrder-getOperator",
            timestamp: new Date(),
          });
        }
      }

      if (
        doc.customer_id !== customerId.value ||
        operatorId.value !== doc.operator_id
      ) {
        putOrder(mapOrderToDocument(OrderStatus.PENDING));
      }
    } catch (error) {
      errorTrackingStore.logError(error as Error, {
        component: "OrderStore",
        operation: "loadOrder",
        timestamp: new Date(),
      });

      notificationStore.showError(
        "Error Loading Order",
        "An error occurred while loading the current order. Starting with a new order.",
      );

      // Reset to a new order on error
      id.value = "";
      rev.value = "";
      customerId.value = "";
      customer.value = null;
      createdAt.value = "";
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    }
  };

  const unselectCustomer = () => {
    try {
      customerId.value = "";
      customer.value = null;
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    } catch (error) {
      errorTrackingStore.logError(error as Error, {
        component: "OrderStore",
        operation: "unselectCustomer",
        timestamp: new Date(),
      });

      notificationStore.showError(
        "Error Removing Customer",
        "An error occurred while removing the customer from the order.",
      );
    }
  };

  const selectCustomer = (selected: Customer) => {
    try {
      customer.value = selected;
      customerId.value = selected._id;
      putOrder(mapOrderToDocument(OrderStatus.PENDING));

      notificationStore.showSuccess(
        "Customer Selected",
        `${selected.name} has been added to the order.`,
      );
    } catch (error) {
      errorTrackingStore.logError(error as Error, {
        component: "OrderStore",
        operation: "selectCustomer",
        timestamp: new Date(),
      });

      notificationStore.showError(
        "Error Selecting Customer",
        "An error occurred while adding the customer to the order.",
      );
    }
  };

  const unselectOperator = () => {
    try {
      operatorId.value = "";
      operator.value = null;
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    } catch (error) {
      errorTrackingStore.logError(error as Error, {
        component: "OrderStore",
        operation: "unselectOperator",
        timestamp: new Date(),
      });

      notificationStore.showError(
        "Error Removing Operator",
        "An error occurred while removing the operator from the order.",
      );
    }
  };

  const selectOperator = (selected: Operator) => {
    try {
      operator.value = selected;
      operatorId.value = selected._id;
      putOrder(mapOrderToDocument(OrderStatus.PENDING));

      notificationStore.showSuccess(
        "Operator Selected",
        `${selected.name} is now handling this order.`,
      );
    } catch (error) {
      errorTrackingStore.logError(error as Error, {
        component: "OrderStore",
        operation: "selectOperator",
        timestamp: new Date(),
      });

      notificationStore.showError(
        "Error Selecting Operator",
        "An error occurred while assigning the operator to the order.",
      );
    }
  };

  onMounted(() => {
    loadOrder();
  });

  watch(
    () => amount.value,
    (newValue) => {
      if (paymentMethod.value === "cash") {
        if (!newValue || isNaN(parseFloat(newValue))) {
          amountError.value = "Please enter a valid amount.";
        } else if (parseFloat(newValue) < total.value) {
          amountError.value = "Amount paid is less than the total.";
        } else {
          amountError.value = null;
          change.value = parseFloat(newValue) - total.value;
        }
      }
    },
  );

  return {
    id,
    increase,
    decrease,
    abandon,
    addProduct,
    items,
    total,
    calculateTotal,
    complete,
    amount,
    paymentMethod,
    amountError,
    change,
    customer,
    unselectCustomer,
    selectCustomer,
    operator,
    selectOperator,
    unselectOperator,
  };
});
