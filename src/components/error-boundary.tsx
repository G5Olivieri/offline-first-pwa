import { defineComponent, ref, onErrorCaptured } from 'vue'
import type { ComponentPublicInstance } from 'vue'

interface ErrorInfo {
  error: Error
  errorInfo: string
  timestamp: Date
  userAgent: string
  url: string
}

export default defineComponent({
  name: 'ErrorBoundary',
  props: {
    fallback: {
      type: Function,
      default: null
    },
    onError: {
      type: Function,
      default: null
    }
  },
  setup(props, { slots }) {
    const hasError = ref(false)
    const errorInfo = ref<ErrorInfo | null>(null)
    const retryCount = ref(0)
    const maxRetries = 3

    const captureError = (error: Error, instance: ComponentPublicInstance | null, info: string) => {
      const errorData: ErrorInfo = {
        error,
        errorInfo: info,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      hasError.value = true
      errorInfo.value = errorData

      // Log error to console
      console.error('Error caught by boundary:', error)
      console.error('Error info:', info)
      console.error('Component instance:', instance)

      // Call custom error handler if provided
      if (props.onError) {
        props.onError(errorData)
      }

      // In development, you might want to send to error tracking service
      if (import.meta.env.DEV) {
        console.error('Full error details:', errorData)
      }
    }

    onErrorCaptured((error: Error, instance: ComponentPublicInstance | null, info: string) => {
      captureError(error, instance, info)
      return false // Prevent error from propagating
    })

    const retry = () => {
      if (retryCount.value < maxRetries) {
        retryCount.value++
        hasError.value = false
        errorInfo.value = null
      }
    }

    const reset = () => {
      hasError.value = false
      errorInfo.value = null
      retryCount.value = 0
    }

    return () => {
      if (hasError.value) {
        // Use custom fallback if provided
        if (props.fallback) {
          return props.fallback({
            error: errorInfo.value?.error,
            retry,
            reset,
            canRetry: retryCount.value < maxRetries
          })
        }

        // Default error UI
        return (
          <div class="min-h-[400px] flex items-center justify-center p-8">
            <div class="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-6">
              <div class="flex items-center justify-center mb-4">
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.793-1.381 2.465-2.896L18.893 5.382c-.297-1.378-1.54-2.382-2.995-2.382H8.102c-1.454 0-2.698 1.004-2.995 2.382L2.607 16.104C2.279 17.619 3.522 19 5.062 19z" />
                  </svg>
                </div>
              </div>

              <div class="text-center">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                  Something went wrong
                </h3>
                <p class="text-gray-600 mb-4 text-sm">
                  {errorInfo.value?.error.message || 'An unexpected error occurred'}
                </p>

                {import.meta.env.DEV && (
                  <details class="mb-4 text-left">
                    <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                      Technical Details
                    </summary>
                    <div class="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700 overflow-auto">
                      <div class="mb-2">
                        <strong>Error:</strong> {errorInfo.value?.error.name}
                      </div>
                      <div class="mb-2">
                        <strong>Message:</strong> {errorInfo.value?.error.message}
                      </div>
                      <div class="mb-2">
                        <strong>Stack:</strong>
                        <pre class="whitespace-pre-wrap mt-1">{errorInfo.value?.error.stack}</pre>
                      </div>
                      <div class="mb-2">
                        <strong>Info:</strong> {errorInfo.value?.errorInfo}
                      </div>
                      <div>
                        <strong>Time:</strong> {errorInfo.value?.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </details>
                )}

                <div class="flex gap-2">
                  {retryCount.value < maxRetries && (
                    <button
                      onClick={retry}
                      class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Try Again ({maxRetries - retryCount.value} left)
                    </button>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      return slots.default?.()
    }
  }
})
