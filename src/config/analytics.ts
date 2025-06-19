import { analytics } from "../services/analytics-service";
import { ConsoleAnalyticsProvider } from "../services/console-analytics-provider";
import { AnalyticsCategory } from "../types/analytics";
import { config } from "./env";

const getProvider = () => {
  switch (config.analytics.provider) {
    case "console":
      return new ConsoleAnalyticsProvider(config.analytics.debug);
    default:
      throw new Error(
        `Unsupported analytics provider: ${config.analytics.provider}`
      );
  }
};
export function initializeAnalytics() {
  // Add console provider for development/debugging
  const provider = getProvider();
  analytics.addProvider(provider);

  // Configure analytics service
  analytics.configure({
    enabled: config.analytics.enabled,
    debug: config.analytics.debug,
    batchSize: config.analytics.batchSize,
    flushInterval: config.analytics.flushInterval,
    sessionTimeout: config.analytics.sessionTimeout,
  });

  // Start initial session
  analytics.startNewSession();

  // Track app initialization
  analytics.track({
    name: "app_initialized",
    category: AnalyticsCategory.SYSTEM,
    properties: {
      version: config.appVersion || "unknown",
      environment: config.environment,
      timestamp: Date.now(),
    },
  });

  return analytics;
}

// Export for potential future providers
export { analytics };
