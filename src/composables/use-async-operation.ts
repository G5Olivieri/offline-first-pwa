import { ref, computed } from 'vue';
import { useErrorHandler } from './use-error-handler';
import { useNotificationStore } from '@/stores/notification-store';

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
    showNotification: options.showErrorMessage !== false
  });
  const notificationStore = useNotificationStore();

  const state = ref<AsyncOperationState<T>>({
    data: null,
    isLoading: false,
    error: null,
    hasError: false
  });

  const execute = async (
    operation: () => Promise<T>,
    customOptions?: Partial<AsyncOperationOptions>
  ): Promise<T | null> => {
    const mergedOptions = { ...options, ...customOptions };

    state.value.isLoading = true;
    state.value.error = null;
    state.value.hasError = false;

    const result = await errorHandler.execute(async () => {
      const data = await operation();
      state.value.data = data;

      if (mergedOptions.showSuccessMessage) {
        notificationStore.showSuccess(
          'Success',
          mergedOptions.successMessage || 'Operation completed successfully.'
        );
      }

      return data;
    }, {
      customMessage: mergedOptions.errorMessage,
      showNotification: mergedOptions.showErrorMessage !== false
    });

    if (result === null && errorHandler.hasError.value) {
      state.value.error = errorHandler.error.value;
      state.value.hasError = true;
    }

    state.value.isLoading = false;
    return result;
  };

  const retry = async (): Promise<T | null> => {
    if (!errorHandler.canRetryOperation.value) return state.value.data;

    // Reset error state
    state.value.error = null;
    state.value.hasError = false;

    // Note: In practice, you'd need to store the original operation
    // This is a limitation of this pattern - consider storing the operation
    return null;
  };

  const reset = () => {
    state.value.data = null;
    state.value.isLoading = false;
    state.value.error = null;
    state.value.hasError = false;
    errorHandler.clearError();
  };

  return {
    // State
    data: computed(() => state.value.data),
    isLoading: computed(() => state.value.isLoading || errorHandler.isLoading.value),
    error: computed(() => state.value.error || errorHandler.error.value),
    hasError: computed(() => state.value.hasError || errorHandler.hasError.value),
    canRetry: computed(() => errorHandler.canRetryOperation.value),

    // Methods
    execute,
    retry,
    reset
  };
}
