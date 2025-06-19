import { defineStore } from "pinia";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { getOrderDB } from "../db";
import { recommendationEngine } from "../services/recommendation-engine";
import type { Item, Order, PaymentMethod } from "../types/order";
import { OrderStatus } from "../types/order";
import type { Product } from "../types/product";
import { useCustomerStore } from "./customer-store";
import { useOperatorStore } from "./operator-store";
import { useProductStore } from "./product-store";
import { useTerminalStore } from "./terminal-store";

export const useOrderStore = defineStore("orderStore", () => {
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
      return;
    }
    if (order.size === 0) {
      return;
    }

    const orderDocument = mapOrderToDocument(OrderStatus.CANCELLED);
    await orderDB.put(orderDocument);

    order.clear();
    currentOrderId.value = "";
    currentOrderRev.value = undefined;
    await customerStore.clearCustomer();
    syncOrder();
  };

  const syncOrder = async () => {
    if (syncing.value) {
      return;
    }
    syncing.value = true;

    if (currentOrderId.value === "") {
      currentOrderId.value = crypto.randomUUID();
      localStorage.setItem("currentOrderId", currentOrderId.value);
    }

    try {
      const result = await orderDB.put(mapOrderToDocument(OrderStatus.PENDING));
      currentOrderRev.value = result.rev;
      localStorage.setItem("currentOrderRev", result.rev);
    } finally {
      syncing.value = false;
    }
  };

  const calculateTotal = (item: Item) => {
    return item.product.price * item.quantity;
  };

  const complete = async () => {
    if (!currentOrderId.value) {
      return;
    }
    if (order.size === 0) {
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

    // Complete the order
    const orderDocument = mapOrderToDocument(OrderStatus.COMPLETED);
    await orderDB.put(orderDocument);

    // Update recommendation system with completed order data
    await recommendationEngine.updateProductAffinities(orderDocument);
    await recommendationEngine.updateCustomerPreferences(orderDocument);

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
  };

  const items = computed(() => Array.from(order.values()));
  const total = computed(() =>
    items.value.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )
  );

  const loadOrder = async () => {
    if (!currentOrderId.value) {
      syncOrder();
      return;
    }
    const doc = await orderDB.get(currentOrderId.value);
    if (
      !doc ||
      doc.status === OrderStatus.COMPLETED ||
      doc.status === OrderStatus.CANCELLED
    ) {
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
        if (order._rev) {
          await orderDB.remove(order._id, order._rev);
          purgedCount++;
        }
      }

      return purgedCount;
    } catch {
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
    } catch {
      return [];
    }
  };

  return {
    id: currentOrderId,
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
    fetchOrders,
    purgeNonPendingOrders,
  };
});
