<script setup lang="ts">
defineOptions({
  name: "AllCustomers",
});

import { errorTrackingService } from "@/error/error-tracking-service";
import { customerService } from "@/services/customer-service";
import { useNotificationStore } from "@/stores/notification-store";
import { type Customer } from "@/types/customer";
import { onMounted, ref } from "vue";

const customers = ref<Customer[]>([]);
const notificationStore = useNotificationStore();

const deleteCustomer = (id: string) => {
  customerService
    .deleteCustomer(id)
    .then(() => {
      customers.value = customers.value.filter(
        (customer) => customer._id !== id
      );
    })
    .catch((error) => {
      errorTrackingService.track(error as Error, {
        component: "AllCustomers",
        operation: "deleteCustomer",
        customerId: id,
        timestamp: new Date(),
      });
      notificationStore.showError(
        "Delete Customer",
        "Failed to delete customer. Please try again."
      );
    });
};

const fetchAll = async () => {
  try {
    customers.value = await customerService.listCustomers();
  } catch (error) {
    errorTrackingService.track(error as Error, {
      component: "AllCustomers",
      operation: "fetchAll",
      timestamp: new Date(),
    });
    notificationStore.showError(
      "Fetch Customers",
      "Failed to fetch customers. Please try again."
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
