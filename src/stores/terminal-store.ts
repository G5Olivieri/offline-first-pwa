import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { config } from "@/config/env";

export interface TerminalInfo {
  id: string;
  name: string;
  location?: string;
  status: "active" | "inactive" | "maintenance";
  lastActiveAt: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
  };
}

export const useTerminalStore = defineStore("terminalStore", () => {
  const terminalInfo = ref<TerminalInfo>({
    id: config.terminalId,
    name: config.terminalName,
    location: localStorage.getItem("terminalLocation") || undefined,
    status: "active",
    lastActiveAt: new Date().toISOString(),
    deviceInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const terminalId = computed(() => terminalInfo.value.id);
  const terminalName = computed(() => terminalInfo.value.name);
  const terminalLocation = computed(() => terminalInfo.value.location);
  const terminalStatus = computed(() => terminalInfo.value.status);

  const updateTerminalName = (name: string) => {
    terminalInfo.value.name = name;
    localStorage.setItem("terminalName", name);
  };

  const updateTerminalLocation = (location: string) => {
    terminalInfo.value.location = location;
    localStorage.setItem("terminalLocation", location);
  };

  const updateTerminalStatus = (status: TerminalInfo["status"]) => {
    terminalInfo.value.status = status;
    terminalInfo.value.lastActiveAt = new Date().toISOString();
  };

  const updateLastActiveTime = () => {
    terminalInfo.value.lastActiveAt = new Date().toISOString();
  };

  const getTerminalInfo = (): TerminalInfo => {
    return { ...terminalInfo.value };
  };

  const resetTerminalId = () => {
    localStorage.removeItem("terminalId");
    localStorage.removeItem("terminalName");
    localStorage.removeItem("terminalLocation");
    // Reload the page to regenerate terminal ID
    window.location.reload();
  };

  // Load persisted terminal info on initialization
  const loadPersistedData = () => {
    const savedName = localStorage.getItem("terminalName");
    const savedLocation = localStorage.getItem("terminalLocation");

    if (savedName) {
      terminalInfo.value.name = savedName;
    }
    if (savedLocation) {
      terminalInfo.value.location = savedLocation;
    }
  };

  // Initialize persisted data
  loadPersistedData();

  // Update last active time periodically
  setInterval(updateLastActiveTime, 60000); // Update every minute

  return {
    terminalInfo: computed(() => terminalInfo.value),
    terminalId,
    terminalName,
    terminalLocation,
    terminalStatus,
    updateTerminalName,
    updateTerminalLocation,
    updateTerminalStatus,
    updateLastActiveTime,
    getTerminalInfo,
    resetTerminalId,
  };
});
