import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import type { Toast } from '../components/toast-container.vue';

interface ModalOptions {
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  persistent?: boolean;
}

interface ModalResult {
  confirmed: boolean;
  cancelled: boolean;
}

interface ModalState {
  show: boolean;
  options: ModalOptions;
  resolve: ((result: ModalResult) => void) | null;
  keydownHandler: ((event: KeyboardEvent) => void) | null;
}

export const useNotificationStore = defineStore('notifications', () => {
  // State
  const toasts = ref<Toast[]>([]);
  const modalState = reactive<ModalState>({
    show: false,
    options: {
      title: '',
      message: '',
      type: 'info',
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: false,
      persistent: false
    },
    resolve: null,
    keydownHandler: null
  });

  // Getters
  const activeToasts = computed(() => toasts.value.filter(toast => {
    if (!toast.duration) return true;
    const now = Date.now();
    return (now - (toast.startTime || 0)) < toast.duration;
  }));

  const hasActiveModal = computed(() => modalState.show);

  const toastCount = computed(() => toasts.value.length);

  const errorCount = computed(() =>
    toasts.value.filter(toast => toast.type === 'error').length
  );

  // Toast Actions
  const addToast = (toast: Omit<Toast, 'id' | 'startTime'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      startTime: Date.now(),
      duration: toast.duration ?? 4000 // Default 4 seconds
    };

    toasts.value.push(newToast);

    // Auto-remove toast after duration
    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(toast => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clearAllToasts = () => {
    toasts.value.splice(0);
  };

  const clearToastsByType = (type: Toast['type']) => {
    toasts.value = toasts.value.filter(toast => toast.type !== type);
  };

  // Convenience toast methods
  const showSuccess = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'success', title, message, duration });
  };

  const showError = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'error', title, message, duration: duration ?? 6000 });
  };

  const showErrorWithRetry = (
    title: string,
    message: string,
    retryFn: () => void,
    metadata?: Record<string, unknown>
  ) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 0, // Don't auto-dismiss error with retry
      actions: [
        {
          label: 'Retry',
          onClick: () => {
            retryFn();
            // Remove this specific toast after retry
          },
          style: 'primary'
        },
        {
          label: 'Dismiss',
          onClick: () => {
            // Toast will be removed by the action handler
          },
          style: 'secondary'
        }
      ],
      metadata
    });
  };

  const showWarning = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'warning', title, message, duration });
  };

  const showInfo = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'info', title, message, duration });
  };

  // Modal Actions
  const showModal = (options: ModalOptions): Promise<ModalResult> => {
    return new Promise((resolve) => {
      modalState.show = true;
      modalState.options = {
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        persistent: false,
        ...options
      };
      modalState.resolve = resolve;

      // Create keyboard event listener for Enter and Escape
      const handleKeydown = (event: KeyboardEvent) => {
        if (!modalState.show) return;

        switch (event.key) {
          case 'Enter':
            event.preventDefault();
            confirmModal();
            break;
          case 'Escape':
            if (!modalState.options.persistent) {
              event.preventDefault();
              cancelModal();
            }
            break;
        }
      };

      // Store the handler and add the event listener
      modalState.keydownHandler = handleKeydown;
      document.addEventListener('keydown', handleKeydown);
    });
  };

  const closeModal = () => {
    if (modalState.resolve) {
      modalState.resolve({ confirmed: false, cancelled: true });
    }
    modalState.show = false;

    // Remove keyboard event listener if it exists
    if (modalState.keydownHandler) {
      document.removeEventListener('keydown', modalState.keydownHandler);
      modalState.keydownHandler = null;
    }

    // Reset options after a short delay to allow component to unmount
    setTimeout(() => {
      modalState.options = {
        title: '',
        message: '',
        type: 'info',
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        persistent: false
      };
      modalState.resolve = null;
    }, 100);
  };

  const confirmModal = () => {
    if (modalState.resolve) {
      modalState.resolve({ confirmed: true, cancelled: false });
    }
    modalState.show = false;

    // Remove keyboard event listener if it exists
    if (modalState.keydownHandler) {
      document.removeEventListener('keydown', modalState.keydownHandler);
      modalState.keydownHandler = null;
    }

    // Reset options after a short delay to allow component to unmount
    setTimeout(() => {
      modalState.options = {
        title: '',
        message: '',
        type: 'info',
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        persistent: false
      };
      modalState.resolve = null;
    }, 100);
  };

  const cancelModal = () => {
    if (modalState.resolve) {
      modalState.resolve({ confirmed: false, cancelled: true });
    }
    modalState.show = false;

    // Remove keyboard event listener if it exists
    if (modalState.keydownHandler) {
      document.removeEventListener('keydown', modalState.keydownHandler);
      modalState.keydownHandler = null;
    }

    // Reset options after a short delay to allow component to unmount
    setTimeout(() => {
      modalState.options = {
        title: '',
        message: '',
        type: 'info',
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        persistent: false
      };
      modalState.resolve = null;
    }, 100);
  };

  // Convenience modal methods
  const showConfirm = (title: string, message: string, options?: Partial<ModalOptions>): Promise<ModalResult> => {
    return showModal({
      type: 'confirm',
      title,
      message,
      showCancel: true,
      ...options
    });
  };

  const showAlert = (title: string, message: string, type: ModalOptions['type'] = 'info'): Promise<ModalResult> => {
    return showModal({
      type,
      title,
      message,
      showCancel: false
    });
  };

  // Bulk operations
  const clearAllNotifications = () => {
    clearAllToasts();
    if (modalState.show && !modalState.options.persistent) {
      closeModal();
    }
  };

  // Auto-cleanup expired toasts (runs periodically)
  const cleanupExpiredToasts = () => {
    const now = Date.now();
    toasts.value = toasts.value.filter(toast => {
      if (!toast.duration || !toast.startTime) return true;
      return (now - toast.startTime) < toast.duration;
    });
  };

  // Statistics and monitoring
  const getStatistics = () => ({
    totalToasts: toasts.value.length,
    activeToasts: activeToasts.value.length,
    errorCount: errorCount.value,
    hasActiveModal: hasActiveModal.value,
    toastsByType: {
      success: toasts.value.filter(t => t.type === 'success').length,
      error: toasts.value.filter(t => t.type === 'error').length,
      warning: toasts.value.filter(t => t.type === 'warning').length,
      info: toasts.value.filter(t => t.type === 'info').length,
    }
  });

  // Start periodic cleanup
  const startCleanup = () => {
    setInterval(cleanupExpiredToasts, 5000); // Every 5 seconds
  };

  return {
    // State
    toasts,
    modalState,

    // Getters
    activeToasts,
    hasActiveModal,
    toastCount,
    errorCount,

    // Toast Actions
    addToast,
    removeToast,
    clearAllToasts,
    clearToastsByType,
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Modal Actions
    showModal,
    closeModal,
    confirmModal,
    cancelModal,
    showConfirm,
    showAlert,

    // Utility Actions
    clearAllNotifications,
    cleanupExpiredToasts,
    getStatistics,
    startCleanup
  };
});
