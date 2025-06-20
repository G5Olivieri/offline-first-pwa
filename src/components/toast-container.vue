<template>
  <div
    class="fixed top-4 right-4 z-50 max-w-sm w-full pointer-events-none"
    role="alert"
    aria-live="polite"
  >
    <TransitionGroup name="toast" tag="div" class="space-y-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 pointer-events-auto transform transition-all duration-300"
        :class="getToastClasses(toast.type)"
      >
        <div class="flex items-start">
          <div
            class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3"
            :class="getIconBgClass(toast.type)"
          >
            <component
              :is="getIconComponent(toast.type)"
              class="w-4 h-4"
              :class="getIconClass(toast.type)"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900">{{ toast.title }}</div>
            <div v-if="toast.message" class="text-sm text-gray-600 mt-1">
              {{ toast.message }}
            </div>
            <!-- Actions -->
            <div
              v-if="toast.actions && toast.actions.length > 0"
              class="mt-3 flex space-x-2"
            >
              <button
                v-for="action in toast.actions"
                :key="action.label"
                @click="handleActionClick(action, toast.id)"
                class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                :class="getActionClasses(action.style || 'secondary')"
              >
                {{ action.label }}
              </button>
            </div>
          </div>
          <button
            @click="removeToast(toast.id)"
            class="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div
          v-if="toast.duration && toast.duration > 0"
          class="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden"
        >
          <div
            class="h-full bg-current rounded-full transition-all"
            :class="getProgressClass(toast.type)"
            :style="{ width: `${getProgress(toast)}%` }"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, onUnmounted, ref } from "vue";

export interface ToastAction {
  label: string;
  action: () => void;
  style?: "primary" | "secondary" | "danger";
}

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  startTime?: number;
  actions?: ToastAction[];
  metadata?: Record<string, unknown>;
}

interface Props {
  toasts: Toast[];
}

interface Emits {
  (e: "remove", id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const now = ref(Date.now());
let intervalId: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = Date.now();

    // Auto-remove expired toasts
    props.toasts.forEach((toast) => {
      if (toast.duration && toast.startTime) {
        const elapsed = now.value - toast.startTime;
        if (elapsed >= toast.duration) {
          removeToast(toast.id);
        }
      }
    });
  }, 100);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

const removeToast = (id: string) => {
  emit("remove", id);
};

const handleActionClick = (action: ToastAction, toastId: string) => {
  // Execute the action
  action.action();

  // Remove the toast after action is executed (optional behavior)
  // You can modify this based on whether you want the toast to persist
  removeToast(toastId);
};

const getActionClasses = (style: ToastAction["style"] = "secondary") => {
  const classes = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500",
  };
  return classes[style];
};

const getProgress = (toast: Toast): number => {
  if (!toast.duration || !toast.startTime) return 0;
  const elapsed = now.value - toast.startTime;
  return Math.max(0, 100 - (elapsed / toast.duration) * 100);
};

const getToastClasses = (type: Toast["type"]) => {
  const classes = {
    success: "border-l-4 border-green-500",
    error: "border-l-4 border-red-500",
    warning: "border-l-4 border-yellow-500",
    info: "border-l-4 border-blue-500",
  };
  return classes[type];
};

const getIconBgClass = (type: Toast["type"]) => {
  const classes = {
    success: "bg-green-100",
    error: "bg-red-100",
    warning: "bg-yellow-100",
    info: "bg-blue-100",
  };
  return classes[type];
};

const getIconClass = (type: Toast["type"]) => {
  const classes = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };
  return classes[type];
};

const getProgressClass = (type: Toast["type"]) => {
  const classes = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };
  return classes[type];
};

const getIconComponent = (type: Toast["type"]) => {
  const icons = {
    success: () =>
      h(
        "svg",
        {
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M5 13l4 4L19 7",
          }),
        ],
      ),
    error: () =>
      h(
        "svg",
        {
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M6 18L18 6M6 6l12 12",
          }),
        ],
      ),
    warning: () =>
      h(
        "svg",
        {
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.793-1.381 2.465-2.896L18.893 5.382c-.297-1.378-1.54-2.382-2.995-2.382H8.102c-1.454 0-2.698 1.004-2.995 2.382L2.607 16.104C2.279 17.619 3.522 19 5.062 19z",
          }),
        ],
      ),
    info: () =>
      h(
        "svg",
        {
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
          }),
        ],
      ),
  };

  return icons[type] || icons.info;
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
