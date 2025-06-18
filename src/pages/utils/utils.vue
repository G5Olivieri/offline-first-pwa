<script setup lang="ts">
import {
  getCustomerDB,
  getOperatorDB,
  getOrderDB,
  getProductDB,
} from "../../db";
import { searchService } from "../../services/search-service";

const cleanDbs = async () => {
  const orderDB = await getOrderDB();
  const productDB = await getProductDB();
  const customerDB = await getCustomerDB();
  const operatorDB = await getOperatorDB();

  await orderDB.destroy();
  await productDB.destroy();
  await customerDB.destroy();
  await operatorDB.destroy();
  await searchService.clearCache();

  console.log("All databases have been cleaned.");
  localStorage.clear();
  window.location.reload();
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
      <li>
        <RouterLink
          to="/orders"
          class="inline-block bg-black text-white py-2 px-3 rounded mb-4"
          >View orders</RouterLink
        >
      </li>
    </ul>
  </nav>
</template>
