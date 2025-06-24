<script setup lang="ts">
defineOptions({
  name: "UtilsPage",
});

import { resetCustomerDB } from "@/customer/customer-db";
import { resetOperatorDB } from "@/operator/operator-db";
import { resetOrderDB } from "@/order/order-db";
import { resetProductDB } from "@/product/product-db";

import { searchService } from "@/product/singleton";

const cleanDbs = async () => {
  await resetOrderDB();
  await resetProductDB();
  await resetCustomerDB();
  await resetOperatorDB();
  await searchService.clearCache();

  console.log("All databases have been cleaned.");
  localStorage.clear();
};
</script>
<template>
  <nav>
    <ul class="flex gap-2">
      <li>
        <button
          class="bg-red-700 text-white py-2 px-3 rounded mb-4"
          @click="cleanDbs"
        >
          Clear databases
        </button>
      </li>
      <li>
        <RouterLink
          to="/"
          class="inline-block bg-black text-white py-2 px-3 rounded mb-4"
          >Home</RouterLink
        >
      </li>
      <li>
        <RouterLink
          to="/operators/new"
          class="inline-block bg-black text-white py-2 px-3 rounded mb-4"
          >Add a new operator</RouterLink
        >
      </li>
      <li>
        <RouterLink
          to="/products"
          class="inline-block bg-black text-white py-2 px-3 rounded mb-4"
          >View products</RouterLink
        >
      </li>
      <li>
        <RouterLink
          to="/customers/all"
          class="inline-block bg-black text-white py-2 px-3 rounded mb-4"
          >View all customers</RouterLink
        >
      </li>
    </ul>
  </nav>
</template>
