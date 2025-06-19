<script setup lang="ts">
defineOptions({
  name: 'AllCustomers'
});

import { onMounted, ref } from "vue";
import { useCustomerStore } from "../../stores/customer-store";
import { type Customer } from "../../types/customer";

const customerStore = useCustomerStore();
const customers = ref<Customer[]>([]);

const deleteCustomer = (id: string) => {
  customerStore
    .deleteCustomer(id)
    .then(() => {
      customers.value = customers.value.filter(
        (customer) => customer._id !== id
      );
    })
    .catch((error) => {
      console.error("Error deleting customer:", error);
      alert("Failed to delete customer. Please try again.");
    });
};

const fetchAll = async () => {
  try {
    customers.value = await customerStore.fetchAllCustomers();
  } catch (error) {
    console.error("Error fetching customers:", error);
    alert("Failed to fetch customers. Please try again.");
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
