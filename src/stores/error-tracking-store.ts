import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface ErrorLog {
  id: string;
  type: "network" | "validation" | "application" | "system";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack?: string;
  context: {
    component?: string;
    operation?: string;
    userId?: string;
    timestamp: Date;
    url: string;
    userAgent: string;
  };
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

export const useErrorTrackingStore = defineStore("errorTracking", () => {
  const errors = ref<ErrorLog[]>([]);
  const maxErrors = ref(100);

  const unresolvedErrors = computed(() =>
    errors.value.filter((e) => !e.resolved),
  );

  const criticalErrors = computed(() =>
    errors.value.filter((e) => e.severity === "critical" && !e.resolved),
  );

  const errorsByType = computed(() => {
    return errors.value.reduce(
      (acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  });

  const errorsBySeverity = computed(() => {
    return errors.value.reduce(
      (acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  });

  const logError = (
    error: Error,
    context: Partial<ErrorLog["context"]> = {},
  ): string => {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      type: classifyError(error),
      severity: getSeverity(error),
      message: error.message,
      stack: error.stack,
      context: {
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context,
      },
      resolved: false,
      metadata: {},
    };

    errors.value.unshift(errorLog);

    // Limit error storage
    if (errors.value.length > maxErrors.value) {
      errors.value = errors.value.slice(0, maxErrors.value);
    }

    // Send to remote logging service if critical
    if (errorLog.severity === "critical") {
      sendToRemoteLogging(errorLog).catch((logError) => {
        console.error(
          "Failed to send critical error to remote logging:",
          logError,
        );
      });
    }

    return errorLog.id;
  };

  const resolveError = (id: string) => {
    const error = errors.value.find((e) => e.id === id);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date();
    }
  };

  const resolveErrorsByType = (type: ErrorLog["type"]) => {
    errors.value.forEach((error) => {
      if (error.type === type && !error.resolved) {
        error.resolved = true;
        error.resolvedAt = new Date();
      }
    });
  };

  const clearResolvedErrors = () => {
    errors.value = errors.value.filter((e) => !e.resolved);
  };

  const clearAllErrors = () => {
    errors.value = [];
  };

  const getErrorById = (id: string): ErrorLog | undefined => {
    return errors.value.find((e) => e.id === id);
  };

  const getErrorsInTimeRange = (startTime: Date, endTime: Date): ErrorLog[] => {
    return errors.value.filter((error) => {
      const errorTime = error.context.timestamp;
      return errorTime >= startTime && errorTime <= endTime;
    });
  };

  const classifyError = (error: Error): ErrorLog["type"] => {
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
  };

  const getSeverity = (error: Error): ErrorLog["severity"] => {
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
  };

  const sendToRemoteLogging = async (errorLog: ErrorLog): Promise<void> => {
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
  };

  const exportErrors = (format: "json" | "csv" = "json"): string => {
    if (format === "csv") {
      const headers = [
        "ID",
        "Type",
        "Severity",
        "Message",
        "Timestamp",
        "Resolved",
      ];
      const rows = errors.value.map((error) => [
        error.id,
        error.type,
        error.severity,
        error.message.replace(/,/g, ";"), // Escape commas
        error.context.timestamp.toISOString(),
        error.resolved.toString(),
      ]);

      return [headers, ...rows].map((row) => row.join(",")).join("\n");
    }

    return JSON.stringify(errors.value, null, 2);
  };

  const getStatistics = () => ({
    total: errors.value.length,
    unresolved: unresolvedErrors.value.length,
    critical: criticalErrors.value.length,
    byType: errorsByType.value,
    bySeverity: errorsBySeverity.value,
    recentErrors: errors.value.slice(0, 5),
    oldestUnresolved:
      unresolvedErrors.value.length > 0
        ? unresolvedErrors.value[unresolvedErrors.value.length - 1]
        : null,
  });

  return {
    // State
    errors: computed(() => errors.value),
    unresolvedErrors,
    criticalErrors,
    errorsByType,
    errorsBySeverity,

    // Methods
    logError,
    resolveError,
    resolveErrorsByType,
    clearResolvedErrors,
    clearAllErrors,
    getErrorById,
    getErrorsInTimeRange,
    exportErrors,
    getStatistics,
  };
});
