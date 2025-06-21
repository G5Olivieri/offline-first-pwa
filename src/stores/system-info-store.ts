import { config } from "@/config/env";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

// Extend navigator interface for non-standard properties
interface ExtendedNavigator extends Navigator {
  connection?: {
    type?: string;
    effectiveType?: string;
    addEventListener?: (event: string, handler: () => void) => void;
  };
  deviceMemory?: number;
}

interface SystemInfo {
  appName: string;
  appVersion: string;
  environment: string;
  buildTime: string;
  userAgent: string;
  screen: { width: number; height: number };
  connection: { type: string; effectiveType?: string };
  locale: string;
  currency: string;
  timezone: string;
  features: {
    offlineMode: boolean;
    notifications: boolean;
    debugMode: boolean;
  };
  database: {
    url: string;
    syncEnabled: boolean;
  };
}

interface DeviceCapabilities {
  touchScreen: boolean;
  orientation: string;
  cookiesEnabled: boolean;
  language: string;
  platform: string;
  memory?: number;
  cores?: number;
}

export const useSystemInfoStore = defineStore("systemInfo", () => {
  // State
  const buildTime = ref<string>("");
  const userAgent = ref<string>("");
  const screenInfo = ref<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const connectionInfo = ref<{ type: string; effectiveType?: string }>({
    type: "unknown",
  });
  const deviceCapabilities = ref<DeviceCapabilities>({
    touchScreen: false,
    orientation: "unknown",
    cookiesEnabled: false,
    language: "en",
    platform: "unknown",
  });

  // Getters
  const systemInfo = computed<SystemInfo>(() => ({
    appName: config.appTitle,
    appVersion: config.appVersion,
    environment: config.environment,
    buildTime: buildTime.value,
    userAgent: userAgent.value,
    screen: screenInfo.value,
    connection: connectionInfo.value,
    locale: config.defaultLocale,
    currency: config.defaultCurrency,
    timezone: config.defaultTimezone,
    features: {
      offlineMode: config.enableOfflineMode,
      notifications: config.enableNotifications,
      debugMode: config.enableDebugMode,
    },
    database: {
      url: config.couchdbUrl,
      syncEnabled: config.enableSync,
    },
  }));

  const formattedBuildTime = computed(() => {
    if (!buildTime.value) return "Unknown";
    try {
      return new Date(buildTime.value).toLocaleString();
    } catch {
      return "Invalid Date";
    }
  });

  const browserInfo = computed(() => {
    const ua = userAgent.value;
    if (!ua) return { name: "Unknown Browser", version: "Unknown" };

    let name = "Unknown Browser";
    let version = "Unknown";

    if (ua.includes("Chrome")) {
      name = "Chrome";
      const match = ua.match(/Chrome\/(\d+)/);
      if (match) version = match[1];
    } else if (ua.includes("Firefox")) {
      name = "Firefox";
      const match = ua.match(/Firefox\/(\d+)/);
      if (match) version = match[1];
    } else if (ua.includes("Safari")) {
      name = "Safari";
      const match = ua.match(/Version\/(\d+)/);
      if (match) version = match[1];
    } else if (ua.includes("Edge")) {
      name = "Edge";
      const match = ua.match(/Edge\/(\d+)/);
      if (match) version = match[1];
    }

    return { name, version };
  });

  const deviceInfo = computed(() => {
    const ua = userAgent.value;
    if (!ua) return { type: "Unknown Device", os: "Unknown" };

    let type = "Desktop";
    let os = "Unknown";

    if (ua.includes("Mobile")) type = "Mobile Device";
    if (ua.includes("Tablet")) type = "Tablet";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS")) os = "iOS";

    return { type, os };
  });

  const isLowEndDevice = computed(() => {
    const cores = deviceCapabilities.value.cores || 1;
    const memory = deviceCapabilities.value.memory || 1;
    return cores <= 2 || memory <= 2; // Less than 2 cores or 2GB RAM
  });

  const supportedFeatures = computed(() => ({
    serviceWorker: "serviceWorker" in navigator,
    pushNotifications: "PushManager" in window,
    backgroundSync:
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype,
    indexedDB: "indexedDB" in window,
    webGL: !!document.createElement("canvas").getContext("webgl"),
    webAssembly: "WebAssembly" in window,
    intersectionObserver: "IntersectionObserver" in window,
    resizeObserver: "ResizeObserver" in window,
    geolocation: "geolocation" in navigator,
    camera:
      "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices,
    vibration: "vibrate" in navigator,
  }));

  // Actions
  const collectSystemInfo = () => {
    // Get build time (you might want to inject this during build)
    buildTime.value = new Date().toISOString();

    // Get user agent info
    userAgent.value = navigator.userAgent;

    // Get screen info
    screenInfo.value = {
      width: window.screen.width,
      height: window.screen.height,
    };

    // Get connection info if available
    if ("connection" in navigator) {
      const conn = (navigator as ExtendedNavigator).connection;
      connectionInfo.value = {
        type: conn?.type || "unknown",
        effectiveType: conn?.effectiveType,
      };
    }

    // Get device capabilities
    deviceCapabilities.value = {
      touchScreen: "ontouchstart" in window,
      orientation: screen.orientation?.type || "unknown",
      cookiesEnabled: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform,
    };

    // Get hardware info if available
    if ("deviceMemory" in navigator) {
      deviceCapabilities.value.memory = (
        navigator as ExtendedNavigator
      ).deviceMemory;
    }
    if ("hardwareConcurrency" in navigator) {
      deviceCapabilities.value.cores = navigator.hardwareConcurrency;
    }
  };

  const updateConnectionInfo = () => {
    if ("connection" in navigator) {
      const conn = (navigator as ExtendedNavigator).connection;
      connectionInfo.value = {
        type: conn?.type || "unknown",
        effectiveType: conn?.effectiveType,
      };
    }
  };

  const exportSystemReport = () => ({
    timestamp: new Date().toISOString(),
    system: systemInfo.value,
    browser: browserInfo.value,
    device: deviceInfo.value,
    capabilities: deviceCapabilities.value,
    supportedFeatures: supportedFeatures.value,
    isLowEndDevice: isLowEndDevice.value,
  });

  const checkCompatibility = () => {
    const requiredFeatures = ["serviceWorker", "indexedDB"];
    const missing = requiredFeatures.filter(
      (feature) =>
        !supportedFeatures.value[
          feature as keyof typeof supportedFeatures.value
        ],
    );

    return {
      isCompatible: missing.length === 0,
      missingFeatures: missing,
      recommendations: missing.map((feature) => {
        switch (feature) {
          case "serviceWorker":
            return "Service Workers are required for offline functionality. Please use a modern browser.";
          case "indexedDB":
            return "IndexedDB is required for local data storage. Please enable it in your browser settings.";
          default:
            return `${feature} is not supported in your browser.`;
        }
      }),
    };
  };

  // Initialize data collection
  const initialize = () => {
    collectSystemInfo();

    // Listen for connection changes
    if ("connection" in navigator) {
      (navigator as ExtendedNavigator).connection?.addEventListener?.(
        "change",
        updateConnectionInfo,
      );
    }

    // Listen for orientation changes
    window.addEventListener("orientationchange", () => {
      deviceCapabilities.value.orientation =
        screen.orientation?.type || "unknown";
    });
  };

  return {
    // State
    buildTime,
    userAgent,
    screenInfo,
    connectionInfo,
    deviceCapabilities,

    // Getters
    systemInfo,
    formattedBuildTime,
    browserInfo,
    deviceInfo,
    isLowEndDevice,
    supportedFeatures,

    // Actions
    collectSystemInfo,
    updateConnectionInfo,
    exportSystemReport,
    checkCompatibility,
    initialize,
  };
});
