<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-2xl font-bold">Import Products</h1>
    <p class="text-gray-600">Upload a JSONL file to import products.</p>
    <input
      type="file"
      accept=".jsonl"
      @change="handleFileUpload"
      class="border rounded p-2"
    />
    <button
      @click="importProducts"
      class="bg-blue-600 text-white py-2 px-4 rounded"
    >
      Import Products
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useProductStore } from "../../stores/product-store";

const productStore = useProductStore();
const file = ref<File | null>(null);

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    file.value = target.files[0];
  }
};

const importProducts = async () => {
  if (!file.value) {
    alert("Please upload a JSONL file first.");
    return;
  }

  try {
    const text = await file.value.text();
    const lines = text.split("\n");
    const products = lines
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line))
      .map((p) => ({
        ...p,
        price: parseFloat(p.price),
        stock: Math.ceil(Math.random() * 30),
      }));
    await productStore.bulkInsertProducts(products);
    alert("Products imported successfully!");
  } catch (error) {
    console.error("Error importing products:", error);
    alert("Failed to import products. Please try again.");
  }
};
</script>
