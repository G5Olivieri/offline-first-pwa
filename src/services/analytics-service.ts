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
import { createLogger } from "./logger-service";

const logger = createLogger("AnalyticsService");

class AnalyticsService {
  private config: AnalyticsConfig;
  private sessionId: string;
  private context: AnalyticsContext;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer?: ReturnType<typeof setInterval>;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      debug: false,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      batchSize: 50,
      flushInterval: 10000, // 10 seconds
      providers: [],
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.context = this.collectContext();

    if (this.config.enabled) {
      this.setupAutoFlush();
      logger.debug("Analytics Service initialized", {
        sessionId: this.sessionId,
        providersCount: this.config.providers.length,
      });
    }
  }

  // Public API methods
  addProvider(provider: AnalyticsProvider): void {
    this.config.providers.push(provider);
    logger.debug("Analytics provider added", { providerName: provider.name });
  }

  removeProvider(providerName: string): void {
    this.config.providers = this.config.providers.filter(
      (p) => p.name !== providerName
    );
    logger.debug("Analytics provider removed", { providerName });
  }

  // Generic event tracking
  track(event: Omit<AnalyticsEvent, "timestamp" | "sessionId">): void {
    if (!this.config.enabled) return;

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: event.userId || this.config.userId,
      context: { ...this.context, ...event.context },
    };

    this.eventQueue.push(enrichedEvent);

    if (this.config.debug) {
      logger.debug("Event tracked", enrichedEvent);
    }

    // Immediate flush for high-priority events
    if (event.category === AnalyticsCategory.ERROR) {
      this.flush();
    } else if (this.eventQueue.length >= (this.config.batchSize || 50)) {
      this.flush();
    }
  }

  // Specialized tracking methods
  trackUserAction(action: UserAction): void {
    this.track({
      name: action.action,
      category: AnalyticsCategory.USER_ACTION,
      properties: {
        category: action.category,
        label: action.label || "",
        value: action.value || 0,
        ...action.metadata,
      },
    });
  }

  trackProduct(eventName: string, product: ProductEvent): void {
    this.track({
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
  }

  trackOrder(eventName: string, order: OrderEvent): void {
    this.track({
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
  }

  trackNavigation(navigation: NavigationEvent): void {
    this.track({
      name: "navigation",
      category: AnalyticsCategory.NAVIGATION,
      properties: {
        from: navigation.from || "",
        to: navigation.to,
        duration: navigation.duration || 0,
      },
    });
  }

  trackError(error: ErrorEvent): void {
    this.track({
      name: "error_occurred",
      category: AnalyticsCategory.ERROR,
      properties: {
        errorType: error.errorType,
        errorMessage: error.errorMessage || "",
        stackTrace: error.stackTrace || "",
        ...error.context,
      },
    });
  }

  trackPerformance(performance: PerformanceEvent): void {
    this.track({
      name: performance.metric,
      category: AnalyticsCategory.PERFORMANCE,
      properties: {
        value: performance.value,
        unit: performance.unit,
        ...performance.context,
      },
    });
  }

  // User identification
  identify(
    userId: string,
    properties?: Record<string, string | number | boolean>
  ): void {
    if (!this.config.enabled) return;

    this.config.userId = userId;

    this.config.providers.forEach((provider) => {
      try {
        provider.identify(userId, properties);
      } catch (error) {
        logger.error("Provider identify failed", {
          providerName: provider.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    this.track({
      name: "user_identified",
      category: AnalyticsCategory.SYSTEM,
      properties: properties || {},
    });
  }

  // Page tracking
  page(
    name: string,
    properties?: Record<string, string | number | boolean>
  ): void {
    if (!this.config.enabled) return;

    this.config.providers.forEach((provider) => {
      try {
        provider.page(name, properties);
      } catch (error) {
        logger.error("Provider page tracking failed", {
          providerName: provider.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    this.track({
      name: "page_view",
      category: AnalyticsCategory.NAVIGATION,
      properties: {
        page: name,
        ...properties,
      },
    });
  }

  // Batch processing
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const provider of this.config.providers) {
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

    if (this.config.debug) {
      logger.debug("Events flushed", { eventsCount: events.length });
    }
  }

  // Configuration
  configure(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };

    this.config.providers.forEach((provider) => {
      if (provider.configure) {
        provider.configure(
          newConfig as Record<string, string | number | boolean>
        );
      }
    });

    if (newConfig.flushInterval) {
      this.setupAutoFlush();
    }

    logger.info("Analytics Service reconfigured", newConfig);
  }

  // Session management
  startNewSession(): void {
    this.sessionId = this.generateSessionId();
    this.context = this.collectContext();

    this.track({
      name: "session_started",
      category: AnalyticsCategory.SYSTEM,
      properties: { previousSession: this.sessionId },
    });

    logger.info("New analytics session started", { sessionId: this.sessionId });
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flush().finally(() => {
      logger.info("Analytics Service destroyed");
    });
  }

  // Private methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private collectContext(): AnalyticsContext {
    const context: AnalyticsContext = {
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
        context.device = { type: "mobile" };
      } else if (window.innerWidth <= 1024) {
        context.device = { type: "tablet" };
      } else {
        context.device = { type: "desktop" };
      }
    }

    // Add connection info if available
    if ("connection" in navigator) {
      const connection = (
        navigator as Navigator & {
          connection: { effectiveType: string; downlink?: number };
        }
      ).connection;
      context.connection = {
        type: connection.effectiveType,
        speed: connection.downlink ? `${connection.downlink}Mbps` : "unknown",
      };
    }

    return context;
  }

  private setupAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.config.flushInterval && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  // Getters
  get isEnabled(): boolean {
    return this.config.enabled;
  }

  get currentSessionId(): string {
    return this.sessionId;
  }

  get queueLength(): number {
    return this.eventQueue.length;
  }
}

// Create singleton instance
export const analytics = new AnalyticsService({
  enabled: config.analytics.enabled,
  debug: config.analytics.debug,
  batchSize: config.analytics.batchSize,
  flushInterval: config.analytics.flushInterval,
});

// Export the class for custom instances
export { AnalyticsService };
export type { AnalyticsConfig, AnalyticsEvent, AnalyticsProvider };

