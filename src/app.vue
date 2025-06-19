<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppModal from "./components/app-modal.vue";
import HelpDialog from "./components/help-dialog.vue";
import SetupLoading from "./components/setup-loading.vue";
import ToastContainer from "./components/toast-container.vue";
import {
  createPOSShortcuts,
  useKeyboardShortcuts,
} from "./composables/use-keyboard-shortcuts";
import { createLogger } from "./services/logger-service";
import { useCustomerStore } from "./stores/customer-store";
import { useNotificationStore } from "./stores/notification-store";
import { useOnlineStatusStore } from "./stores/online-status-store";
import { useOperatorStore } from "./stores/operator-store";
import { useOrderStore } from "./stores/order-store";
import { useProductStore } from "./stores/product-store";
import { useSetupStore } from "./stores/setup-store";

const logger = createLogger("App");
const barcode = ref("");
const router = useRouter();
const clock = ref(
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
);
const barcodeInput = ref<HTMLInputElement | null>(null);
const showHelpDialog = ref(false);
const productStore = useProductStore();
const orderStore = useOrderStore();
const onlineStatusStore = useOnlineStatusStore();
const operatorStore = useOperatorStore();
const customerStore = useCustomerStore();
const notificationStore = useNotificationStore();
const setupStore = useSetupStore();
const isHome = computed(() => router.currentRoute.value.path === "/");

// Database status helper
const getSyncStatus = (dbName: string) => {
  const isOnline = onlineStatusStore.isOnline;
  const isSyncEnabled = onlineStatusStore.isSyncEnabled;

  if (!isOnline) {
    return {
      text: "Offline",
      color: "bg-yellow-400",
      textColor: "text-yellow-700",
      icon: "●",
    };
  }

  if (!isSyncEnabled) {
    return {
      text: "Disabled",
      color: "bg-gray-400",
      textColor: "text-gray-700",
      icon: "●",
    };
  }

  // Special case for orders - they use one-way sync (push only)
  if (dbName === "orders") {
    return {
      text: "Push Only",
      color: "bg-blue-400",
      textColor: "text-blue-700",
      icon: "↑",
    };
  }

  return {
    text: "Ready",
    color: "bg-green-400",
    textColor: "text-green-700",
    icon: "↕",
  };
};

// Database status computed property
const databaseStatus = computed(() => {
  return [
    {
      name: "Products",
      status: getSyncStatus("products"),
    },
    {
      name: "Orders",
      status: getSyncStatus("orders"),
    },
    {
      name: "Customers",
      status: getSyncStatus("customers"),
    },
    {
      name: "Operators",
      status: getSyncStatus("operators"),
    },
  ];
});

// Database status summary for compact display
const dbStatusSummary = computed(() => {
  const allReady = databaseStatus.value.every(
    (db) => db.status.text === "Ready" || db.status.text === "Push Only"
  );
  const hasOffline = databaseStatus.value.some(
    (db) => db.status.text === "Offline"
  );
  const hasDisabled = databaseStatus.value.some(
    (db) => db.status.text === "Disabled"
  );

  if (hasOffline) {
    return {
      text: "DB Offline",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      icon: "●",
    };
  }

  if (hasDisabled) {
    return {
      text: "DB Disabled",
      color: "bg-gray-500",
      textColor: "text-gray-700",
      icon: "●",
    };
  }

  if (allReady) {
    return {
      text: "DB Ready",
      color: "bg-green-500",
      textColor: "text-green-700",
      icon: "✓",
    };
  }

  return {
    text: "DB Mixed",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    icon: "~",
  };
});

// Notification system - removed unused modal variable

const focusBarcode = () => {
  if (barcodeInput.value) {
    barcodeInput.value.focus();
  }
};

const clearOperator = () => {
  operatorStore.clearOperator();
  notificationStore.showInfo(
    "Operator cleared",
    "Please select a new operator"
  );
};

