import { defineStore } from "pinia";
import { ref, computed, onMounted, onUnmounted } from "vue";

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
}

export const usePerformanceStore = defineStore("performance", () => {
  // State
  const metrics = ref<Partial<PerformanceMetrics>>({});
  const isSupported = ref(false);
  const isMonitoring = ref(false);

  // Private state for observers
  const observers = ref<(PerformanceObserver | NodeJS.Timeout)[]>([]);

  // Getters (computed)
  const performanceGrade = computed(() => {
    const m = metrics.value;
    if (!m.loadTime) return "Unknown";

    let score = 100;

    // Load time scoring (target: < 2s)
    if (m.loadTime > 5000) score -= 30;
    else if (m.loadTime > 3000) score -= 20;
    else if (m.loadTime > 2000) score -= 10;

    // FCP scoring (target: < 1.8s)
    if (m.firstContentfulPaint && m.firstContentfulPaint > 3000) score -= 20;
    else if (m.firstContentfulPaint && m.firstContentfulPaint > 1800)
      score -= 10;

    // LCP scoring (target: < 2.5s)
    if (m.largestContentfulPaint && m.largestContentfulPaint > 4000)
      score -= 20;
    else if (m.largestContentfulPaint && m.largestContentfulPaint > 2500)
      score -= 10;

    // FID scoring (target: < 100ms)
    if (m.firstInputDelay && m.firstInputDelay > 300) score -= 15;
    else if (m.firstInputDelay && m.firstInputDelay > 100) score -= 8;

    // CLS scoring (target: < 0.1)
    if (m.cumulativeLayoutShift && m.cumulativeLayoutShift > 0.25) score -= 15;
    else if (m.cumulativeLayoutShift && m.cumulativeLayoutShift > 0.1)
      score -= 8;

    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    return "Poor";
  });

  const hasMemoryPressure = computed(() => {
    if (!metrics.value.memoryUsage) return false;
    const { used, limit } = metrics.value.memoryUsage;
    return used / limit > 0.8; // 80% memory usage threshold
  });

  const exportData = computed(() => ({
    ...metrics.value,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    grade: performanceGrade.value,
    memoryPressure: hasMemoryPressure.value,
  }));

  // Actions
  const collectBasicMetrics = () => {
    if (!window.performance) return;

    const timing = window.performance.timing;
    const navigation = window.performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;

    metrics.value = {
      ...metrics.value,
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded:
        timing.domContentLoadedEventEnd - timing.navigationStart,
    };

    // Modern metrics using Navigation Timing API Level 2
    if (navigation) {
      metrics.value.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      metrics.value.domContentLoaded =
        navigation.domContentLoadedEventEnd - navigation.fetchStart;
    }
  };

  const collectPaintMetrics = () => {
    if (!window.PerformanceObserver) return;

    const paintObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.name === "first-paint") {
          metrics.value.firstPaint = entry.startTime;
        } else if (entry.name === "first-contentful-paint") {
          metrics.value.firstContentfulPaint = entry.startTime;
        }
      }
    });

    try {
      paintObserver.observe({ entryTypes: ["paint"] });
      observers.value.push(paintObserver);
    } catch {
      console.warn("Paint metrics not supported");
    }
  };

  const collectWebVitals = () => {
    if (!window.PerformanceObserver) return;

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.value.largestContentfulPaint = lastEntry.startTime;
    });

    try {
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      observers.value.push(lcpObserver);
    } catch {
      console.warn("LCP metrics not supported");
    }

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const fidEntry = entry as PerformanceEventTiming;
        if (fidEntry.processingStart && fidEntry.startTime) {
          metrics.value.firstInputDelay =
            fidEntry.processingStart - fidEntry.startTime;
        }
      }
    });

    try {
      fidObserver.observe({ entryTypes: ["first-input"] });
      observers.value.push(fidObserver);
    } catch {
      console.warn("FID metrics not supported");
    }

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const layoutShiftEntry = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value || 0;
          metrics.value.cumulativeLayoutShift = clsValue;
        }
      }
    });

    try {
      clsObserver.observe({ entryTypes: ["layout-shift"] });
      observers.value.push(clsObserver);
    } catch {
      console.warn("CLS metrics not supported");
    }
  };

  const collectMemoryMetrics = () => {
    if ("memory" in performance) {
      const memory = (
        performance as Performance & {
          memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        }
      ).memory;
      if (memory) {
        metrics.value.memoryUsage = {
          used: Math.round(memory.usedJSHeapSize),
          total: Math.round(memory.totalJSHeapSize),
          limit: Math.round(memory.jsHeapSizeLimit),
        };
      }
    }
  };

  const startMonitoring = () => {
    if (!window.performance) {
      console.warn("Performance API not supported");
      return;
    }

    if (isMonitoring.value) return;

    isSupported.value = true;
    isMonitoring.value = true;

    // Collect initial metrics
    setTimeout(collectBasicMetrics, 0);

    // Collect paint metrics
    collectPaintMetrics();

    // Collect Web Vitals
    collectWebVitals();

    // Collect memory metrics periodically
    collectMemoryMetrics();
    const memoryInterval = setInterval(collectMemoryMetrics, 30000); // Every 30 seconds
    observers.value.push(memoryInterval);
  };

  const stopMonitoring = () => {
    if (!isMonitoring.value) return;

    isMonitoring.value = false;

    // Clean up all observers and intervals
    observers.value.forEach((observer) => {
      if (typeof observer === "object" && "disconnect" in observer) {
        observer.disconnect();
      } else {
        clearInterval(observer as NodeJS.Timeout);
      }
    });

    observers.value = [];
  };

  const resetMetrics = () => {
    metrics.value = {};
  };

  const updateMetric = <K extends keyof PerformanceMetrics>(
    key: K,
    value: PerformanceMetrics[K],
  ) => {
    (metrics.value as PerformanceMetrics)[key] = value;
  };

  // Initialize monitoring when store is created
  const initialize = () => {
    startMonitoring();
  };

  return {
    // State
    metrics,
    isSupported,
    isMonitoring,

    // Getters
    performanceGrade,
    hasMemoryPressure,
    exportData,

    // Actions
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    updateMetric,
    collectMemoryMetrics,
    initialize,
  };
});

// Auto-start monitoring when the store is first used
let initialized = false;
export const usePerformanceStoreWithAutoStart = () => {
  const store = usePerformanceStore();

  if (!initialized) {
    initialized = true;

    // Use Vue lifecycle hooks to manage monitoring
    onMounted(() => {
      store.initialize();
    });

    onUnmounted(() => {
      store.stopMonitoring();
    });
  }

  return store;
};
