import { getOrderDB } from "@/db";
import { customerService } from "@/services/customer-service";
import { operatorService } from "@/services/operator-service";
import { orderEventEmitter } from "@/services/order-event-emitter";
import { startOrderNotificationHandler } from "@/services/order-notification-handler";
import { productService } from "@/product/singleton";
import { recommendationEngine } from "@/services/recommendation-engine";
import type { Customer } from "@/types/customer";
import type { Operator } from "@/types/operator";
import type { Item, Order, PaymentMethod } from "@/types/order";
import { OrderStatus } from "@/types/order";
import type { Product } from "@/product/product";
import { useLocalStorage } from "@vueuse/core";
import throttle from "lodash.throttle";
import { defineStore } from "pinia";
import { computed, onMounted, reactive, ref, toValue, watch } from "vue";
import { errorTrackingService } from "../error/error-tracking-service";
import { useNotificationStore } from "./notification-store";
import { useTerminalStore } from "./terminal-store";

export const useOrderStore = defineStore("orderStore", () => {
  const orderDB = getOrderDB();
  const notificationStore = useNotificationStore();

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
      0
    )
  );

  const mapOrderToDocument = (
    status: OrderStatus = OrderStatus.PENDING
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

            orderEventEmitter.emit("product_added", { product });
          } else {
            orderEventEmitter.emit("stock_limit_reached", {
              product,
              currentQuantity: existingItem.quantity,
              stockLimit: product.stock,
            });
            return;
          }
        }
      } else {
        if (product.stock && product.stock <= 0) {
          orderEventEmitter.emit("out_of_stock", { product });
          return;
        }

        itemsMap.set(product._id, {
          quantity: 1,
          product,
          total: product.price,
        });

        orderEventEmitter.emit("product_added", { product });
      }

      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    } catch (error) {
      orderEventEmitter.emit("order_error", {
        error: error as Error,
        context: { operation: "addProduct" },
      });
    }
  };

  const increase = (item: Item) => {
    try {
      if (!item.product.stock || item.quantity < item.product.stock) {
        item.quantity++;
        item.total = calculateTotal(item);

        orderEventEmitter.emit("quantity_increased", { product: item.product });
      } else {
        orderEventEmitter.emit("stock_limit_reached", {
          product: item.product,
          currentQuantity: item.quantity,
          stockLimit: item.product.stock,
        });
        return;
      }

      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    } catch (error) {
      orderEventEmitter.emit("order_error", {
        error: error as Error,
        context: { operation: "increase" },
      });
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

      orderEventEmitter.emit("quantity_decreased", { product: item.product });
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    } catch (error) {
      orderEventEmitter.emit("order_error", {
        error: error as Error,
        context: { operation: "decrease" },
      });
    }
  };

  const abandon = async () => {
    try {
      if (!id.value) {
        orderEventEmitter.emit("order_error", {
          error: new Error("No active order to abandon"),
          context: { operation: "abandon", reason: "no_active_order" },
        });
        return;
      }
      if (itemsMap.size === 0) {
        orderEventEmitter.emit("order_error", {
          error: new Error("Order is already empty"),
          context: { operation: "abandon", reason: "empty_order" },
        });
        return;
      }

      const doc = mapOrderToDocument(OrderStatus.CANCELLED);
      putOrder(doc);
      await putOrder.flush();
      await createNewOrder();

      orderEventEmitter.emit("order_abandoned", {
        order: doc,
      });
    } catch (error) {
      orderEventEmitter.emit("order_error", {
        error: error as Error,
        context: { operation: "abandon" },
      });
    }
  };

  const createNewOrder = async () => {
    itemsMap.clear();
    id.value = "";
    rev.value = "";
    createdAt.value = "";
    unselectCustomer();
    const doc = mapOrderToDocument(OrderStatus.PENDING);
    await putOrder(doc);
    orderEventEmitter.emit("order_created", {
      order: doc,
    });
  };

  const calculateTotal = (item: Item) => {
    return item.product.price * item.quantity;
  };

  const complete = async () => {
    try {
      if (!id.value) {
        orderEventEmitter.emit("payment_validation_failed", {
          message: "No active order to complete",
        });
        return;
      }
      if (itemsMap.size === 0) {
        orderEventEmitter.emit("payment_validation_failed", {
          message: "Cannot complete an empty order. Please add items first.",
        });
        return;
      }
      if (paymentMethod.value === "cash" && !amount.value) {
        amountError.value = "Please enter the amount paid.";
        orderEventEmitter.emit("payment_validation_failed", {
          message: "Please enter the amount paid for cash transactions.",
        });
        return;
      }
      if (
        paymentMethod.value === "cash" &&
        parseFloat(amount.value) < total.value
      ) {
        amountError.value = "Amount paid is less than the total.";
        orderEventEmitter.emit("payment_validation_failed", {
          message: `Amount paid (${parseFloat(amount.value).toFixed(
            2
          )}) is less than the total (${total.value.toFixed(2)}).`,
        });
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
        itemsMap.values()
      ).map((item) => [item.product._id, item.product.stock - item.quantity]);

      await productService.changeStock(new Map(productsToUpdate));
      await createNewOrder();
    } catch (error) {
      orderEventEmitter.emit("order_error", {
        error: error as Error,
        context: { operation: "complete" },
      });
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
        if (doc) {
          orderEventEmitter.emit("order_load_failed", {
            error: new Error(
              `Order with ID ${id.value} is already completed or cancelled.`
            ),
          });
        }
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
        const result = await customerService.getCustomerByID(customerId.value);
        customer.value = result;
      }

      if (operatorId.value) {
        const result = await operatorService.getOperatorByID(operatorId.value);
        operator.value = result;
      }

      if (
        doc.customer_id !== customerId.value ||
        operatorId.value !== doc.operator_id
      ) {
        putOrder(mapOrderToDocument(OrderStatus.PENDING));
      }
    } catch (error) {
      orderEventEmitter.emit("order_load_failed", {
        error: error as Error,
      });

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
      const old = toValue(customer);
      customerId.value = "";
      customer.value = null;
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
      orderEventEmitter.emit("customer_unselected", {
        customer: old,
      });
    } catch (error) {
      orderEventEmitter.emit("order_error", {
        error: error as Error,
        context: { operation: "unselectCustomer" },
      });
    }
  };

  const selectCustomer = (selected: Customer) => {
    try {
      customer.value = selected;
      customerId.value = selected._id;
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
      orderEventEmitter.emit("customer_selected", { customer: selected });
    } catch (error) {
      orderEventEmitter.emit("order_error", {
        error: error as Error,
        context: { operation: "selectCustomer" },
      });
    }
  };

  const unselectOperator = () => {
    try {
      const old = toValue(operator);
      operatorId.value = "";
      operator.value = null;
      putOrder(mapOrderToDocument(OrderStatus.PENDING));

      orderEventEmitter.emit("operator_unselected", {
        operator: old,
      });
    } catch (error) {
      orderEventEmitter.emit("order_error", {
        error: error as Error,
        context: { operation: "unselectOperator" },
      });
    }
  };

  const selectOperator = (selected: Operator) => {
    try {
      operator.value = selected;
      operatorId.value = selected._id;
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
      orderEventEmitter.emit("operator_selected", { operator: selected });
    } catch (error) {
      orderEventEmitter.emit("order_error", {
        error: error as Error,
        context: { operation: "selectOperator" },
      });
    }
  };

  onMounted(() => {
    startOrderNotificationHandler(notificationStore, errorTrackingService);
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
    }
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
