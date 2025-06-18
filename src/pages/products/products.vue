<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useProductStore } from "../../stores/product-store";
import type { Product } from "../../types/product";

const productStore = useProductStore();
const products = ref<{ count: number; products: Product[] }>({
  count: 0,
  products: [],
});
const limit = ref(10);
const skip = ref(0);

const loadProducts = async () => {
  try {
    products.value = await productStore.listProducts({
      limit: limit.value,
      skip: skip.value,
    });
  } catch (error) {
    console.error("Error loading products:", error);
    alert("Failed to load products. Please try again.");
  }
};

const deleteProduct = async (id: string) => {
  try {
    await productStore.deleteProduct(id);
    loadProducts();
  } catch (error) {
    console.error("Error deleting product:", error);
    alert("Failed to delete product. Please try again.");
  }
};

const next = () => {
  skip.value += limit.value;
  loadProducts();
};
const previous = () => {
  if (skip.value >= limit.value) {
    skip.value -= limit.value;
    loadProducts();
  }
};
onMounted(() => loadProducts());
</script>
<template>
  <nav>
    <ul>
      <li>
        <RouterLink
          to="/products/new"
          class="inline-block bg-black text-white py-2 px-3 rounded mb-4"
          >Add a new product</RouterLink
        >
      </li>
      <li>
        <RouterLink
          to="/products/import"
          class="inline-block bg-black text-white py-2 px-3 rounded mb-4"
          >Import products</RouterLink
        >
      </li>
    </ul>
  </nav>
  <div>{{ products.count }} products found</div>
  <div>
    <button class="bg-black text-white py-2 px-3 rounded" @click="previous">
      previous
    </button>
    <div>{{ skip }} - {{ skip + limit }}</div>
    <button class="bg-black text-white py-2 px-3 rounded" @click="next">
      next
    </button>
  </div>
  <ul class="flex gap-2 flex-wrap">
    <li
      v-for="product in products.products"
      :key="product._id"
      class="flex flex-col p-2 border rounded"
    >
      <span>ID: {{ product._id }}</span>
      <span>Name: {{ product.name }}</span>
      <span>Barcode: {{ product.barcode }}</span>
      <span>Price: {{ product.price }}</span>
      <span>Stock: {{ product.stock }}</span>
      <button
        @click="deleteProduct(product._id)"
        type="button"
        class="bg-red-800 text-white rounded py-2 px-3"
      >
        delete
      </button>
    </li>
  </ul>
</template>
