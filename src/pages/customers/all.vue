<script setup lang="ts">
defineOptions({
  name: "AllCustomers",
});

import { type Customer } from "@/customer/customer";
import { getCustomerService } from "@/customer/get-customer-service";
import { useNotificationStore } from "@/stores/notification-store";
import { trackingService } from "@/tracking/singleton";
import { EventType } from "@/tracking/tracking";
import { onMounted, ref } from "vue";

const customers = ref<Customer[]>([]);
const notificationStore = useNotificationStore();

const deleteCustomer = async (id: string) => {
  try {
    const customerService = await getCustomerService();
    await customerService.deleteCustomer(id);
    customers.value = customers.value.filter((customer) => customer._id !== id);
  } catch (error) {
    trackingService.track(EventType.ERROR, {
      message: (error as Error).message,
      stack: (error as Error).stack,
      eventType: "delete_customer",
      customerId: id,
    });
    notificationStore.showError(
      "Delete Customer",
      "Failed to delete customer. Please try again.",
    );
  }
};

const fetchAll = async () => {
  try {
    const customerService = await getCustomerService();
    const result = await customerService.listCustomers();
    customers.value = result.customers;
  } catch (error) {
    trackingService.track(EventType.ERROR, {
      message: (error as Error).message,
      stack: (error as Error).stack,
      eventType: "fetch_all_customers",
    });
    notificationStore.showError(
      "Fetch Customers",
      "Failed to fetch customers. Please try again.",
    );
  }
};

onMounted(() => {
  fetchAll();
});
</script>
<template>
  <header>
    <h1>Customers</h1>
  </header>
  <main>
    <button class="bg-black text-white py-2 px-3 rounded" @click="fetchAll">
      Refresh
    </button>
    <ul>
      <li v-for="customer in customers" :key="customer._id">
        <span>{{ customer.name }} - {{ customer.document }}</span>
        <button
          type="button"
          class="py-2 px-3 bg-black text-white rounded"
          @click="deleteCustomer(customer._id)"
        >
          delete
        </button>
      </li>
    </ul>
  </main>
</template>
