<template>
  <div v-if="hasError" class="error-boundary bg-red-50 border border-red-200 rounded-lg p-6">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div class="ml-3 w-full">
        <h3 class="text-sm font-medium text-red-800">
          {{ errorTitle }}
        </h3>
        <div class="mt-2 text-sm text-red-700">
          <p>{{ errorMessage }}</p>
        </div>

        <!-- Error details (development only) -->
        <div v-if="showDetails && error" class="mt-4">
          <details class="text-xs">
            <summary class="cursor-pointer text-red-600 hover:text-red-800">
              Technical Details
            </summary>
            <pre class="mt-2 text-gray-600 bg-gray-100 p-2 rounded overflow-auto">{{ errorDetails }}</pre>
          </details>
        </div>

        <!-- Action buttons -->
        <div class="mt-4 flex space-x-3">
          <button
            v-if="showRetry"
            @click="handleRetry"
            class="bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium py-2 px-4 rounded-md transition-colors"
          >
            Try Again
          </button>
          <button
            v-if="showReload"
            @click="handleReload"
            class="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-2 px-4 rounded-md transition-colors"
          >
            Reload Page
          </button>
          <button
            v-if="showReset"
            @click="handleReset"
            class="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-medium py-2 px-4 rounded-md transition-colors"
          >
            Reset Component
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Render children normally when no error -->
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured, watch } from 'vue';
import { errorBus } from '../error/error-event-bus';

interface Props {
  // Custom error message to show users
  fallbackMessage?: string;
  // Whether to show retry button
  showRetry?: boolean;
  // Whether to show reload page button
  showReload?: boolean;
  // Whether to show reset component button
  showReset?: boolean;
  // Whether to show technical error details (dev mode)
  showDetails?: boolean;
  // Custom error title
  title?: string;
  // Custom error handler
  onError?: (error: Error, instance: unknown, info: string) => void;
  // Custom retry handler
  onRetry?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  fallbackMessage: 'Something went wrong. Please try again.',
  showRetry: true,
  showReload: false,
  showReset: true,
  showDetails: import.meta.env.DEV,
  title: 'Oops! Something went wrong'
});

const emit = defineEmits<{
  error: [error: Error, info: string];
  retry: [];
  reset: [];
}>();

const hasError = ref(false);
const error = ref<Error | null>(null);
const errorInfo = ref<string>('');
const retryCount = ref(0);
const maxRetries = ref(3);

const errorTitle = computed(() => {
  if (retryCount.value > 0) {
    return `${props.title} (Attempt ${retryCount.value + 1}/${maxRetries.value})`;
  }
  return props.title;
});

const errorMessage = computed(() => {
  if (error.value) {
    // Show user-friendly message for common errors
    if (error.value.message.includes('network') || error.value.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.value.message.includes('validation')) {
      return 'There was an issue with the data provided. Please check your input.';
    } else if (error.value.message.includes('permission')) {
      return 'You don\'t have permission to perform this action.';
    }
  }
  return props.fallbackMessage;
});

const errorDetails = computed(() => {
  if (!error.value) return '';

  return {
    message: error.value.message,
    name: error.value.name,
    stack: error.value.stack,
    info: errorInfo.value,
    timestamp: new Date().toISOString(),
    retryCount: retryCount.value
  };
});

// Capture errors from child components
onErrorCaptured((err, instance, info) => {
  hasError.value = true;
  error.value = err;
  errorInfo.value = info;

  // Call custom error handler if provided
  if (props.onError) {
    props.onError(err, instance, info);
  }

  // Emit error event
  emit('error', err, info);

  // Log to error tracking
  console.error('Error Boundary caught error:', {
    error: err,
    component: instance,
    info,
    timestamp: new Date().toISOString()
  });

  // Emit to global error bus
  errorBus.emitError({
    type: 'application',
    severity: 'high',
    message: err.message,
    source: 'ErrorBoundary',
    timestamp: new Date(),
    context: {
      component: instance,
      errorInfo: info,
      retryCount: retryCount.value
    },
    stack: err.stack
  });

  // Prevent error from propagating to global handler
  return false;
});

// Watch for error changes to auto-retry
watch(error, (newError) => {
  if (newError && retryCount.value < maxRetries.value) {
    // Auto-retry for network errors after a delay
    if (newError.message.includes('network') || newError.message.includes('fetch')) {
      setTimeout(() => {
        if (hasError.value) {
          handleRetry();
        }
      }, 2000 * (retryCount.value + 1)); // Exponential backoff
    }
  }
});

const handleRetry = () => {
  if (retryCount.value < maxRetries.value) {
    retryCount.value++;
    hasError.value = false;
    error.value = null;
    errorInfo.value = '';

    // Call custom retry handler if provided
    if (props.onRetry) {
      props.onRetry();
    }

    emit('retry');
  }
};

const handleReload = () => {
  window.location.reload();
};

const handleReset = () => {
  hasError.value = false;
  error.value = null;
  errorInfo.value = '';
  retryCount.value = 0;

  emit('reset');
};

// Expose methods for parent components
defineExpose({
  retry: handleRetry,
  reset: handleReset,
  hasError: computed(() => hasError.value),
  error: computed(() => error.value)
});
</script>
