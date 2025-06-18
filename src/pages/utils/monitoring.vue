<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">System Monitoring</h1>
            <p class="text-gray-600 mt-1">Real-time system health and performance metrics</p>
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh' }}</span>
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
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">System Status</p>
              <p class="text-2xl font-bold" :class="systemStatus.color">
                {{ systemStatus.text }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-full flex items-center justify-center" :class="systemStatus.bgColor">
              <div class="w-6 h-6 rounded-full" :class="systemStatus.dotColor"></div>
            </div>
          </div>
        </div>

        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Database</p>
              <p class="text-2xl font-bold" :class="dbStatus.color">
                {{ dbStatus.text }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-full flex items-center justify-center" :class="dbStatus.bgColor">
              <svg class="w-6 h-6" :class="dbStatus.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Performance</p>
              <p class="text-2xl font-bold" :class="performanceGrade.color">
                {{ performanceGrade.text }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-full flex items-center justify-center" :class="performanceGrade.bgColor">
              <svg class="w-6 h-6" :class="performanceGrade.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Memory Usage</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ memoryUsage.percentage }}%
              </p>
            </div>
            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div class="space-y-4">
            <div v-for="metric in performanceMetrics" :key="metric.label" class="flex items-center justify-between">
              <span class="text-sm text-gray-600">{{ metric.label }}</span>
              <span class="font-medium" :class="metric.color">{{ metric.value }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          <div class="space-y-4">
            <div v-for="info in systemInfo" :key="info.label" class="flex items-center justify-between">
              <span class="text-sm text-gray-600">{{ info.label }}</span>
              <span class="font-medium text-gray-900">{{ info.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Log -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Recent Errors</h3>
          <button
            @click="clearErrors"
            class="text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            Clear All
          </button>
        </div>

        <div v-if="errors.length === 0" class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No errors recorded</p>
        </div>

        <div v-else class="space-y-3 max-h-80 overflow-y-auto">
          <div
            v-for="error in errors.slice(-10)"
            :key="error.id"
            class="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-sm font-medium text-red-800">{{ error.type }}</span>
                  <span class="text-xs text-red-600">{{ error.timestamp.toLocaleString() }}</span>
                </div>
                <p class="text-sm text-red-700 mb-2">{{ error.message }}</p>
                <details v-if="error.stack" class="text-xs">
                  <summary class="cursor-pointer text-red-600 hover:text-red-700">Stack Trace</summary>
                  <pre class="mt-2 text-red-600 whitespace-pre-wrap">{{ error.stack }}</pre>
                </details>
              </div>
              <button
                @click="removeError(error.id)"
                class="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useOnlineStatusStore } from '../../stores/online-status-store'
import { usePerformanceMonitoring } from '../../composables/use-performance-monitoring'
import { useSystemInfo } from '../../composables/use-system-info'

interface ErrorLog {
  id: string
  type: string
  message: string
  stack?: string
  timestamp: Date
}

const onlineStore = useOnlineStatusStore()
const { metrics, getPerformanceGrade } = usePerformanceMonitoring()
const { systemInfo: sysInfo } = useSystemInfo()

const lastUpdate = ref(new Date())
const isRefreshing = ref(false)
const errors = ref<ErrorLog[]>([])
let refreshInterval: number | undefined

// Computed properties for status indicators
const systemStatus = computed(() => {
  const isOnline = onlineStore.isOnline
  return {
    text: isOnline ? 'Online' : 'Offline',
    color: isOnline ? 'text-green-600' : 'text-red-600',
    bgColor: isOnline ? 'bg-green-100' : 'bg-red-100',
    dotColor: isOnline ? 'bg-green-500' : 'bg-red-500'
  }
})

const dbStatus = computed(() => {
  // This would ideally come from a database health check
  const isHealthy = onlineStore.isOnline // Simplified for demo
  return {
    text: isHealthy ? 'Connected' : 'Disconnected',
    color: isHealthy ? 'text-green-600' : 'text-red-600',
    bgColor: isHealthy ? 'bg-green-100' : 'bg-red-100',
    iconColor: isHealthy ? 'text-green-600' : 'text-red-600'
  }
})

const performanceGrade = computed(() => {
  const grade = getPerformanceGrade()
  const gradeConfig = {
    'Excellent': { color: 'text-green-600', bgColor: 'bg-green-100', iconColor: 'text-green-600' },
    'Good': { color: 'text-blue-600', bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
    'Fair': { color: 'text-yellow-600', bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    'Poor': { color: 'text-red-600', bgColor: 'bg-red-100', iconColor: 'text-red-600' }
  }

  return {
    text: grade,
    ...gradeConfig[grade as keyof typeof gradeConfig] || gradeConfig.Poor
  }
})

const memoryUsage = computed(() => {
  const memory = metrics.value.memoryUsage
  if (!memory) return { percentage: 0, used: 0, total: 0 }

  const percentage = Math.round((memory.used / memory.total) * 100)
  return {
    percentage,
    used: memory.used,
    total: memory.total
  }
})

const performanceMetrics = computed(() => {
  const m = metrics.value
  const formatTime = (time: number | undefined) => time ? `${Math.round(time)}ms` : 'N/A'

  return [
    {
      label: 'Load Time',
      value: formatTime(m.loadTime),
      color: m.loadTime && m.loadTime < 2000 ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'First Contentful Paint',
      value: formatTime(m.firstContentfulPaint),
      color: m.firstContentfulPaint && m.firstContentfulPaint < 1800 ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'Largest Contentful Paint',
      value: formatTime(m.largestContentfulPaint),
      color: m.largestContentfulPaint && m.largestContentfulPaint < 2500 ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'First Input Delay',
      value: formatTime(m.firstInputDelay),
      color: m.firstInputDelay && m.firstInputDelay < 100 ? 'text-green-600' : 'text-red-600'
    }
  ]
})

const systemInfo = computed(() => [
  { label: 'App Version', value: sysInfo.value.appVersion },
  { label: 'Environment', value: sysInfo.value.environment },
  { label: 'Browser', value: sysInfo.value.userAgent?.split(' ')[0] || 'Unknown' },
  { label: 'Screen', value: `${sysInfo.value.screen.width}x${sysInfo.value.screen.height}` }
])

// Methods
const refreshData = async () => {
  isRefreshing.value = true

  // Simulate data refresh
  await new Promise(resolve => setTimeout(resolve, 1000))

  lastUpdate.value = new Date()
  isRefreshing.value = false
}

const clearErrors = () => {
  errors.value = []
}

const removeError = (id: string) => {
  const index = errors.value.findIndex(error => error.id === id)
  if (index > -1) {
    errors.value.splice(index, 1)
  }
}

const addError = (error: Error) => {
  errors.value.push({
    id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date()
  })
}

// Lifecycle
onMounted(() => {
  // Start auto-refresh
  refreshInterval = setInterval(() => {
    if (!isRefreshing.value) {
      lastUpdate.value = new Date()
    }
  }, 30000) // Every 30 seconds

  // Listen for global errors
  window.addEventListener('error', (event) => {
    addError(event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    addError(new Error(`Unhandled Promise Rejection: ${event.reason}`))
  })
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
