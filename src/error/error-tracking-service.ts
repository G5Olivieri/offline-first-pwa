export interface ErrorLog {
  id: string;
  type: "network" | "validation" | "application" | "system";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack?: string;
  context: Record<string, unknown>;
}

export class ErrorTrackingService {
  constructor(
    private readonly source: string,
    private readonly context?: Record<string, unknown>,
  ) {}

  public track(error: Error, context: Record<string, unknown> = {}) {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      type: this.classifyError(error),
      severity: this.getSeverity(error),
      message: error.message,
      stack: error.stack,
      context: {
        ...this.context,
        source: this.source,
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context,
      },
    };

    if (errorLog.severity === "critical") {
      this.sendToRemoteLogging(errorLog).catch((logError) => {
        console.error(
          "Failed to send critical error to remote logging:",
          logError,
        );
      });
    }

    return errorLog.id;
  }

  private classifyError(error: Error): ErrorLog["type"] {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("connection")
    ) {
      return "network";
    } else if (name === "validationerror" || message.includes("validation")) {
      return "validation";
    } else if (
      message.includes("quota") ||
      message.includes("storage") ||
      message.includes("memory")
    ) {
      return "system";
    }
    return "application";
  }

  private getSeverity(error: Error): ErrorLog["severity"] {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (
      message.includes("critical") ||
      name === "securityerror" ||
      message.includes("security")
    ) {
      return "critical";
    } else if (
      message.includes("network") ||
      name === "typeerror" ||
      message.includes("failed to fetch")
    ) {
      return "high";
    } else if (name === "validationerror" || message.includes("validation")) {
      return "medium";
    }
    return "low";
  }

  private async sendToRemoteLogging(errorLog: ErrorLog): Promise<void> {
    try {
      // Only send in production and if endpoint is configured
      const logEndpoint = import.meta.env.VITE_ERROR_LOG_ENDPOINT;
      if (!logEndpoint || import.meta.env.DEV) {
        return;
      }

      await fetch(logEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Error-Source": "pos-frontend",
        },
        body: JSON.stringify({
          ...errorLog,
          // Sanitize sensitive data
          context: {
            ...errorLog.context,
            userAgent: undefined, // Remove user agent for privacy
          },
        }),
      });
    } catch (logError) {
      console.error("Failed to send error log to remote service:", logError);
    }
  }
}

export const errorTrackingService = new ErrorTrackingService("global");
