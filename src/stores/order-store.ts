import { useLocalStorage } from "@vueuse/core";
import throttle from "lodash.throttle";
import { defineStore } from "pinia";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { getOrderDB } from "../db";
import { customerService } from "../services/customer-service";
import { operatorService } from "../services/operator-service";
import { productService } from "../services/product-service";
import { recommendationEngine } from "../services/recommendation-engine";
import type { Customer } from "../types/customer";
import type { Operator } from "../types/operator";
import type { Item, Order, PaymentMethod } from "../types/order";
import { OrderStatus } from "../types/order";
import type { Product } from "../types/product";
import { useTerminalStore } from "./terminal-store";

export const useOrderStore = defineStore("orderStore", () => {
  const orderDB = getOrderDB();

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
    if (itemsMap.has(product._id)) {
      const existingItem = itemsMap.get(product._id);
      if (existingItem) {
        if (!product.stock || existingItem.quantity < product.stock) {
          existingItem.quantity++;
          existingItem.total = calculateTotal(existingItem);
        } else {
          alert("Cannot increase quantity beyond stock limit.");
        }
      }
    } else {
      itemsMap.set(product._id, { quantity: 1, product, total: product.price });
    }
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const increase = (item: Item) => {
    if (!item.product.stock || item.quantity < item.product.stock) {
      item.quantity++;
      item.total = calculateTotal(item);
    } else {
      alert("Cannot increase quantity beyond stock limit.");
    }
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const decrease = async (item: Item) => {
    if (item.quantity > 1) {
      item.quantity--;
      item.total = calculateTotal(item);
    } else {
      itemsMap.delete(item.product._id);
    }
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const abandon = async () => {
    if (!id.value) {
      return;
    }
    if (itemsMap.size === 0) {
      return;
    }

    putOrder(mapOrderToDocument(OrderStatus.CANCELLED));
    await putOrder.flush();
    await createNewOrder();
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
    if (!id.value) {
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

    await productService.changeStock(new Map(productsToUpdate));
    await createNewOrder();
  };

  const loadOrder = async () => {
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
      unselectCustomer();
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
      customerService.getCustomerByID(customerId.value).then((result) => {
        customer.value = result;
      });
    }

    if (operatorId.value) {
      operatorService.getOperatorByID(operatorId.value).then((result) => {
        operator.value = result;
      });
    }

    if (
      doc.customer_id !== customerId.value ||
      operatorId.value !== doc.operator_id
    ) {
      putOrder(mapOrderToDocument(OrderStatus.PENDING));
    }
  };

  const unselectCustomer = () => {
    customerId.value = "";
    customer.value = null;
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const selectCustomer = (selected: Customer) => {
    customer.value = selected;
    customerId.value = selected._id;
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const unselectOperator = () => {
    operatorId.value = "";
    operator.value = null;
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
  };

  const selectOperator = (selected: Operator) => {
    operator.value = selected;
    operatorId.value = selected._id;
    putOrder(mapOrderToDocument(OrderStatus.PENDING));
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
