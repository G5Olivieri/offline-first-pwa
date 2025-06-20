import { ref, computed } from "vue";
import { useNotificationStore } from "@/stores/notification-store";
import { useOnlineStatusStore } from "@/stores/online-status-store";
import { useErrorTrackingStore } from "@/stores/error-tracking-store";
import { errorBus } from "@/error/error-event-bus";
import { errorMiddleware } from "@/error/error-middleware";
import type { ErrorContext } from "@/error/error-middleware";

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  isLoading: boolean;
  canRetry: boolean;
}

export interface ErrorHandlerOptions {
  showNotification?: boolean;
  logError?: boolean;
  enableRetry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  customMessage?: string;
  context?: Partial<ErrorContext>;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const notificationStore = useNotificationStore();
  const onlineStatusStore = useOnlineStatusStore();
  const errorTrackingStore = useErrorTrackingStore();

  const state = ref<ErrorState>({
    hasError: false,
    error: null,
    isLoading: false,
    canRetry: false,
  });

  const errorType = computed(() => {
    if (!state.value.error) return null;

    if (
      state.value.error.message.includes("fetch") ||
      state.value.error.message.includes("network")
    ) {
      return "network";
    } else if (state.value.error.name === "ValidationError") {
      return "validation";
    } else if (state.value.error.message.includes("permission")) {
      return "permission";
    } else if (
      state.value.error.message.includes("quota") ||
      state.value.error.message.includes("storage")
    ) {
      return "system";
    }
    return "application";
  });

  const canRetryOperation = computed(() => {
    return (
      state.value.canRetry &&
      (errorType.value === "network" ? onlineStatusStore.isOnline : true) &&
      options.enableRetry !== false
    );
  });

  const execute = async <T>(
    operation: () => Promise<T>,
    customOptions?: Partial<ErrorHandlerOptions>,
  ): Promise<T | null> => {
    const mergedOptions = { ...options, ...customOptions };
    let attempts = 0;
    const maxAttempts = mergedOptions.retryAttempts || 3;

    state.value.isLoading = true;
    state.value.hasError = false;
    state.value.error = null;

    while (attempts < maxAttempts) {
      try {
        const result = await operation();

        // Success - reset error state
        state.value.hasError = false;
        state.value.error = null;
        state.value.canRetry = false;
        state.value.isLoading = false;

        return result;
      } catch (error) {
        attempts++;
        const errorObj = error as Error;
        state.value.error = errorObj;
        state.value.hasError = true;
        state.value.canRetry = attempts < maxAttempts;

        // Create error context
        const context: ErrorContext = {
          operation: mergedOptions.context?.operation || "unknown",
          userId: mergedOptions.context?.userId,
          timestamp: new Date(),
          metadata: {
            attempt: attempts,
            maxAttempts,
            ...mergedOptions.context?.metadata,
          },
        };

        // Use error middleware for handling
        await errorMiddleware.handleError(errorObj, context);

        // Track error
        if (mergedOptions.logError !== false) {
          errorTrackingStore.logError(errorObj, {
            operation: context.operation,
            userId: context.userId,
          });
        }

        // Emit to error bus
        errorBus.emitError({
          type: getErrorType(errorObj),
          severity: getErrorSeverity(errorObj),
          message: errorObj.message,
          source: "useErrorHandler",
          timestamp: new Date(),
          context: {
            operation: context.operation,
            userId: context.userId,
            timestamp: context.timestamp.toISOString(),
            metadata: context.metadata,
          },
          stack: errorObj.stack,
        });

        // Show notification for final attempt or non-retryable errors
        if (attempts >= maxAttempts || !shouldRetry(errorObj)) {
          if (mergedOptions.showNotification !== false) {
            showErrorNotification(errorObj, mergedOptions.customMessage);
          }
          state.value.isLoading = false;
          break;
        }

        // Wait before retry
        if (attempts < maxAttempts) {
          await delay(
            mergedOptions.retryDelay || 1000 * Math.pow(2, attempts - 1),
          );
        }
      }
    }

    state.value.isLoading = false;
    return null;
  };

  const retry = async <T>(operation: () => Promise<T>): Promise<T | null> => {
    if (!canRetryOperation.value) return null;
    return execute(operation);
  };

  const clearError = () => {
    state.value.hasError = false;
    state.value.error = null;
    state.value.canRetry = false;
  };

  const showErrorNotification = (_error: Error, customMessage?: string) => {
    const type = errorType.value;

    switch (type) {
      case "network":
        if (customMessage) {
          notificationStore.showError("Connection Error", customMessage);
        } else {
          notificationStore.showError(
            "Connection Error",
            "Please check your internet connection and try again.",
          );
        }
        break;
      case "validation":
        notificationStore.showWarning(
          "Invalid Data",
          customMessage || "Please check your input and try again.",
        );
        break;
      case "permission":
        notificationStore.showError(
          "Access Denied",
          customMessage || "You don't have permission to perform this action.",
        );
        break;
      case "system":
        notificationStore.showError(
          "System Error",
          customMessage || "A system error occurred. Please try again later.",
        );
        break;
      default:
        notificationStore.showError(
          "Error",
          customMessage || "An unexpected error occurred. Please try again.",
        );
    }
  };

  const shouldRetry = (error: Error): boolean => {
    // Don't retry validation or permission errors
    if (
      error.name === "ValidationError" ||
      error.message.includes("permission")
    ) {
      return false;
    }

    // Don't retry system errors like quota exceeded
    if (error.message.includes("quota") || error.message.includes("storage")) {
      return false;
    }

    // Don't retry client errors (4xx)
    if (
      error.message.includes("400") ||
      error.message.includes("401") ||
      error.message.includes("403") ||
      error.message.includes("404")
    ) {
      return false;
    }

    // Only retry network errors when online
    if (
      (error.message.includes("fetch") || error.message.includes("network")) &&
      !onlineStatusStore.isOnline
    ) {
      return false;
    }

    return true;
  };

  const getErrorType = (
    error: Error,
  ): "network" | "validation" | "application" | "system" => {
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return "network";
    } else if (error.name === "ValidationError") {
      return "validation";
    } else if (
      error.message.includes("quota") ||
      error.message.includes("storage")
    ) {
      return "system";
    }
    return "application";
  };

  const getErrorSeverity = (
    error: Error,
  ): "low" | "medium" | "high" | "critical" => {
    if (error.message.includes("critical") || error.message.includes("quota")) {
      return "critical";
    } else if (
      error.message.includes("network") ||
      error.name === "TypeError"
    ) {
      return "high";
    } else if (error.name === "ValidationError") {
      return "medium";
    }
    return "low";
  };

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  return {
    // State
    hasError: computed(() => state.value.hasError),
    error: computed(() => state.value.error),
    isLoading: computed(() => state.value.isLoading),
    canRetry: computed(() => state.value.canRetry),
    errorType,
    canRetryOperation,

    // Methods
    execute,
    retry,
    clearError,
  };
}
