<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useOrderStore } from "../../stores/order-store";
import type { Order } from "../../types/order";
const orderStore = useOrderStore();
const orders = ref<Order[]>([]);

const fetchOrders = async () => {
  try {
    orders.value = await orderStore.fetchOrders();
  } catch (error) {
    console.error("Failed to fetch orders:", error);
  }
};

onMounted(() => {
  fetchOrders();
});

</script>
<template>
  <h1>Orders</h1>
  <div v-if="orders.length > 0">
    <h2>Order List</h2>
    <ul>
      <li v-for="order in orders" :key="order._id">
        Order ID: {{ order._id }} - {{ order.status }} - Total: {{ order.total }} - {{ order.updatedAt }}
      </li>
    </ul>
  </div>
  <div v-else>
    <p>No orders found.</p>
  </div>
</template>