const selectOperator = () => {
  router.push("/operators");
};

const clearCustomer = () => {
  customerStore.clearCustomer();
  notificationStore.showInfo("Customer cleared");
};

const selectCustomer = () => {
  router.push("/customers");
};

const completeOrder = async () => {
  if (orderStore.id) {
    try {
      await orderStore.complete();
      notificationStore.showSuccess(
        "Order Completed",
        "Thank you for your order!"
      );
    } catch (error) {
      logger.error("Error completing order:", error);
      notificationStore.showError("Error", "Failed to complete order");
    }
  } else {
    notificationStore.showWarning("No Order", "No active order to complete");
  }
};

const abandonOrder = async () => {
  if (orderStore.id) {
    const result = await notificationStore.showConfirm(
      "Abandon Order",
      "Are you sure you want to abandon this order? All items will be lost.",
      { type: "warning" }
    );
    if (result.confirmed) {
      try {
        await orderStore.abandon();
        notificationStore.showInfo(
          "Order Abandoned",
          "Order has been cancelled"
        );
      } catch (error) {
        logger.error("Error abandoning order:", error);
        notificationStore.showError("Error", "Failed to abandon order");
      }
    }
  } else {
    notificationStore.showWarning("No Order", "No active order to abandon");
  }
};

const openProducts = () => {
  router.push("/products");
};

const openOrders = () => {
  router.push("/orders");
};

const openCustomers = () => {
  router.push("/customers");
};

const showHelp = () => {
  showHelpDialog.value = true;
};

// Keyboard shortcuts
const posShortcuts = createPOSShortcuts({
  focusBarcode,
  clearOperator,
  selectOperator,
  clearCustomer,
  selectCustomer,
  completeOrder,
  abandonOrder,
  openProducts,
  openOrders,
  openCustomers,
  showHelp,
});

useKeyboardShortcuts(posShortcuts);

const addProduct = async () => {
  if (barcode.value.trim() === "") {
    notificationStore.showWarning("Invalid Input", "Please enter a barcode.");
    return;
  }

  try {
    const fetchedProduct = await productStore.findProductByBarcode(
      barcode.value
    );
    if (fetchedProduct) {
      await orderStore.addProduct(fetchedProduct);
      notificationStore.showSuccess(
        "Product Added",
        `${fetchedProduct.name} added to order`
      );
      if (!isHome.value) {
        router.push("/");
      }
    } else {
      notificationStore.showWarning(
        "Product Not Found",
        "No product found with this barcode"
      );
    }
  } catch (error) {
    logger.error("Error fetching product:", error);
    notificationStore.showError(
      "Error",
      "Failed to fetch product. Please try again."
    );
  }

  barcode.value = "";
};

