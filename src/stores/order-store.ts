import { defineStore } from "pinia";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { createLogger } from "../services/logger-service";
import { getOrderDB } from "../db";
import type { Item, Order, PaymentMethod } from "../types/order";
import { OrderStatus } from "../types/order";
import type { Product } from "../types/product";
import { useCustomerStore } from "./customer-store";
import { useOperatorStore } from "./operator-store";
import { useProductStore } from "./product-store";
import { useTerminalStore } from "./terminal-store";

const logger = createLogger('OrderStore');

export const useOrderStore = defineStore("orderStore", () => {
  const router = useRouter();
  const orderDB = getOrderDB();
  const productStore = useProductStore();
  const currentOrderId = ref(localStorage.getItem("currentOrderId") || "");
  const currentOrderRev = ref<string | undefined>(
    localStorage.getItem("currentOrderRev") || undefined
  );
  const order = reactive<Map<string, Item>>(new Map());
  const operatorStore = useOperatorStore();
  const customerStore = useCustomerStore();
  const terminalStore = useTerminalStore();
  const syncing = ref(false);
  const amount = ref("");
  const amountError = ref<string | null>(null);
  const paymentMethod = ref<PaymentMethod>("card");
  const change = ref<number | null>(null);
  const createdAt = ref<string>(new Date().toISOString());

  const mapOrderToDocument = (
    status: OrderStatus = OrderStatus.PENDING
  ): Order => {
    return {
      _id: currentOrderId.value,
      _rev: currentOrderRev.value,
      items: Array.from(order.values()),
      total: total.value,
      status,
      terminal_id: terminalStore.terminalId,
      payment_method: paymentMethod.value,
      amount: paymentMethod.value === "cash" ? parseFloat(amount.value) : null,
      operator_id: operatorStore.operatorId || undefined,
      customer_id: customerStore.customerId || undefined,
      created_at: createdAt.value,
      updated_at: new Date().toISOString(),
    };
  };

  const addProduct = (product: Product) => {
    if (order.has(product._id)) {
      const existingItem = order.get(product._id);
      if (existingItem) {
        if (!product.stock || existingItem.quantity < product.stock) {
          existingItem.quantity++;
        } else {
          alert("Cannot increase quantity beyond stock limit.");
        }
      }
    } else {
      order.set(product._id, { quantity: 1, product });
    }
    syncOrder();
  };

  const increase = (item: Item) => {
    if (!item.product.stock || item.quantity < item.product.stock) {
      item.quantity++;
    } else {
      alert("Cannot increase quantity beyond stock limit.");
    }
    syncOrder();
  };

  const decrease = async (item: Item) => {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      order.delete(item.product._id);
    }
    await syncOrder();
  };

  const abandon = async () => {
    if (!currentOrderId.value) {
      logger.warn("No current order to abandon.");
      return;
    }
    if (order.size === 0) {
      logger.warn("Cannot abandon an empty order.");
      return;
    }

    if (confirm("Are you sure you want to abandon the order?")) {
      try {
        await orderDB.put(mapOrderToDocument(OrderStatus.CANCELLED));
        order.clear();
        currentOrderId.value = "";
        currentOrderRev.value = undefined;
        await customerStore.clearCustomer();
        syncOrder();
      } catch (error) {
        logger.error("Error abandoning order:", error);
      }
    }
  };

  const syncOrder = async () => {
    logger.debug("Syncing order...");
    if (syncing.value) {
      logger.warn("Sync already in progress, skipping.");
      return;
    }
    syncing.value = true;

    if (currentOrderId.value === "") {
      logger.debug("No current order ID found, generating a new one.");
      currentOrderId.value = crypto.randomUUID();
      localStorage.setItem("currentOrderId", currentOrderId.value);
    }

    try {
      const result = await orderDB.put(mapOrderToDocument(OrderStatus.PENDING));
      currentOrderRev.value = result.rev;
      localStorage.setItem("currentOrderRev", result.rev);
    } catch (error) {
      logger.error("Error syncing order:", error);
    } finally {
      syncing.value = false;
    }
  };

  const calculateTotal = (item: Item) => {
    return item.product.price * item.quantity;
  };

  const complete = async () => {
    if (!currentOrderId.value) {
      logger.warn("No current order to complete.");
      return;
    }
    if (order.size === 0) {
      logger.warn("Cannot complete an empty order.");
      return;
    }
    if (router.currentRoute.value.path !== "/checkout") {
      router.push("/checkout");
      return;
    }
    if (paymentMethod.value === "cash" && !amount.value) {
      amountError.value = "Please enter the amount paid.";
      return;
    }
    if (
      paymentMethod.value === "cash" &&
      parseFloat(amount.value) < total.value
    ) {
      amountError.value = "Amount paid is less than the total.";
      return;
    }
    amountError.value = null;
    amount.value = "";
    paymentMethod.value = "card";
    await orderDB.put(mapOrderToDocument(OrderStatus.COMPLETED));

    const productsToUpdate: [string, number][] = Array.from(order.values()).map(
      (item) => [item.product._id, item.product.stock - item.quantity]
    );

    order.clear();
    currentOrderId.value = "";
    currentOrderRev.value = undefined;
    localStorage.removeItem("currentOrderId");
    localStorage.removeItem("currentOrderRev");
    await productStore.changeStock(new Map(productsToUpdate));
    await customerStore.clearCustomer();
    router.push("/");
  };

  const values = computed(() => Array.from(order.values()));
  const total = computed(() =>
    values.value.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )
  );

  const loadOrder = async () => {
    if (!currentOrderId.value) {
      logger.debug("No current order ID found in localStorage.");
      syncOrder();
      return;
    }
    const doc = await orderDB.get(currentOrderId.value);
    if (
      !doc ||
      doc.status === OrderStatus.COMPLETED ||
      doc.status === OrderStatus.CANCELLED
    ) {
      logger.warn("No document found for current order ID.");

      currentOrderId.value = "";
      currentOrderRev.value = undefined;
      localStorage.removeItem("currentOrderId");
      localStorage.removeItem("currentOrderRev");
      customerStore.clearCustomer();
      return;
    }
    currentOrderRev.value = doc._rev;
    localStorage.setItem("currentOrderRev", doc._rev || "");
    order.clear();
    doc.items.forEach((item: Item) => {
      order.set(item.product._id, item);
    });

    if (doc.customer_id && !customerStore.customerId) {
      await customerStore.setCustomer(doc.customer_id);
    }

    if (doc.operator_id && !operatorStore.operatorId) {
      await operatorStore.setOperator(doc.operator_id);
    }

    if (
      doc.customer_id !== customerStore.customerId ||
      operatorStore.operatorId !== doc.operator_id
    ) {
      logger.warn("The current order does not match the current customer or operator, resync.");
      syncOrder();
      return;
    }
  };

  onMounted(() => {
    loadOrder();
  });

  watch(
    () => operatorStore.operatorId,
    () => {
      syncOrder();
    }
  );

  watch(
    () => customerStore.customerId,
    () => {
      syncOrder();
    }
  );

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

  const purgeNonPendingOrders = async (): Promise<number> => {
    try {
      const allOrders = await orderDB.allDocs({
        include_docs: true,
      });

      const nonPendingOrders = allOrders.rows
        .map((row) => row.doc as Order)
        .filter(
          (order) =>
            order.status === OrderStatus.COMPLETED ||
            order.status === OrderStatus.CANCELLED
        );

      let purgedCount = 0;
      for (const order of nonPendingOrders) {
        try {
          if (order._rev) {
            await orderDB.remove(order._id, order._rev);
            purgedCount++;
            logger.info(`Purged ${order.status} order ${order._id} from local storage`);
          }
        } catch (error) {
          logger.error(`Failed to purge order ${order._id}:`, error);
        }
      }

      return purgedCount;
    } catch (error) {
      logger.error("Error purging non-pending orders:", error);
      return 0;
    }
  };

  const fetchOrders = async (): Promise<Order[]> => {
    try {
      const orders = await orderDB.allDocs({
        include_docs: true,
      });
      return orders.rows
        .map((row) => row.doc as Order)
        .filter((order) => order.status === OrderStatus.PENDING) // Only return pending orders (non-pending are auto-purged)
        .sort((a, b) => {
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        });
    } catch (error) {
      logger.error("Error fetching orders:", error);
      return [];
    }
  };

  return {
    id: currentOrderId,
    increase,
    decrease,
    abandon,
    addProduct,
    values,
    total,
    calculateTotal,
    complete,
    amount,
    paymentMethod,
    amountError,
    change,
    fetchOrders,
    purgeNonPendingOrders,
  };
});
