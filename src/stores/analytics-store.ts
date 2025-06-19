import { defineStore } from "pinia";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { config } from "../config/env";
import type {
  AnalyticsConfig,
  AnalyticsContext,
  AnalyticsEvent,
  AnalyticsProvider,
  ErrorEvent,
  NavigationEvent,
  OrderEvent,
  PerformanceEvent,
  ProductEvent,
  UserAction,
} from "../types/analytics";
import { AnalyticsCategory } from "../types/analytics";
import { ConsoleAnalyticsProvider } from "../services/console-analytics-provider";
import { createLogger } from "../services/logger-service";

const logger = createLogger("AnalyticsStore");

function getProvider(providerName: string): AnalyticsProvider {
  switch (providerName) {
    case "console":
      return new ConsoleAnalyticsProvider();
    // Add other providers here as needed
    default:
      throw new Error(`Unknown analytics provider: ${providerName}`);
  }
}

function getProviders(providers: string[]): AnalyticsProvider[] {
  return providers
    .map((providerName) => {
      try {
        return getProvider(providerName);
      } catch (error) {
        logger.error("Failed to initialize analytics provider", {
          providerName,
          error: error instanceof Error ? error.message : String(error),
        });
        return null; // Skip this provider if it fails
      }
    })
    .filter((provider): provider is AnalyticsProvider => provider !== null);
}

