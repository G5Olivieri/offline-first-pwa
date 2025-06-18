import { ref, onMounted, onUnmounted } from 'vue'

interface PerformanceMetrics {
  loadTime: number
  domContentLoaded: number
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  memoryUsage?: {
    used: number
    total: number
    limit: number
  }
}

export const usePerformanceMonitoring = () => {
  const metrics = ref<Partial<PerformanceMetrics>>({})
  const isSupported = ref(false)
  const observer = ref<PerformanceObserver | null>(null)

  const collectBasicMetrics = () => {
    if (!window.performance) return

    const timing = window.performance.timing
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    metrics.value = {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    }

    // Modern metrics using Navigation Timing API Level 2
    if (navigation) {
      metrics.value.loadTime = navigation.loadEventEnd - navigation.fetchStart
      metrics.value.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
    }
  }

  const collectPaintMetrics = () => {
    if (!window.PerformanceObserver) return

    const paintObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      for (const entry of entries) {
        if (entry.name === 'first-paint') {
          metrics.value.firstPaint = entry.startTime
        } else if (entry.name === 'first-contentful-paint') {
          metrics.value.firstContentfulPaint = entry.startTime
        }
      }
    })

    try {
      paintObserver.observe({ entryTypes: ['paint'] })
    } catch (e) {
      console.warn('Paint metrics not supported')
    }
  }

  const collectWebVitals = () => {
    if (!window.PerformanceObserver) return

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      metrics.value.largestContentfulPaint = lastEntry.startTime
    })

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      console.warn('LCP metrics not supported')
    }

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      for (const entry of entries) {
        const fidEntry = entry as any
        if (fidEntry.processingStart && fidEntry.startTime) {
          metrics.value.firstInputDelay = fidEntry.processingStart - fidEntry.startTime
        }
      }
    })

    try {
      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      console.warn('FID metrics not supported')
    }

    // Cumulative Layout Shift
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      for (const entry of entries) {
        const layoutShiftEntry = entry as any
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value
          metrics.value.cumulativeLayoutShift = clsValue
        }
      }
    })

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      console.warn('CLS metrics not supported')
    }
  }

  const collectMemoryMetrics = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      metrics.value.memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      }
    }
  }

  const startMonitoring = () => {
    if (!window.performance) {
      console.warn('Performance API not supported')
      return
    }

    isSupported.value = true

    // Collect initial metrics
    setTimeout(collectBasicMetrics, 0)

    // Collect paint metrics
    collectPaintMetrics()

    // Collect Web Vitals
    collectWebVitals()

    // Collect memory metrics periodically
    collectMemoryMetrics()
    const memoryInterval = setInterval(collectMemoryMetrics, 30000) // Every 30 seconds

    // Store interval for cleanup
    ;(window as any).__performanceMemoryInterval = memoryInterval
  }

  const stopMonitoring = () => {
    if ((window as any).__performanceMemoryInterval) {
      clearInterval((window as any).__performanceMemoryInterval)
    }

    if (observer.value) {
      observer.value.disconnect()
    }
  }

  const getPerformanceGrade = () => {
    const m = metrics.value

    if (!m.loadTime) return 'Unknown'

    let score = 100

    // Load time scoring (target: < 2s)
    if (m.loadTime > 5000) score -= 30
    else if (m.loadTime > 3000) score -= 20
    else if (m.loadTime > 2000) score -= 10

    // FCP scoring (target: < 1.8s)
    if (m.firstContentfulPaint && m.firstContentfulPaint > 3000) score -= 20
    else if (m.firstContentfulPaint && m.firstContentfulPaint > 1800) score -= 10

    // LCP scoring (target: < 2.5s)
    if (m.largestContentfulPaint && m.largestContentfulPaint > 4000) score -= 20
    else if (m.largestContentfulPaint && m.largestContentfulPaint > 2500) score -= 10

    // FID scoring (target: < 100ms)
    if (m.firstInputDelay && m.firstInputDelay > 300) score -= 15
    else if (m.firstInputDelay && m.firstInputDelay > 100) score -= 8

    // CLS scoring (target: < 0.1)
    if (m.cumulativeLayoutShift && m.cumulativeLayoutShift > 0.25) score -= 15
    else if (m.cumulativeLayoutShift && m.cumulativeLayoutShift > 0.1) score -= 8

    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Poor'
  }

  const exportMetrics = () => {
    return {
      ...metrics.value,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      grade: getPerformanceGrade()
    }
  }

  onMounted(() => {
    startMonitoring()
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    metrics,
    isSupported,
    getPerformanceGrade,
    exportMetrics,
    startMonitoring,
    stopMonitoring
  }
}
