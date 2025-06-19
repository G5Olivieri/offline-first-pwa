import { analytics } from '../services/analytics-service';
import { ConsoleAnalyticsProvider } from '../services/console-analytics-provider';
import { AnalyticsCategory } from '../types/analytics';
import { config, isDevelopment } from './env';

export function initializeAnalytics() {
  // Add console provider for development/debugging
  const consoleProvider = new ConsoleAnalyticsProvider(isDevelopment);
  analytics.addProvider(consoleProvider);

  // Configure analytics service
  analytics.configure({
    enabled: true,
    debug: isDevelopment,
    batchSize: 20,
    flushInterval: 5000, // 5 seconds in development for faster feedback
  });

  // Start initial session
  analytics.startNewSession();

  // Track app initialization
  analytics.track({
    name: 'app_initialized',
    category: AnalyticsCategory.SYSTEM,
    properties: {
      version: config.appVersion || 'unknown',
      environment: config.environment,
      timestamp: Date.now(),
    },
  });

  return analytics;
}

// Export for potential future providers
export { analytics };
