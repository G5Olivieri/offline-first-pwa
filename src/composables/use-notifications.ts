import { ref, reactive } from 'vue'
import type { Toast } from '../components/toast-container.vue'

// Toast Management
const toasts = ref<Toast[]>([])

export const useNotifications = () => {
  const addToast = (toast: Omit<Toast, 'id' | 'startTime'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: Toast = {
      ...toast,
      id,
      startTime: Date.now(),
      duration: toast.duration ?? 4000 // Default 4 seconds
    }

    toasts.value.push(newToast)
    return id
  }

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearAllToasts = () => {
    toasts.value.splice(0)
  }

  // Convenience methods
  const showSuccess = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'success', title, message, duration })
  }

  const showError = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'error', title, message, duration: duration ?? 6000 })
  }

  const showWarning = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'warning', title, message, duration })
  }

  const showInfo = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'info', title, message, duration })
  }

  return {
    toasts: toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}

// Modal Management
interface ModalOptions {
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  persistent?: boolean
}

interface ModalResult {
  confirmed: boolean
  cancelled: boolean
}

const modalState = reactive({
  show: false,
  options: {} as ModalOptions,
  resolve: null as ((result: ModalResult) => void) | null
})

export const useModal = () => {
  const showModal = (options: ModalOptions): Promise<ModalResult> => {
    return new Promise((resolve) => {
      modalState.show = true
      modalState.options = { ...options }
      modalState.resolve = resolve
    })
  }

  const closeModal = (result: ModalResult = { confirmed: false, cancelled: true }) => {
    modalState.show = false
    if (modalState.resolve) {
      modalState.resolve(result)
      modalState.resolve = null
    }
  }

  const handleConfirm = () => {
    closeModal({ confirmed: true, cancelled: false })
  }

  const handleCancel = () => {
    closeModal({ confirmed: false, cancelled: true })
  }

  // Convenience methods
  const showConfirm = (title: string, message: string, options?: Partial<ModalOptions>) => {
    return showModal({
      type: 'confirm',
      title,
      message,
      showCancel: true,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      ...options
    })
  }

  const showAlert = (title: string, message: string, type: ModalOptions['type'] = 'info') => {
    return showModal({
      type,
      title,
      message,
      showCancel: false,
      confirmText: 'OK'
    })
  }

  return {
    modalState,
    showModal,
    closeModal,
    handleConfirm,
    handleCancel,
    showConfirm,
    showAlert
  }
}

// Global notification utilities
const notifications = useNotifications()
const modal = useModal()

// Export for global use
export const $notify = {
  success: notifications.showSuccess,
  error: notifications.showError,
  warning: notifications.showWarning,
  info: notifications.showInfo,
  clear: notifications.clearAllToasts
}

export const $modal = {
  show: modal.showModal,
  confirm: modal.showConfirm,
  alert: modal.showAlert
}

// Export reactive state for components
export const notificationState = {
  toasts: notifications.toasts,
  modal: modal.modalState
}
