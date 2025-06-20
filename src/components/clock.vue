<template>
  <div
    class="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-lg px-2 py-1 text-xs"
  >
    <svg
      class="w-3 h-3 text-gray-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12,6 12,12 16,14"></polyline>
    </svg>
    <span class="font-mono font-medium text-gray-800">{{ clock }}</span>
  </div>
</template>
<script setup lang="ts">
defineOptions({
  name: "ClockComponent",
});
import { useSystemInfoStore } from "@/stores/system-info-store";
import { onMounted, onUnmounted, ref } from "vue";

const systemInfoStore = useSystemInfoStore();

const now = () =>
  new Date().toLocaleTimeString([systemInfoStore.systemInfo.locale], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const clock = ref(now());

let intervalId: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  intervalId = setInterval(() => {
    clock.value = now();
  }, 1000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>
