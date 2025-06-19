import { useLocalStorage } from "@vueuse/core";
import throttle from "lodash.throttle";
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
  const currentOrderId = useLocalStorage("currentOrderId", "");
  const currentOrderRev = useLocalStorage("currentOrderRev", "");
  const operatorStore = useOperatorStore();
  const customerStore = useCustomerStore();
  const terminalStore = useTerminalStore();
  const amount = ref("");
  const amountError = ref<string | null>(null);
  const paymentMethod = ref<PaymentMethod>("card");
  const change = ref<number | null>(null);
  let createdAt = "";

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
    if (currentOrderId.value === "") {
      currentOrderId.value = crypto.randomUUID();
    }

    if (createdAt === "") {
      createdAt = new Date().toISOString();
    }

    return {
      _id: currentOrderId.value,
      _rev: currentOrderRev.value || undefined,
      items: Array.from(itemsMap.values()),
      total: total.value,
      status,
      terminal_id: terminalStore.terminalId,
      payment_method: paymentMethod.value,
      amount: paymentMethod.value === "cash" ? parseFloat(amount.value) : null,
      operator_id: operatorStore.operatorId || undefined,
      customer_id: customerStore.customerId || undefined,
      created_at: createdAt,
      updated_at: new Date().toISOString(),
    };
  };

  const putOrder = throttle(async (order: Order) => {
    const result = await orderDB.put(order);
    currentOrderRev.value = result.rev;
  }, 1000);

  const addProduct = (product: Product) => {
    if (itemsMap.has(product._id)) {
      const existingItem = itemsMap.get(product._id);
      if (existingItem) {
        if (!product.stock || existingItem.quantity < product.stock) {
          existingItem.quantity++;
        } else {
          alert("Cannot increase quantity beyond stock limit.");
        }
      }
    } else {
      itemsMap.set(product._id, { quantity: 1, product });
    }
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const increase = (item: Item) => {
    if (!item.product.stock || item.quantity < item.product.stock) {
      item.quantity++;
    } else {
      alert("Cannot increase quantity beyond stock limit.");
    }
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const decrease = async (item: Item) => {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      itemsMap.delete(item.product._id);
    }
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const abandon = async () => {
    if (!currentOrderId.value) {
      return;
    }
    if (itemsMap.size === 0) {
      return;
    }

    putOrder(mapOrderToDocument(OrderStatus.CANCELLED));
    await putOrder.flush();

    itemsMap.clear();
    currentOrderId.value = "";
    currentOrderRev.value = undefined;
    await customerStore.clearCustomer();
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const calculateTotal = (item: Item) => {
    return item.product.price * item.quantity;
  };

  const complete = async () => {
    if (!currentOrderId.value) {
      return;
    }
    if (itemsMap.size === 0) {
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

    const orderDocument = mapOrderToDocument(OrderStatus.COMPLETED);
    putOrder(orderDocument);
    await putOrder.flush();

    await recommendationEngine.updateProductAffinities(orderDocument);
    await recommendationEngine.updateCustomerPreferences(orderDocument);

    const productsToUpdate: [string, number][] = Array.from(
      itemsMap.values()
    ).map((item) => [item.product._id, item.product.stock - item.quantity]);

    itemsMap.clear();
    currentOrderId.value = "";
    currentOrderRev.value = "";
    await productStore.changeStock(new Map(productsToUpdate));
    await customerStore.clearCustomer();
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const loadOrder = async () => {
    if (currentOrderId.value === "") {
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
      return;
    }
    const doc = await orderDB.get(currentOrderId.value);
    if (
      !doc ||
      doc.status === OrderStatus.COMPLETED ||
      doc.status === OrderStatus.CANCELLED
    ) {
      currentOrderId.value = "";
      currentOrderRev.value = "";
      customerStore.clearCustomer();
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
      return;
    }
    currentOrderRev.value = doc._rev;
    itemsMap.clear();
    doc.items.forEach((item: Item) => {
      itemsMap.set(item.product._id, item);
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
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    }
  };

  onMounted(() => {
    loadOrder();
  });

  watch(
    () => operatorStore.operatorId,
    () => {
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    }
  );

  watch(
    () => customerStore.customerId,
    () => {
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
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
  };
});
