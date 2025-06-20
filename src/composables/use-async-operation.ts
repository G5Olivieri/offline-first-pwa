import { useNotificationStore } from "@/stores/notification-store";
import { computed, reactive, type UnwrapRef } from "vue";
import { useErrorHandler } from "./use-error-handler";

export interface AsyncOperationState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  hasError: boolean;
}

export interface AsyncOperationOptions {
  showSuccessMessage?: boolean;
  successMessage?: string;
  showErrorMessage?: boolean;
  errorMessage?: string;
  enableRetry?: boolean;
  retryAttempts?: number;
}

export function useAsyncOperation<T>(options: AsyncOperationOptions = {}) {
  const errorHandler = useErrorHandler({
    enableRetry: options.enableRetry,
    retryAttempts: options.retryAttempts,
    showNotification: options.showErrorMessage !== false,
  });
  const notificationStore = useNotificationStore();

  const state = reactive<AsyncOperationState<T>>({
    data: null,
    isLoading: false,
    error: null,
    hasError: false,
  });

  const execute = async (
    operation: () => Promise<T>,
    customOptions?: Partial<AsyncOperationOptions>
  ): Promise<T | null> => {
    const mergedOptions = { ...options, ...customOptions };

    state.isLoading = true;
    state.error = null;
    state.hasError = false;

    const result = await errorHandler.execute(
      async () => {
        const data = await operation();
        state.data = data as UnwrapRef<T>;

        if (mergedOptions.showSuccessMessage) {
          notificationStore.showSuccess(
            "Success",
            mergedOptions.successMessage || "Operation completed successfully."
          );
        }

        return data;
      },
      {
        customMessage: mergedOptions.errorMessage,
        showNotification: mergedOptions.showErrorMessage !== false,
      }
    );

    if (result === null && errorHandler.hasError.value) {
      state.error = errorHandler.error.value;
      state.hasError = true;
    }

    state.isLoading = false;
    return result;
  };

  const retry = async (): Promise<T | null> => {
    if (!errorHandler.canRetryOperation.value) return state.data as T | null;

    // Reset error state
    state.error = null;
    state.hasError = false;

    // Note: In practice, you'd need to store the original operation
    // This is a limitation of this pattern - consider storing the operation
    return null;
  };

  const reset = () => {
    state.data = null;
    state.isLoading = false;
    state.error = null;
    state.hasError = false;
    errorHandler.clearError();
  };

  return {
    // State
    data: computed(() => state.data),
    isLoading: computed(() => state.isLoading || errorHandler.isLoading.value),
    error: computed(() => state.error || errorHandler.error.value),
    hasError: computed(() => state.hasError || errorHandler.hasError.value),
    canRetry: computed(() => errorHandler.canRetryOperation.value),

    // Methods
    execute,
    retry,
    reset,
  };
}
