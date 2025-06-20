<template>
  <div
    class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
  >
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <h3
          class="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2"
        >
          {{ item.product.name }}
        </h3>
        <p
          class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block"
        >
          {{ item.product.barcode }}
        </p>
      </div>
      <div class="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 mt-2"></div>
    </div>

    <div class="space-y-2 mb-4">
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-600">Unit Price</span>
        <span class="font-semibold text-gray-800"
          >${{ item.product.price }}</span
        >
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-600">In Stock</span>
        <span class="text-sm font-medium text-green-600">{{
          item.product.stock
        }}</span>
      </div>
      <div class="border-t pt-2">
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-gray-700">Subtotal</span>
          <span class="text-lg font-bold text-blue-600">${{ item.total }}</span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between bg-gray-50 rounded-xl p-3">
      <button
        type="button"
        class="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
        @click="emit('decrease', item)"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 12H4"
          />
        </svg>
      </button>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-500">Qty</span>
        <span
          class="px-4 py-2 bg-white rounded-lg font-bold text-gray-800 shadow-sm min-w-[3rem] text-center"
        >
          {{ item.quantity }}
        </span>
      </div>
      <button
        type="button"
        class="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
        @click="emit('increase', item)"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Item } from "@/types/order";

defineProps<{
  item: Item;
}>();

const emit = defineEmits<{
  (e: "increase", item: Item): void;
  (e: "decrease", item: Item): void;
}>();
</script>
