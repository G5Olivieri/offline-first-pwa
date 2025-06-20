import { defineStore } from "pinia";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { SYNCING } from "@/db";

export const useOnlineStatusStore = defineStore("onlineStatus", () => {
  const isOnline = ref(navigator.onLine);
  const isSyncEnabled = ref(SYNCING);

  const isFullyOnline = computed(() => isSyncEnabled.value && isOnline.value);

  const connectionStatus = computed(() => {
    if (!isSyncEnabled.value) return "sync-disabled";
    return isOnline.value ? "online" : "offline";
  });

  const setSyncEnabled = (enabled: boolean) => {
    isSyncEnabled.value = enabled;
  };

  const getConnectionInfo = () => ({
    isOnline: isOnline.value,
    isSyncEnabled: isSyncEnabled.value,
    isFullyOnline: isFullyOnline.value,
    status: connectionStatus.value,
  });

  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine;
  };

  // Initialize listeners
  const initializeListeners = () => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  };

  const cleanupListeners = () => {
    window.removeEventListener("online", updateOnlineStatus);
    window.removeEventListener("offline", updateOnlineStatus);
  };

  onMounted(() => {
    initializeListeners();
  });

  onUnmounted(() => {
    cleanupListeners();
  });

  return {
    // State
    isOnline,
    isSyncEnabled,

    // Getters
    isFullyOnline,
    connectionStatus,

    // Actions
    updateOnlineStatus,
    setSyncEnabled,
    getConnectionInfo,
    initializeListeners,
    cleanupListeners,
  };
});
