<template>
  <div class="animate-pulse">
    <div v-if="type === 'product-card'" class="space-y-3">
      <div
        class="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"
      ></div>
      <div class="space-y-2">
        <div
          class="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4"
        ></div>
        <div
          class="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"
        ></div>
        <div
          class="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3"
        ></div>
      </div>
    </div>

    <div
      v-else-if="type === 'order-item'"
      class="flex items-center space-x-4 p-4"
    >
      <div
        class="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"
      ></div>
      <div class="flex-1 space-y-2">
        <div
          class="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"
        ></div>
        <div
          class="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3"
        ></div>
      </div>
      <div
        class="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-16"
      ></div>
    </div>

    <div v-else-if="type === 'customer-card'" class="space-y-3 p-4">
      <div class="flex items-center space-x-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"
        ></div>
        <div class="flex-1 space-y-2">
          <div
            class="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3"
          ></div>
          <div
            class="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"
          ></div>
        </div>
      </div>
      <div class="space-y-2">
        <div
          class="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full"
        ></div>
        <div
          class="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4"
        ></div>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div
        class="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full"
      ></div>
      <div
        class="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4"
      ></div>
      <div
        class="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: "default" | "product-card" | "order-item" | "customer-card";
}

withDefaults(defineProps<Props>(), {
  type: "default",
});
</script>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.animate-pulse > div {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
</style>
