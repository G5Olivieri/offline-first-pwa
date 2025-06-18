import { defineStore } from "pinia";
import { onMounted, onUnmounted, ref } from "vue";
import { SYNCING } from "../db";

export const useOnlineStatusStore = defineStore("onlineStatusStore", () => {
  const isOnline = ref(SYNCING && navigator.onLine);

  const updateOnlineStatus = () => {
    isOnline.value = SYNCING && navigator.onLine;
  };

  onMounted(() => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  });

  onUnmounted(() => {
    window.removeEventListener("online", updateOnlineStatus);
    window.removeEventListener("offline", updateOnlineStatus);
  });

  return { isOnline };
});