export const useAnalyticsStore = defineStore("analytics", () => {
  // State
  const analyticsConfig = ref<AnalyticsConfig>({
    enabled: config.analytics.enabled,
    debug: config.analytics.debug,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    batchSize: config.analytics.batchSize || 50,
    flushInterval: config.analytics.flushInterval || 10000, // 10 seconds
    providers: getProviders(config.analytics.providers),
  });

  const sessionId = ref<string>("");
  const context = ref<AnalyticsContext>({});
  const eventQueue = ref<AnalyticsEvent[]>([]);
  const flushTimer = ref<ReturnType<typeof setInterval> | undefined>();
  const navigationStartTime = ref<number>(Date.now());
  const currentPage = ref<string>("");

  // Computed
  const isEnabled = computed(() => analyticsConfig.value.enabled);
  const currentSessionId = computed(() => sessionId.value);
  const queueLength = computed(() => eventQueue.value.length);

  // Private methods
  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const collectContext = (): AnalyticsContext => {
    const contextData: AnalyticsContext = {
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      viewport:
        typeof window !== "undefined"
          ? {
              width: window.innerWidth,
              height: window.innerHeight,
            }
          : undefined,
    };

    // Detect device type
    if (typeof window !== "undefined" && window.innerWidth) {
      if (window.innerWidth <= 768) {
        contextData.device = { type: "mobile" };
      } else if (window.innerWidth <= 1024) {
        contextData.device = { type: "tablet" };
      } else {
        contextData.device = { type: "desktop" };
      }
    }

    // Add connection info if available
    if ("connection" in navigator) {
      const connection = (
        navigator as Navigator & {
          connection: { effectiveType: string; downlink?: number };
        }
      ).connection;
      contextData.connection = {
        type: connection.effectiveType,
        speed: connection.downlink ? `${connection.downlink}Mbps` : "unknown",
      };
    }

    return contextData;
  };

  const setupAutoFlush = (): void => {
    if (flushTimer.value) {
      clearInterval(flushTimer.value);
    }

    if (analyticsConfig.value.flushInterval && analyticsConfig.value.flushInterval > 0) {
      flushTimer.value = setInterval(() => {
        flush();
      }, analyticsConfig.value.flushInterval);
    }
  };

  // Public API methods
  const addProvider = (provider: AnalyticsProvider): void => {
    analyticsConfig.value.providers.push(provider);
    logger.debug("Analytics provider added", { providerName: provider.name });
  };

  const removeProvider = (providerName: string): void => {
    analyticsConfig.value.providers = analyticsConfig.value.providers.filter(
      (p) => p.name !== providerName
    );
    logger.debug("Analytics provider removed", { providerName });
  };

  // Generic event tracking
  const track = (event: Omit<AnalyticsEvent, "timestamp" | "sessionId">): void => {
    if (!analyticsConfig.value.enabled) return;

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: sessionId.value,
      userId: event.userId || analyticsConfig.value.userId,
      context: { ...context.value, ...event.context },
    };

    eventQueue.value.push(enrichedEvent);

    if (analyticsConfig.value.debug) {
      logger.debug("Event tracked", enrichedEvent);
    }

    // Immediate flush for high-priority events
    if (event.category === AnalyticsCategory.ERROR) {
      flush();
    } else if (eventQueue.value.length >= (analyticsConfig.value.batchSize || 50)) {
      flush();
    }
  };

  // Specialized tracking methods
  const trackUserAction = (action: UserAction): void => {
    track({
      name: action.action,
      category: AnalyticsCategory.USER_ACTION,
      properties: {
        category: action.category,
        label: action.label || "",
        value: action.value || 0,
        ...action.metadata,
      },
    });
  };

  const trackProduct = (eventName: string, product: ProductEvent): void => {
    track({
      name: eventName,
      category: AnalyticsCategory.BUSINESS,
      properties: {
        productId: product.productId || "",
        productName: product.productName || "",
        category: product.category || "",
        price: product.price || 0,
        quantity: product.quantity || 0,
        barcode: product.barcode || "",
      },
    });
  };

  const trackOrder = (eventName: string, order: OrderEvent): void => {
    track({
      name: eventName,
      category: AnalyticsCategory.BUSINESS,
      properties: {
        orderId: order.orderId || "",
        customerId: order.customerId || "",
        operatorId: order.operatorId || "",
        total: order.total || 0,
        itemCount: order.itemCount || 0,
        paymentMethod: order.paymentMethod || "",
      },
    });
  };

  const trackNavigation = (navigation: NavigationEvent): void => {
    track({
      name: "navigation",
      category: AnalyticsCategory.NAVIGATION,
      properties: {
        from: navigation.from || "",
        to: navigation.to,
        duration: navigation.duration || 0,
      },
    });
  };

  const trackError = (error: ErrorEvent): void => {
    track({
      name: "error_occurred",
      category: AnalyticsCategory.ERROR,
      properties: {
        errorType: error.errorType,
        errorMessage: error.errorMessage || "",
        stackTrace: error.stackTrace || "",
        ...error.context,
      },
    });
  };

  const trackPerformance = (performance: PerformanceEvent): void => {
    track({
      name: performance.metric,
      category: AnalyticsCategory.PERFORMANCE,
      properties: {
        value: performance.value,
        unit: performance.unit,
        ...performance.context,
      },
    });
  };

  // Recommendation tracking methods
  const trackRecommendationViewed = (
    recommendationId: string,
    productId: string,
    context: string,
    type: string,
    metadata: Record<string, string | number | boolean> = {}
  ): void => {
    track({
      name: "recommendation_viewed",
      category: AnalyticsCategory.COMMERCE,
      properties: {
        recommendation_id: recommendationId,
        product_id: productId,
        context,
        type,
        session_id: sessionId.value,
        ...metadata,
      },
    });
  };

  const trackRecommendationClicked = (
    recommendationId: string,
    productId: string,
    context: string,
    type: string,
    metadata: Record<string, string | number | boolean> = {}
  ): void => {
    track({
      name: "recommendation_clicked",
      category: AnalyticsCategory.COMMERCE,
      properties: {
        recommendation_id: recommendationId,
        product_id: productId,
        context,
        type,
        session_id: sessionId.value,
        ...metadata,
      },
    });
  };

  const trackRecommendationAddedToCart = (
    recommendationId: string,
    productId: string,
    context: string,
    type: string,
    metadata: Record<string, string | number | boolean> = {}
  ): void => {
    track({
      name: "recommendation_added_to_cart",
      category: AnalyticsCategory.COMMERCE,
      properties: {
        recommendation_id: recommendationId,
        product_id: productId,
        context,
        type,
        session_id: sessionId.value,
        ...metadata,
      },
    });
  };

  const trackRecommendationPurchased = (
    recommendationId: string,
    productId: string,
    context: string,
    type: string,
    orderId: string,
    metadata: Record<string, string | number | boolean> = {}
  ): void => {
    track({
      name: "recommendation_purchased",
      category: AnalyticsCategory.COMMERCE,
      properties: {
        recommendation_id: recommendationId,
        product_id: productId,
        context,
        type,
        order_id: orderId,
        session_id: sessionId.value,
        ...metadata,
      },
    });
  };

  const trackRecommendationDismissed = (
    recommendationId: string,
    productId: string,
    context: string,
    type: string,
    metadata: Record<string, string | number | boolean> = {}
  ): void => {
    track({
      name: "recommendation_dismissed",
      category: AnalyticsCategory.COMMERCE,
      properties: {
        recommendation_id: recommendationId,
        product_id: productId,
        context,
        type,
        session_id: sessionId.value,
        ...metadata,
      },
    });
  };

  const trackRecommendationsGenerated = (
    recommendations: Array<{
      id: string;
      productId: string;
      type: string;
    }>,
    context: string,
    metadata: Record<string, string | number | boolean> = {}
  ): void => {
    track({
      name: "recommendations_generated",
      category: AnalyticsCategory.COMMERCE,
      properties: {
        context,
        recommendation_count: recommendations.length,
        recommendation_types: [...new Set(recommendations.map(r => r.type))],
        session_id: sessionId.value,
        ...metadata,
      },
    });

    // Track individual views for each recommendation
    recommendations.forEach(rec => {
      trackRecommendationViewed(rec.id, rec.productId, context, rec.type);
    });
  };

  // User identification
  const identify = (
    userId: string,
    properties?: Record<string, string | number | boolean>
  ): void => {
    if (!analyticsConfig.value.enabled) return;

    analyticsConfig.value.userId = userId;

    analyticsConfig.value.providers.forEach((provider) => {
      try {
        provider.identify(userId, properties);
      } catch (error) {
        logger.error("Provider identify failed", {
          providerName: provider.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    track({
      name: "user_identified",
      category: AnalyticsCategory.SYSTEM,
      properties: properties || {},
    });
  };

  // Page tracking
  const trackPageView = (pageName?: string) => {
    if (!analyticsConfig.value.enabled) return;

    const route = useRoute();
    const page = pageName || route.name as string || route.path;

    analyticsConfig.value.providers.forEach((provider) => {
      try {
        provider.page(page, {
          path: route.path,
          query: JSON.stringify(route.query),
          params: JSON.stringify(route.params),
        });
      } catch (error) {
        logger.error("Provider page tracking failed", {
          providerName: provider.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    track({
      name: "page_view",
      category: AnalyticsCategory.NAVIGATION,
      properties: {
        page,
        path: route.path,
        query: JSON.stringify(route.query),
        params: JSON.stringify(route.params),
      },
    });

    currentPage.value = page;
    navigationStartTime.value = Date.now();
  };

  // Batch processing
  const flush = async (): Promise<void> => {
    if (eventQueue.value.length === 0) return;

    const events = [...eventQueue.value];
    eventQueue.value = [];

    for (const provider of analyticsConfig.value.providers) {
      try {
        for (const event of events) {
          await provider.track(event);
        }
        if (provider.flush) {
          await provider.flush();
        }
      } catch (error) {
        logger.error("Provider flush failed", {
          providerName: provider.name,
          eventsCount: events.length,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (analyticsConfig.value.debug) {
      logger.debug("Events flushed", { eventsCount: events.length });
    }
  };

  // Configuration
  const configure = (newConfig: Partial<AnalyticsConfig>): void => {
    analyticsConfig.value = { ...analyticsConfig.value, ...newConfig };

    analyticsConfig.value.providers.forEach((provider) => {
      if (provider.configure) {
        provider.configure(
          newConfig as Record<string, string | number | boolean>
        );
      }
    });

    if (newConfig.flushInterval) {
      setupAutoFlush();
    }

    logger.info("Analytics Store reconfigured", newConfig);
  };

  // Session management
  const startNewSession = (): void => {
    sessionId.value = generateSessionId();
    context.value = collectContext();

    track({
      name: "session_started",
      category: AnalyticsCategory.SYSTEM,
      properties: { previousSession: sessionId.value },
    });

    logger.info("New analytics session started", { sessionId: sessionId.value });
  };

  // Common POS actions
  const trackProductScan = (barcode: string, productName?: string) => {
    trackProduct('product_scanned', {
      barcode,
      productName,
    });
  };

  const trackProductAdd = (product: ProductEvent, quantity = 1) => {
    trackProduct('product_added_to_cart', {
      ...product,
      quantity,
    });
  };

  const trackOrderComplete = (order: OrderEvent) => {
    trackOrder('order_completed', order);
  };

  const trackOrderAbandon = (order: Partial<OrderEvent>) => {
    trackOrder('order_abandoned', order as OrderEvent);
  };

  const trackLogin = (operatorId: string) => {
    trackUserAction({
      action: 'login',
      category: 'authentication',
      metadata: {
        operatorId,
      },
    });
  };

  const trackLogout = (operatorId: string, sessionDuration?: number) => {
    trackUserAction({
      action: 'logout',
      category: 'authentication',
      metadata: {
        operatorId,
        sessionDuration: sessionDuration || 0,
      },
    });
  };

  const trackSearch = (query: string, resultCount: number, category = 'products') => {
    trackUserAction({
      action: 'search',
      category: 'search',
      label: query,
      value: resultCount,
      metadata: {
        searchCategory: category,
      },
    });
  };

  const trackButtonClick = (buttonName: string, context?: Record<string, string | number | boolean>) => {
    trackUserAction({
      action: 'button_click',
      category: 'ui_interaction',
      label: buttonName,
      metadata: context,
    });
  };

  const trackFormSubmit = (formName: string, success: boolean, errors?: string[]) => {
    trackUserAction({
      action: 'form_submit',
      category: 'form_interaction',
      label: formName,
      value: success ? 1 : 0,
      metadata: {
        success,
        errors: errors?.join(', ') || '',
      },
    });
  };

  const trackDialogOpen = (dialogName: string) => {
    trackUserAction({
      action: 'dialog_open',
      category: 'ui_interaction',
      label: dialogName,
    });
  };

  const trackDialogClose = (dialogName: string, action = 'close') => {
    trackUserAction({
      action: 'dialog_close',
      category: 'ui_interaction',
      label: dialogName,
      metadata: {
        closeAction: action,
      },
    });
  };

  // Lifecycle
  const trackTimeSpentOnPage = () => {
    const timeSpent = Date.now() - navigationStartTime.value;
    trackPerformance({
      metric: 'page_time',
      value: timeSpent,
      unit: 'ms',
      context: {
        page: currentPage.value,
      },
    });
  };

  // Cleanup
  const destroy = (): void => {
    if (flushTimer.value) {
      clearInterval(flushTimer.value);
    }

    flush().finally(() => {
      logger.info("Analytics Store destroyed");
    });
  };

  // Initialize store
  const initialize = (): void => {
    sessionId.value = generateSessionId();
    context.value = collectContext();

    if (analyticsConfig.value.enabled) {
      setupAutoFlush();
      logger.debug("Analytics Store initialized", {
        sessionId: sessionId.value,
        providersCount: analyticsConfig.value.providers.length,
      });
    }
  };

  // Auto-initialize when store is created
  initialize();

  return {
    // State
    analyticsConfig,
    sessionId,
    context,
    eventQueue,
    currentPage,

    // Computed
    isEnabled,
    currentSessionId,
    queueLength,

    // Provider management
    addProvider,
    removeProvider,

    // Core tracking
    track,
    trackUserAction,
    trackProduct,
    trackOrder,
    trackNavigation,
    trackError,
    trackPerformance,

    // Recommendation tracking
    trackRecommendationViewed,
    trackRecommendationClicked,
    trackRecommendationAddedToCart,
    trackRecommendationPurchased,
    trackRecommendationDismissed,
    trackRecommendationsGenerated,

    // User management
    identify,
    trackPageView,

    // POS-specific tracking
    trackProductScan,
    trackProductAdd,
    trackOrderComplete,
    trackOrderAbandon,
    trackLogin,
    trackLogout,
    trackSearch,

    // UI interaction tracking
    trackButtonClick,
    trackFormSubmit,
    trackDialogOpen,
    trackDialogClose,

    // Lifecycle
    trackTimeSpentOnPage,

    // System management
    flush,
    configure,
    startNewSession,
    destroy,
    initialize,
  };
});

// Composable for easy use in components with automatic lifecycle management
export function useAnalytics() {
  const store = useAnalyticsStore();
  const route = useRoute();

  // Track page views automatically
  onMounted(() => {
    store.trackPageView();
  });

  // Cleanup on unmount - track time spent on page
  onUnmounted(() => {
    store.trackTimeSpentOnPage();
  });

  return {
    // All store methods and computed values
    ...store,

    // Route-aware page tracking
    trackPageView: (pageName?: string) => {
      const page = pageName || route.name as string || route.path;
      store.trackPageView(page);
    },
  };
}