let intervalId: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  intervalId = setInterval(() => {
    clock.value = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, 1000);

  // Initialize system setup
  setupStore.initializeSystem().catch((error) => {
    logger.error("Failed to initialize system:", error);
  });
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>
<template>
  <!-- Setup Loading Screen -->
  <SetupLoading v-if="setupStore.shouldBlockUI()" />

  <!-- Main App Content -->
  <div
    v-else
    class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
  >
    <!-- Compact One-Row Header -->
    <header
      class="bg-white/90 backdrop-blur-md border-b border-white/20 shadow-xl sticky top-0 z-50"
    >
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between gap-4">
          <!-- Logo -->
          <RouterLink
            to="/"
            class="flex items-center space-x-2 group flex-shrink-0"
          >
            <div
              class="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                />
              </svg>
            </div>
            <h1
              class="text-lg font-bold text-zinc-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300 group-hover:text-white"
            >
              POS
            </h1>
          </RouterLink>

          <!-- Barcode Scanner -->
          <form
            @submit.prevent="addProduct"
            class="flex flex-1 items-center gap-2 flex-shrink-0"
          >
            <div
              class="flex w-full items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2"
            >
              <svg
                class="w-4 h-4 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <input
                ref="barcodeInput"
                @keydown.escape="
                  (event) => {
                    (event.target as HTMLElement | null)?.blur();
                    barcode = '';
                  }
                "
                v-model="barcode"
                type="text"
                placeholder="Barcode (F1)"
                class="w-full text-white bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-500 text-sm"
              />
            </div>
            <button
              type="submit"
              class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-1"
              title="Add Product"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span class="hidden sm:inline">Add</span>
            </button>
          </form>

          <!-- Order Controls & Status -->
          <div class="flex flex-col items-center gap-2 flex-shrink-0">
            <!-- Order Status -->
            <div
              v-if="orderStore.id"
              class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-lg font-mono"
            >
              #{{ orderStore.id.slice(-9) }}
            </div>

            <!-- Order Actions -->
            <div class="flex gap-1">
              <button
                @click="completeOrder"
                class="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded transition-colors"
                title="Complete Order (F6)"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                @click="abandonOrder"
                class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-colors"
                title="Abandon Order (F7)"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1-1H6a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Customer -->
          <div
            class="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 min-w-0"
          >
            <svg
              class="w-4 h-4 text-green-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span class="text-sm font-medium text-gray-800 truncate">
              {{
                customerStore.customer ? customerStore.customer.name : "Walk-in"
              }}
            </span>
            <div class="flex gap-1 flex-shrink-0">
              <button
                v-if="customerStore.customer"
                @click="customerStore.clearCustomer"
                class="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1 rounded transition-colors"
                title="Clear Customer (F4)"
              >
                <svg
                  class="w-3 h-3"
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
              <RouterLink
                to="/customers"
                class="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded transition-colors flex items-center"
                title="Select Customer (F5)"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4M4 16l4-4"
                  />
                </svg>
              </RouterLink>
            </div>
          </div>

          <!-- User Info -->
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <!-- Operator -->
            <div
              class="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 min-w-0"
            >
              <svg
                class="w-4 h-4 text-blue-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span class="text-sm font-medium text-gray-800 truncate">
                {{
                  (operatorStore.operator && operatorStore.operator.name) ||
                  "No operator"
                }}
              </span>
              <div class="flex gap-1 flex-shrink-0">
                <button
                  v-if="operatorStore.operator"
                  @click="operatorStore.clearOperator"
                  class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-colors"
                  title="Logout (F2)"
                >
                  <svg
                    class="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
                <RouterLink
                  to="/operators"
                  class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-colors flex items-center"
                  title="Change Operator (F3)"
                >
                  <svg
                    class="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4M4 16l4-4"
                    />
                  </svg>
                </RouterLink>
              </div>
            </div>

            <!-- Status Indicators -->
            <div class="flex flex-col items-center gap-2 flex-shrink-0">
              <!-- Clock -->
              <div
                class="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-lg px-2 py-1 text-xs"
              >
                <svg
                  class="w-3 h-3 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span class="font-mono font-medium text-gray-800">{{
                  clock
                }}</span>
              </div>

              <!-- Online Status -->
              <div
                class="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-lg px-2 py-1 text-xs"
              >
                <div
                  v-if="onlineStatusStore.isOnline"
                  class="flex items-center gap-1"
                >
                  <div
                    class="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                  ></div>
                  <span class="font-medium text-green-700">Online</span>
                </div>
                <div v-else class="flex items-center gap-1">
                  <div
                    class="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                  ></div>
                  <span class="font-medium text-red-700">Offline</span>
                </div>
              </div>

              <!-- Database Status Summary -->
              <div
                class="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-lg px-2 py-1 text-xs cursor-help"
                :title="`Database Status: ${databaseStatus
                  .map((db) => `${db.name}: ${db.status.text}`)
                  .join(', ')}`"
              >
                <div
                  class="w-2 h-2 rounded-full animate-pulse"
                  :class="dbStatusSummary.color"
                ></div>
                <span class="font-medium" :class="dbStatusSummary.textColor">{{
                  dbStatusSummary.text
                }}</span>
                <span class="text-gray-500 ml-1">{{
                  dbStatusSummary.icon
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- Toast Notifications -->
    <ToastContainer
      :toasts="notificationStore.activeToasts"
      @remove="(id: string) => notificationStore.removeToast(id)"
    />

    <!-- Global Modal -->
    <AppModal
      :show="notificationStore.modalState.show"
      :type="notificationStore.modalState.options.type"
      :title="notificationStore.modalState.options.title"
      :message="notificationStore.modalState.options.message"
      :confirm-text="notificationStore.modalState.options.confirmText"
      :cancel-text="notificationStore.modalState.options.cancelText"
      :show-cancel="notificationStore.modalState.options.showCancel"
      :persistent="notificationStore.modalState.options.persistent"
      @confirm="notificationStore.confirmModal"
      @cancel="notificationStore.cancelModal"
      @close="notificationStore.closeModal"
    />

    <!-- Help Dialog -->
    <HelpDialog
      :show="showHelpDialog"
      :shortcuts="posShortcuts"
      @close="showHelpDialog = false"
    />
  </div>
</template>

<style scoped>
/* Compact header animations and effects */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Header animation */
header {
  animation: fadeInDown 0.6s ease-out;
}

/* Compact layout responsiveness */
@media (max-width: 1024px) {
  .flex-1 {
    min-width: 0;
  }

  .truncate {
    max-width: 120px;
  }

  .hidden.sm\\:inline {
    display: none !important;
  }
}

@media (max-width: 768px) {
  header .flex {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .w-32 {
    width: 100px;
  }

  .truncate {
    max-width: 80px;
  }

  .px-4 {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}

/* Glassmorphism effect */
.bg-white\/60 {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.bg-white\/90 {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
}

/* Button hover effects */
button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

/* Input focus effects */
input:focus {
  box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.2);
  outline: none;
}

/* Status indicator animations */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Logo hover effect */
.group:hover .bg-gradient-to-r {
  background: linear-gradient(to right, #3b82f6, #6366f1);
}

/* Smooth transitions */
* {
  transition: all 0.2s ease;
}

/* Order status badge */
.bg-blue-100 {
  background-color: #dbeafe;
  animation: slideIn 0.3s ease-out;
}

/* Button size consistency */
button {
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Text truncation improvements */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Focus improvements for accessibility */
button:focus,
input:focus,
a:focus {
  outline: 2px solid rgba(147, 51, 234, 0.5);
  outline-offset: 2px;
}

/* Compact spacing adjustments */
.gap-4 > * + * {
  margin-left: 1rem;
}

.gap-2 > * + * {
  margin-left: 0.5rem;
}

.gap-1 > * + * {
  margin-left: 0.25rem;
}

/* Icon consistency */
svg {
  flex-shrink: 0;
}

/* Mobile menu considerations */
@media (max-width: 640px) {
  .flex-shrink-0 {
    flex-shrink: 1;
  }

  .min-w-0 {
    min-width: 60px;
  }

  .text-lg {
    font-size: 1rem;
  }

  .px-3 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}

/* Performance optimizations */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Print styles */
@media print {
  header {
    position: static !important;
    box-shadow: none !important;
    background: white !important;
  }

  .backdrop-blur-md,
  .backdrop-blur-sm {
    backdrop-filter: none !important;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .bg-white\/90 {
    background: rgba(31, 41, 55, 0.9);
  }

  .bg-white\/60 {
    background: rgba(31, 41, 55, 0.6);
  }

  .text-gray-800 {
    color: #f3f4f6;
  }

  .text-gray-600 {
    color: #d1d5db;
  }

  .border-white\/20 {
    border-color: rgba(75, 85, 99, 0.2);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .bg-gradient-to-r {
    background: solid !important;
  }

  .text-transparent {
    color: inherit !important;
    background-clip: unset !important;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
