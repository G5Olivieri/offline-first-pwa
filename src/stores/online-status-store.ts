import { defineStore } from "pinia";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { SYNCING } from "../db";

export const useOnlineStatusStore = defineStore("onlineStatus", () => {
  // State
  const isOnline = ref(navigator.onLine);
  const isSyncEnabled = ref(SYNCING);
  const lastOnlineTime = ref<Date | null>(null);
  const lastOfflineTime = ref<Date | null>(null);
  const connectionHistory = ref<
    Array<{ timestamp: Date; status: "online" | "offline" }>
  >([]);

  // Getters
  const isFullyOnline = computed(() => isSyncEnabled.value && isOnline.value);

  const connectionStatus = computed(() => {
    if (!isSyncEnabled.value) return "sync-disabled";
    return isOnline.value ? "online" : "offline";
  });

  const downtime = computed(() => {
    if (isOnline.value || !lastOfflineTime.value) return 0;
    return Date.now() - lastOfflineTime.value.getTime();
  });

  const uptimePercentage = computed(() => {
    if (connectionHistory.value.length < 2) return 100;

    const last24Hours = connectionHistory.value.filter(
      (entry) => Date.now() - entry.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    if (last24Hours.length === 0) return 100;

    const onlineEntries = last24Hours.filter(
      (entry) => entry.status === "online"
    );
    return Math.round((onlineEntries.length / last24Hours.length) * 100);
  });

  // Actions
  const updateOnlineStatus = () => {
    const wasOnline = isOnline.value;
    const nowOnline = navigator.onLine;

    if (wasOnline !== nowOnline) {
      isOnline.value = nowOnline;

      // Update timestamps
      if (nowOnline) {
        lastOnlineTime.value = new Date();
      } else {
        lastOfflineTime.value = new Date();
      }

      // Add to history
      connectionHistory.value.push({
        timestamp: new Date(),
        status: nowOnline ? "online" : "offline",
      });

      // Keep only last 100 entries
      if (connectionHistory.value.length > 100) {
        connectionHistory.value = connectionHistory.value.slice(-100);
      }

      // Emit custom events for other parts of the app
      window.dispatchEvent(
        new CustomEvent("connection-status-changed", {
          detail: { isOnline: nowOnline, isSyncEnabled: isSyncEnabled.value },
        })
      );
    }
  };

  const setSyncEnabled = (enabled: boolean) => {
    isSyncEnabled.value = enabled;
    updateOnlineStatus(); // Trigger status update
  };

  const getConnectionInfo = () => ({
    isOnline: isOnline.value,
    isSyncEnabled: isSyncEnabled.value,
    isFullyOnline: isFullyOnline.value,
    status: connectionStatus.value,
    lastOnlineTime: lastOnlineTime.value,
    lastOfflineTime: lastOfflineTime.value,
    downtime: downtime.value,
    uptimePercentage: uptimePercentage.value,
    historyCount: connectionHistory.value.length,
  });

  const clearHistory = () => {
    connectionHistory.value = [];
  };

  // Initialize listeners
  const initializeListeners = () => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Initial status
    updateOnlineStatus();
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
    lastOnlineTime,
    lastOfflineTime,
    connectionHistory,

    // Getters
    isFullyOnline,
    connectionStatus,
    downtime,
    uptimePercentage,

    // Actions
    updateOnlineStatus,
    setSyncEnabled,
    getConnectionInfo,
    clearHistory,
    initializeListeners,
    cleanupListeners,
  };
});
