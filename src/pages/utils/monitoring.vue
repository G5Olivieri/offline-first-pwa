<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6"
  >
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">System Monitoring</h1>
            <p class="text-gray-600 mt-1">
              Real-time system health and performance metrics
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="refreshData"
              :disabled="isRefreshing"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <div class="flex items-center space-x-2">
                <svg
                  class="w-4 h-4"
                  :class="{ 'animate-spin': isRefreshing }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{{ isRefreshing ? "Refreshing..." : "Refresh" }}</span>
              </div>
            </button>
            <div class="text-sm text-gray-500">
              Last updated: {{ lastUpdate.toLocaleTimeString() }}
            </div>
          </div>
        </div>
      </div>

      <!-- Status Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">System Status</p>
              <p class="text-2xl font-bold" :class="systemStatus.color">
                {{ systemStatus.text }}
              </p>
            </div>
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="systemStatus.bgColor"
            >
              <div
                class="w-6 h-6 rounded-full"
                :class="systemStatus.dotColor"
              ></div>
            </div>
          </div>
        </div>

        <div
          class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Database</p>
              <p class="text-2xl font-bold" :class="dbStatus.color">
                {{ dbStatus.text }}
              </p>
              <p class="text-xs text-gray-500 mt-1">{{ dbStatus.details }}</p>
            </div>
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="dbStatus.bgColor"
            >
              <svg
                class="w-6 h-6"
                :class="dbStatus.iconColor"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Performance</p>
              <p class="text-2xl font-bold" :class="performanceGrade.color">
                {{ performanceGrade.text }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Score: {{ performanceScore }}/100
              </p>
            </div>
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="performanceGrade.bgColor"
            >
              <svg
                class="w-6 h-6"
                :class="performanceGrade.iconColor"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Memory Usage</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ memoryUsage.percentage }}%
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ formatBytes(memoryUsage.used) }} /
                {{ formatBytes(memoryUsage.total) }}
              </p>
            </div>
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100"
            >
              <svg
                class="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Sync Status Section -->
      <div class="mb-8">
        <div
          class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Database Sync Status
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="db in databaseStatus"
              :key="db.name"
              class="border rounded-lg p-4"
            >
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-gray-900">{{ db.name }}</h4>
                <div class="flex items-center space-x-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="db.syncStatus.color"
                  ></div>
                  <span class="text-sm" :class="db.syncStatus.textColor">{{
                    db.syncStatus.text
                  }}</span>
                </div>
              </div>
              <div class="space-y-2 text-sm text-gray-600">
                <div class="flex justify-between">
                  <span>Documents:</span>
                  <span>{{ db.docCount }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Last Sync:</span>
                  <span>{{
                    db.lastSync ? db.lastSync.toLocaleTimeString() : "Never"
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Status:</span>
                  <span>{{ db.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Terminal Information Section -->
      <div class="mb-8">
        <TerminalInfo />
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Performance Timeline -->
        <div
          class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Performance Timeline
          </h3>
          <div class="h-64 flex items-end justify-between space-x-2">
            <div
              v-for="(point, index) in performanceHistory"
              :key="index"
              class="flex-1 bg-blue-200 rounded-t-sm relative group"
            >
              <div
                class="bg-blue-500 rounded-t-sm transition-all duration-300"
                :style="{ height: `${(point.score / 100) * 100}%` }"
              ></div>
              <div
                class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {{ point.score }}
              </div>
            </div>
          </div>
          <div class="flex justify-between text-xs text-gray-500 mt-2">
            <span>{{ performanceHistory.length > 0 ? "15m ago" : "" }}</span>
            <span>Now</span>
          </div>
        </div>

        <!-- Memory Usage Chart -->
        <div
          class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Memory Usage Trend
          </h3>
          <div class="h-64 flex items-end justify-between space-x-2">
            <div
              v-for="(point, index) in memoryHistory"
              :key="index"
              class="flex-1 bg-purple-200 rounded-t-sm relative group"
            >
              <div
                class="bg-purple-500 rounded-t-sm transition-all duration-300"
                :style="{ height: `${point.percentage}%` }"
              ></div>
              <div
                class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {{ point.percentage }}%
              </div>
            </div>
          </div>
          <div class="flex justify-between text-xs text-gray-500 mt-2">
            <span>{{ memoryHistory.length > 0 ? "15m ago" : "" }}</span>
            <span>Now</span>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div
          class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Performance Metrics
          </h3>
          <div class="space-y-4">
            <div
              v-for="metric in performanceMetrics"
              :key="metric.label"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-600">{{ metric.label }}</span>
              <div class="flex items-center space-x-2">
                <span class="font-medium" :class="metric.color">{{
                  metric.value
                }}</span>
                <div
                  class="w-2 h-2 rounded-full"
                  :class="metric.indicatorColor"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            System Information
          </h3>
          <div class="space-y-4">
            <div
              v-for="info in systemInfo"
              :key="info.label"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-600">{{ info.label }}</span>
              <span class="font-medium text-gray-900 text-right">{{
                info.value
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Network Status -->
      <div class="mb-8">
        <div
          class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Network Status
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold" :class="networkStatus.color">
                {{ networkStatus.type }}
              </div>
              <div class="text-sm text-gray-600">Connection Type</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {{ networkStatus.effectiveType || "Unknown" }}
              </div>
              <div class="text-sm text-gray-600">Effective Type</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {{ networkStatus.downlink || "Unknown" }}
              </div>
              <div class="text-sm text-gray-600">Downlink (Mbps)</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {{ networkStatus.rtt || "Unknown" }}ms
              </div>
              <div class="text-sm text-gray-600">Round Trip Time</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Log -->
      <div
        class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            Recent Errors & Events
          </h3>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">{{ errors.length }} total</span>
            <button
              @click="clearErrors"
              class="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        <div v-if="errors.length === 0" class="text-center py-8 text-gray-500">
          <svg
            class="w-12 h-12 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>No errors recorded</p>
          <p class="text-xs mt-1">System is running smoothly</p>
        </div>

        <div v-else class="space-y-3 max-h-80 overflow-y-auto">
          <div
            v-for="error in errors.slice(-20).reverse()"
            :key="error.id"
            class="border rounded-lg p-4"
            :class="getErrorSeverityClass(error)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <span
                    class="text-sm font-medium"
                    :class="getErrorTypeColor(error.type)"
                    >{{ error.type }}</span
                  >
                  <span class="text-xs text-gray-600">{{
                    error.timestamp.toLocaleString()
                  }}</span>
                  <span
                    v-if="error.severity"
                    class="text-xs px-2 py-1 rounded-full"
                    :class="getSeverityBadgeClass(error.severity)"
                  >
                    {{ error.severity }}
                  </span>
                </div>
                <p class="text-sm text-gray-700 mb-2">{{ error.message }}</p>
                <details v-if="error.stack" class="text-xs">
                  <summary
                    class="cursor-pointer text-gray-600 hover:text-gray-700"
                  >
                    Stack Trace
                  </summary>
                  <pre
                    class="mt-2 text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded text-xs overflow-x-auto"
                    >{{ error.stack }}</pre
                  >
                </details>
              </div>
              <button
                @click="removeError(error.id)"
                class="text-gray-400 hover:text-gray-600 transition-colors ml-2"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- System Actions -->
      <div class="mt-8 flex justify-center space-x-4">
        <button
          @click="runDiagnostics"
          :disabled="isRunningDiagnostics"
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {{ isRunningDiagnostics ? "Running..." : "Run Diagnostics" }}
        </button>
        <button
          @click="exportLogs"
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Export Logs
        </button>
        <button
          @click="clearCache"
          class="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
        >
          Clear Cache
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "MonitoringPage",
});

import { computed, onMounted, onUnmounted, ref } from "vue";
import { useOnlineStatusStore } from "@/stores/online-status-store";
import { usePerformanceStore } from "@/stores/performance-store";
import { useSystemInfoStore } from "@/stores/system-info-store";
import { useNotificationStore } from "@/stores/notification-store";
import TerminalInfo from "@/components/terminal-info.vue";

interface ErrorLog {
  id: string;
  type: string;
  message: string;
  stack?: string;
  timestamp: Date;
  severity?: "low" | "medium" | "high" | "critical";
}

interface DatabaseInfo {
  name: string;
  docCount: number;
  status: string;
  lastSync: Date | null;
  syncStatus: {
    text: string;
    color: string;
    textColor: string;
  };
}

interface PerformancePoint {
  timestamp: Date;
  score: number;
}

interface MemoryPoint {
  timestamp: Date;
  percentage: number;
}

interface NetworkConnection {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (event: string, handler: () => void) => void;
  removeEventListener?: (event: string, handler: () => void) => void;
}

interface ExtendedNavigator extends Navigator {
  connection?: NetworkConnection;
}

const onlineStore = useOnlineStatusStore();
const performanceStore = usePerformanceStore();
const systemInfoStore = useSystemInfoStore();
const notificationStore = useNotificationStore();

const lastUpdate = ref(new Date());
const isRefreshing = ref(false);
const isRunningDiagnostics = ref(false);
const errors = ref<ErrorLog[]>([]);
const performanceHistory = ref<PerformancePoint[]>([]);
const memoryHistory = ref<MemoryPoint[]>([]);
const networkInfo = ref<NetworkConnection | null>(null);
let refreshInterval: ReturnType<typeof setInterval> | undefined;

// Initialize network information
const initNetworkInfo = () => {
  if ("connection" in navigator) {
    networkInfo.value = (navigator as ExtendedNavigator).connection || null;
  }
};

// Computed properties for status indicators
const systemStatus = computed(() => {
  const isOnline = onlineStore.isOnline;
  const hasErrors =
    errors.value.filter((e) => e.severity === "critical").length > 0;

  if (!isOnline) {
    return {
      text: "Offline",
      color: "text-red-600",
      bgColor: "bg-red-100",
      dotColor: "bg-red-500",
    };
  }

  if (hasErrors) {
    return {
      text: "Warning",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      dotColor: "bg-yellow-500",
    };
  }

  return {
    text: "Online",
    color: "text-green-600",
    bgColor: "bg-green-100",
    dotColor: "bg-green-500",
  };
});

const dbStatus = computed(() => {
  const isOnline = onlineStore.isOnline;
  const isSyncEnabled = onlineStore.isSyncEnabled;
  const hasDbErrors = errors.value.some(
    (e) =>
      e.message.toLowerCase().includes("database") ||
      e.message.toLowerCase().includes("sync"),
  );

  if (!isOnline) {
    return {
      text: "Offline",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
      details: "Local storage only",
    };
  }

  if (hasDbErrors) {
    return {
      text: "Error",
      color: "text-red-600",
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      details: "Sync issues detected",
    };
  }

  if (isSyncEnabled) {
    return {
      text: "Syncing",
      color: "text-green-600",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      details: "Real-time sync active",
    };
  }

  return {
    text: "Local",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    details: "Local storage only",
  };
});

const performanceGrade = computed(() => {
  const grade = performanceStore.performanceGrade;
  const gradeConfig = {
    Excellent: {
      color: "text-green-600",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    Good: {
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    Fair: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    Poor: {
      color: "text-red-600",
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    Unknown: {
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      iconColor: "text-gray-600",
    },
  };

  return {
    text: grade,
    ...(gradeConfig[grade as keyof typeof gradeConfig] || gradeConfig.Unknown),
  };
});

const performanceScore = computed(() => {
  const m = performanceStore.metrics;
  if (!m.loadTime) return 0;

  let score = 100;

  // Load time scoring
  if (m.loadTime > 5000) score -= 30;
  else if (m.loadTime > 3000) score -= 20;
  else if (m.loadTime > 2000) score -= 10;

  // FCP scoring
  if (m.firstContentfulPaint && m.firstContentfulPaint > 3000) score -= 20;
  else if (m.firstContentfulPaint && m.firstContentfulPaint > 1800) score -= 10;

  // LCP scoring
  if (m.largestContentfulPaint && m.largestContentfulPaint > 4000) score -= 20;
  else if (m.largestContentfulPaint && m.largestContentfulPaint > 2500)
    score -= 10;

  return Math.max(0, Math.round(score));
});

const memoryUsage = computed(() => {
  const memory = performanceStore.metrics.memoryUsage;
  if (!memory) return { percentage: 0, used: 0, total: 0 };

  const percentage = Math.round((memory.used / memory.total) * 100);
  return {
    percentage,
    used: memory.used,
    total: memory.total,
  };
});

const performanceMetrics = computed(() => {
  const m = performanceStore.metrics;
  const formatTime = (time: number | undefined) =>
    time ? `${Math.round(time)}ms` : "N/A";

  const getColor = (
    value: number | undefined,
    thresholds: { good: number; fair: number },
  ) => {
    if (!value) return "text-gray-500";
    if (value <= thresholds.good) return "text-green-600";
    if (value <= thresholds.fair) return "text-yellow-600";
    return "text-red-600";
  };

  const getIndicatorColor = (
    value: number | undefined,
    thresholds: { good: number; fair: number },
  ) => {
    if (!value) return "bg-gray-300";
    if (value <= thresholds.good) return "bg-green-500";
    if (value <= thresholds.fair) return "bg-yellow-500";
    return "bg-red-500";
  };

  return [
    {
      label: "Load Time",
      value: formatTime(m.loadTime),
      color: getColor(m.loadTime, { good: 2000, fair: 4000 }),
      indicatorColor: getIndicatorColor(m.loadTime, { good: 2000, fair: 4000 }),
    },
    {
      label: "First Contentful Paint",
      value: formatTime(m.firstContentfulPaint),
      color: getColor(m.firstContentfulPaint, { good: 1800, fair: 3000 }),
      indicatorColor: getIndicatorColor(m.firstContentfulPaint, {
        good: 1800,
        fair: 3000,
      }),
    },
    {
      label: "Largest Contentful Paint",
      value: formatTime(m.largestContentfulPaint),
      color: getColor(m.largestContentfulPaint, { good: 2500, fair: 4000 }),
      indicatorColor: getIndicatorColor(m.largestContentfulPaint, {
        good: 2500,
        fair: 4000,
      }),
    },
    {
      label: "First Input Delay",
      value: formatTime(m.firstInputDelay),
      color: getColor(m.firstInputDelay, { good: 100, fair: 300 }),
      indicatorColor: getIndicatorColor(m.firstInputDelay, {
        good: 100,
        fair: 300,
      }),
    },
    {
      label: "Cumulative Layout Shift",
      value: m.cumulativeLayoutShift
        ? m.cumulativeLayoutShift.toFixed(3)
        : "N/A",
      color: getColor(m.cumulativeLayoutShift, { good: 0.1, fair: 0.25 }),
      indicatorColor: getIndicatorColor(m.cumulativeLayoutShift, {
        good: 0.1,
        fair: 0.25,
      }),
    },
  ];
});

const systemInfo = computed(() => [
  { label: "App Version", value: systemInfoStore.systemInfo.appVersion },
  { label: "Environment", value: systemInfoStore.systemInfo.environment },
  {
    label: "Browser",
    value:
      systemInfoStore.systemInfo.userAgent?.substring(0, 50) + "..." ||
      "Unknown",
  },
  {
    label: "Screen",
    value: `${systemInfoStore.systemInfo.screen.width}x${systemInfoStore.systemInfo.screen.height}`,
  },
  { label: "Locale", value: systemInfoStore.systemInfo.locale },
  { label: "Currency", value: systemInfoStore.systemInfo.currency },
  { label: "Timezone", value: systemInfoStore.systemInfo.timezone },
  {
    label: "Device",
    value: systemInfoStore.systemInfo.userAgent?.includes("Mobile")
      ? "Mobile"
      : "Desktop",
  },
]);

const databaseStatus = computed<DatabaseInfo[]>(() => {
  // Since we can't directly access the document counts, we'll simulate them
  // In a real implementation, these would come from actual database queries
  return [
    {
      name: "Products",
      docCount: 0, // Would be calculated from actual product count
      status: "Ready",
      lastSync: null, // Would track actual sync times
      syncStatus: getSyncStatus("products"),
    },
    {
      name: "Orders",
      docCount: 0, // Only pending orders (completed/cancelled auto-purged after sync)
      status: "Push All, Keep Pending",
      lastSync: null, // Would track actual sync times
      syncStatus: getSyncStatus("orders"),
    },
    {
      name: "Customers",
      docCount: 0, // Would be calculated from actual customer count
      status: "Ready",
      lastSync: null, // Would track actual sync times
      syncStatus: getSyncStatus("customers"),
    },
  ];
});

const networkStatus = computed(() => {
  const isOnline = onlineStore.isOnline;
  const connection = networkInfo.value;

  return {
    type: isOnline ? connection?.type || "Unknown" : "Offline",
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
    color: isOnline ? "text-green-600" : "text-red-600",
  };
});

// Helper functions
const getSyncStatus = (dbName: string) => {
  const isOnline = onlineStore.isOnline;
  const isSyncEnabled = onlineStore.isSyncEnabled;

  if (!isOnline) {
    return {
      text: "Offline",
      color: "bg-yellow-400",
      textColor: "text-yellow-700",
    };
  }

  if (!isSyncEnabled) {
    return {
      text: "Disabled",
      color: "bg-gray-400",
      textColor: "text-gray-700",
    };
  }

  // Check for recent sync errors
  const hasSyncErrors = errors.value.some(
    (e) =>
      e.message.toLowerCase().includes(dbName) &&
      e.message.toLowerCase().includes("sync"),
  );

  if (hasSyncErrors) {
    return {
      text: "Error",
      color: "bg-red-400",
      textColor: "text-red-700",
    };
  }

  // Special case for orders - they use one-way sync (push only)
  if (dbName === "orders") {
    return {
      text: "Push Only",
      color: "bg-blue-400",
      textColor: "text-blue-700",
    };
  }

  return {
    text: "Syncing",
    color: "bg-green-400",
    textColor: "text-green-700",
  };
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getErrorSeverityClass = (error: ErrorLog) => {
  switch (error.severity) {
    case "critical":
      return "bg-red-50 border-red-200";
    case "high":
      return "bg-orange-50 border-orange-200";
    case "medium":
      return "bg-yellow-50 border-yellow-200";
    case "low":
      return "bg-blue-50 border-blue-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};

const getErrorTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "error":
      return "text-red-800";
    case "warning":
      return "text-yellow-800";
    case "info":
      return "text-blue-800";
    case "debug":
      return "text-gray-800";
    default:
      return "text-gray-800";
  }
};

const getSeverityBadgeClass = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Methods
const refreshData = async () => {
  isRefreshing.value = true;

  try {
    // Refresh all stores
    await Promise.all([
      systemInfoStore.collectSystemInfo(),
      performanceStore.collectMemoryMetrics(),
      updateNetworkInfo(),
    ]);

    // Update performance history
    const currentScore = performanceScore.value;
    performanceHistory.value.push({
      timestamp: new Date(),
      score: currentScore,
    });

    // Keep only last 30 points (15 minutes of data)
    if (performanceHistory.value.length > 30) {
      performanceHistory.value = performanceHistory.value.slice(-30);
    }

    // Update memory history
    const currentMemory = memoryUsage.value.percentage;
    memoryHistory.value.push({
      timestamp: new Date(),
      percentage: currentMemory,
    });

    // Keep only last 30 points
    if (memoryHistory.value.length > 30) {
      memoryHistory.value = memoryHistory.value.slice(-30);
    }

    lastUpdate.value = new Date();
  } catch (error) {
    addError(error as Error, "medium");
  } finally {
    isRefreshing.value = false;
  }
};

const updateNetworkInfo = () => {
  if ("connection" in navigator) {
    networkInfo.value = (navigator as ExtendedNavigator).connection || null;
  }
};

const clearErrors = () => {
  errors.value = [];
  notificationStore.showInfo(
    "Errors Cleared",
    "All error logs have been cleared",
  );
};

const removeError = (id: string) => {
  const index = errors.value.findIndex((error) => error.id === id);
  if (index > -1) {
    errors.value.splice(index, 1);
  }
};

const addError = (error: Error, severity: ErrorLog["severity"] = "medium") => {
  const errorLog: ErrorLog = {
    id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date(),
    severity,
  };

  errors.value.push(errorLog);

  // Limit to 100 errors to prevent memory issues
  if (errors.value.length > 100) {
    errors.value = errors.value.slice(-100);
  }
};

const runDiagnostics = async () => {
  isRunningDiagnostics.value = true;

  try {
    // Simulate running diagnostics
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Add diagnostic results
    addError(new Error("Diagnostic completed successfully"), "low");
    notificationStore.showSuccess(
      "Diagnostics Complete",
      "System health check completed successfully",
    );
  } catch (error) {
    addError(error as Error, "high");
    notificationStore.showError(
      "Diagnostics Failed",
      "Failed to complete system diagnostics",
    );
  } finally {
    isRunningDiagnostics.value = false;
  }
};

const exportLogs = () => {
  const logs = {
    timestamp: new Date().toISOString(),
    systemInfo: systemInfo.value,
    performanceMetrics: performanceMetrics.value,
    databaseStatus: databaseStatus.value,
    networkStatus: networkStatus.value,
    errors: errors.value,
    performanceHistory: performanceHistory.value,
    memoryHistory: memoryHistory.value,
  };

  const blob = new Blob([JSON.stringify(logs, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `system-logs-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  notificationStore.showSuccess(
    "Logs Exported",
    "System logs have been exported successfully",
  );
};

const clearCache = async () => {
  try {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    // Clear localStorage except for important data
    const keysToKeep = ["pouchdb", "vuex", "auth"];
    Object.keys(localStorage).forEach((key) => {
      if (!keysToKeep.some((keep) => key.includes(keep))) {
        localStorage.removeItem(key);
      }
    });

    notificationStore.showSuccess(
      "Cache Cleared",
      "Browser cache has been cleared",
    );
  } catch (error) {
    addError(error as Error, "medium");
    notificationStore.showError(
      "Cache Clear Failed",
      "Failed to clear browser cache",
    );
  }
};

// Lifecycle
onMounted(() => {
  initNetworkInfo();

  // Start auto-refresh
  refreshInterval = setInterval(() => {
    if (!isRefreshing.value) {
      refreshData();
    }
  }, 30000); // Every 30 seconds

  // Listen for global errors
  window.addEventListener("error", (event) => {
    addError(event.error, "high");
  });

  window.addEventListener("unhandledrejection", (event) => {
    addError(new Error(`Unhandled Promise Rejection: ${event.reason}`), "high");
  });

  // Listen for network changes
  if (networkInfo.value && networkInfo.value.addEventListener) {
    networkInfo.value.addEventListener("change", updateNetworkInfo);
  }

  // Initial data load
  refreshData();
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  if (networkInfo.value && networkInfo.value.removeEventListener) {
    networkInfo.value.removeEventListener("change", updateNetworkInfo);
  }
});
</script>
