import { computed, ref, onMounted } from 'vue'
import { config } from '../config/env'

export const useSystemInfo = () => {
  const buildTime = ref<string>('')
  const userAgent = ref<string>('')
  const screenInfo = ref<{ width: number; height: number }>({ width: 0, height: 0 })
  const connectionInfo = ref<{ type: string; effectiveType?: string }>({ type: 'unknown' })

  onMounted(() => {
    // Get build time (you might want to inject this during build)
    buildTime.value = new Date().toISOString()

    // Get user agent info
    userAgent.value = navigator.userAgent

    // Get screen info
    screenInfo.value = {
      width: window.screen.width,
      height: window.screen.height
    }

    // Get connection info if available
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      connectionInfo.value = {
        type: conn.type || 'unknown',
        effectiveType: conn.effectiveType
      }
    }
  })

  const systemInfo = computed(() => ({
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
      analytics: config.enableAnalytics,
      notifications: config.enableNotifications,
      debugMode: config.enableDebugMode
    },
    database: {
      url: config.couchdbUrl,
      syncEnabled: config.enableSync
    }
  }))

  const getFormattedBuildTime = computed(() => {
    if (!buildTime.value) return 'Unknown'
    try {
      return new Date(buildTime.value).toLocaleString()
    } catch {
      return 'Invalid Date'
    }
  })

  const getBrowserInfo = computed(() => {
    const ua = userAgent.value
    if (!ua) return 'Unknown Browser'

    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'

    return 'Unknown Browser'
  })

  const getDeviceInfo = computed(() => {
    const ua = userAgent.value
    if (!ua) return 'Unknown Device'

    if (ua.includes('Mobile')) return 'Mobile Device'
    if (ua.includes('Tablet')) return 'Tablet'

    return 'Desktop'
  })

  return {
    systemInfo,
    getFormattedBuildTime,
    getBrowserInfo,
    getDeviceInfo
  }
}
