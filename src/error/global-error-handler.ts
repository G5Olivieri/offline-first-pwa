import type { App } from "vue";
import { errorBus, type ErrorEvent } from "./error-event-bus";

export interface GlobalErrorConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  enableUserNotification: boolean;
  logEndpoint?: string;
  maxErrorsPerMinute?: number;
}

interface ErrorDetails {
  type: "vue-error" | "javascript-error" | "promise-rejection";
  message: string;
  stack?: string;
  componentName?: string;
  errorInfo?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  reason?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

export class GlobalErrorHandler {
  private config: GlobalErrorConfig;
  private errorCounts: Map<string, number> = new Map();
  private lastResetTime = Date.now();

  constructor(config: GlobalErrorConfig) {
    this.config = {
      maxErrorsPerMinute: 10,
      ...config,
    };
  }

  setupVueErrorHandler(app: App) {
    app.config.errorHandler = (error, instance, info) => {
      this.handleVueError(error, instance, info);
    };
  }

  setupWindowErrorHandler() {
    window.addEventListener("error", (event) => {
      this.handleWindowError(event.error, event as unknown as ErrorEvent);
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.handlePromiseRejection(event.reason, event);
    });
  }

  private async handleVueError(
    error: unknown,
    instance: unknown,
    info: string,
  ) {
    const errorObj = error as Error;
    const errorDetails: ErrorDetails = {
      type: "vue-error",
      message: errorObj.message || "Unknown Vue error",
      stack: errorObj.stack,
      componentName: this.getComponentName(instance),
      errorInfo: info,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    await this.processError(errorDetails);
  }

  private async handleWindowError(error: Error, event: ErrorEvent) {
    const errorDetails: ErrorDetails = {
      type: "javascript-error",
      message:
        error.message || (event as unknown as { message: string }).message,
      stack: error.stack,
      filename: (event as unknown as { filename: string }).filename,
      lineno: (event as unknown as { lineno: number }).lineno,
      colno: (event as unknown as { colno: number }).colno,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    await this.processError(errorDetails);
  }

  private async handlePromiseRejection(
    reason: unknown,
    event: PromiseRejectionEvent,
  ) {
    const errorDetails: ErrorDetails = {
      type: "promise-rejection",
      message: (reason as Error)?.message || "Unhandled promise rejection",
      stack: (reason as Error)?.stack,
      reason: JSON.stringify(reason),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    await this.processError(errorDetails);

    // Prevent the default browser behavior
    event.preventDefault();
  }

  private async processError(errorDetails: ErrorDetails) {
    // Rate limiting to prevent error spam
    if (!this.shouldProcessError(errorDetails)) {
      return;
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      console.error("Global Error:", errorDetails);
    }

    // Emit to error bus for application-wide handling
    errorBus.emitError({
      type: this.classifyErrorType(errorDetails),
      severity: this.determineSeverity(errorDetails),
      message: errorDetails.message,
      source: `GlobalErrorHandler.${errorDetails.type}`,
      timestamp: new Date(),
      context: {
        errorDetails,
        url: errorDetails.url,
        userAgent: errorDetails.userAgent,
      },
      stack: errorDetails.stack,
    });

    // Remote logging
    if (this.config.enableRemoteLogging && this.config.logEndpoint) {
      try {
        await fetch(this.config.logEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(errorDetails),
        });
      } catch (logError) {
        console.error("Failed to send error log:", logError);
      }
    }
  }

  private shouldProcessError(errorDetails: ErrorDetails): boolean {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    // Reset counts every minute
    if (now - this.lastResetTime > oneMinute) {
      this.errorCounts.clear();
      this.lastResetTime = now;
    }

    // Create a key for this error type
    const errorKey = `${errorDetails.type}:${errorDetails.message}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;

    // Check if we've exceeded the rate limit
    if (currentCount >= (this.config.maxErrorsPerMinute || 10)) {
      return false;
    }

    // Increment the count
    this.errorCounts.set(errorKey, currentCount + 1);
    return true;
  }

  private classifyErrorType(errorDetails: ErrorDetails): ErrorEvent["type"] {
    if (
      errorDetails.message.includes("fetch") ||
      errorDetails.message.includes("network") ||
      errorDetails.message.includes("Failed to fetch")
    ) {
      return "network";
    } else if (
      errorDetails.message.includes("validation") ||
      errorDetails.message.includes("required") ||
      errorDetails.message.includes("invalid")
    ) {
      return "validation";
    } else if (
      errorDetails.message.includes("quota") ||
      errorDetails.message.includes("storage") ||
      errorDetails.message.includes("memory")
    ) {
      return "system";
    }
    return "application";
  }

  private determineSeverity(
    errorDetails: ErrorDetails,
  ): ErrorEvent["severity"] {
    if (
      errorDetails.message.includes("critical") ||
      errorDetails.message.includes("fatal") ||
      errorDetails.message.includes("quota")
    ) {
      return "critical";
    } else if (
      errorDetails.type === "vue-error" ||
      errorDetails.message.includes("TypeError") ||
      errorDetails.message.includes("network")
    ) {
      return "high";
    } else if (
      errorDetails.message.includes("validation") ||
      errorDetails.message.includes("warning")
    ) {
      return "medium";
    }
    return "low";
  }

  private getComponentName(instance: unknown): string {
    try {
      // Try to extract component name from Vue instance
      const vueInstance = instance as {
        $options?: { name?: string; __name?: string };
        type?: { name?: string };
      };

      return (
        vueInstance?.$options?.name ||
        vueInstance?.$options?.__name ||
        vueInstance?.type?.name ||
        "Unknown"
      );
    } catch {
      return "Unknown";
    }
  }
}

// Factory function to create and configure global error handler
export function createGlobalErrorHandler(
  app: App,
  config?: Partial<GlobalErrorConfig>,
) {
  const defaultConfig: GlobalErrorConfig = {
    enableConsoleLogging: import.meta.env.DEV,
    enableRemoteLogging: import.meta.env.PROD,
    enableUserNotification: true,
    logEndpoint: import.meta.env.VITE_ERROR_LOG_ENDPOINT,
    maxErrorsPerMinute: 10,
  };

  const errorHandler = new GlobalErrorHandler({ ...defaultConfig, ...config });

  errorHandler.setupVueErrorHandler(app);
  errorHandler.setupWindowErrorHandler();

  return errorHandler;
}
