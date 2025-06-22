<script setup lang="ts">
import AppModal from "@/components/app-modal.vue";
import ClockComponent from "@/components/clock.vue";
import HelpDialog from "@/components/help-dialog.vue";
import OrderDialog from "@/components/order-dialog.vue";
import SetupLoading from "@/components/setup-loading.vue";
import SyncStatusIndicator from "@/components/sync-status-indicator.vue";
import ToastContainer from "@/components/toast-container.vue";
import {
  createPOSShortcuts,
  useKeyboardShortcuts,
} from "@/composables/use-keyboard-shortcuts";
import { useNotificationStore } from "@/stores/notification-store";
import { useOrderStore } from "@/stores/order-store";
import { useSetupStore } from "@/stores/setup-store";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { productService } from "./product/singleton";
import { userTrackingService } from "./user-tracking/singleton";

const barcode = ref("");
const router = useRouter();
const barcodeInput = ref<HTMLInputElement | null>(null);
const showHelpDialog = ref(false);
const showOrderDialog = ref(false);
const orderStore = useOrderStore();
const notificationStore = useNotificationStore();
const setupStore = useSetupStore();
const isHome = computed(() => router.currentRoute.value.path === "/");
const isCheckout = computed(
  () => router.currentRoute.value.path === "/checkout",
);

const focusBarcode = () => {
  if (barcodeInput.value) {
    barcodeInput.value.focus();
  }
};

const removeOperator = () => {
  orderStore.unselectOperator();
  notificationStore.showInfo(
    "Operator removed",
    "Please select a new operator",
  );
};

const gotoOperatorSelection = () => {
  router.push("/operators");
};

const removeCustomer = () => {
  orderStore.unselectCustomer();
  notificationStore.showInfo("Customer removed");
};

const gotoCustomerSelection = () => {
  router.push("/customers");
};

const showOrderInfo = () => {
  showOrderDialog.value = true;
};

const closeOrderDialog = () => {
  showOrderDialog.value = false;
};

const gotoCheckout = () => {
  router.push("/checkout");
};

const completeOrder = async () => {
  userTrackingService.track("complete_order", {
    orderId: orderStore.id,
  });
  if (!orderStore.id) {
    notificationStore.showWarning("No Order", "No active order to complete");
    return;
  }

  if (!isCheckout.value) {
    gotoCheckout();
    return;
  }

  await orderStore.complete();
  router.push("/");
};

const abandonOrder = async () => {
  userTrackingService.track("abandon_order", {
    orderId: orderStore.id,
  });
  if (orderStore.id) {
    const result = await notificationStore.showConfirm(
      "Abandon Order",
      "Are you sure you want to abandon this order? All items will be lost.",
      { type: "warning" },
    );

    if (result.confirmed) {
      try {
        await orderStore.abandon();

        notificationStore.showInfo(
          "Order Abandoned",
          "Order has been cancelled",
        );
      } catch {
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

const openCustomers = () => {
  router.push("/customers");
};

const showHelp = () => {
  showHelpDialog.value = true;
};

const posShortcuts = createPOSShortcuts({
  focusBarcode,
  removeOperator,
  gotoOperatorSelection,
  removeCustomer,
  gotoCustomerSelection,
  completeOrder,
  abandonOrder,
  openProducts,
  openCustomers,
  showHelp,
  showOrderInfo,
});

useKeyboardShortcuts(posShortcuts);

const addProduct = async () => {
  if (barcode.value.trim() === "") {
    notificationStore.showWarning("Invalid Input", "Please enter a barcode.");
    return;
  }

  userTrackingService.track("add_product", {
    barcode: barcode.value,
  });

  try {
    const fetchedProduct = await productService.findProductByBarcode(
      barcode.value,
    );

    if (fetchedProduct) {
      await orderStore.addProduct(fetchedProduct);

      notificationStore.showSuccess(
        "Product Added",
        `${fetchedProduct.name} added to order`,
      );
      if (!isHome.value) {
        router.push("/");
      }
    } else {
      notificationStore.showWarning(
        "Product Not Found",
        "No product found with this barcode",
      );
    }
  } catch {
    notificationStore.showError(
      "Error",
      "Failed to fetch product. Please try again.",
    );
  }

  barcode.value = "";
};

onMounted(() => {
  setupStore.initializeSystem().catch((error) => {
    notificationStore.showError(
      "Setup Error",
      `Failed to initialize system setup. Please check your configuration. ${error}`,
    );
  });
});
</script>
<template>
  <SetupLoading v-if="setupStore.shouldBlockUI()" />

  <!-- Main App Content -->
  <div
    v-else
    class="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100"
  >
    <header
      class="backdrop-blur-md border-b border-white/20 shadow-xl sticky top-0 z-50"
    >
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between gap-4">
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
              class="text-lg font-bold text-zinc-600 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300 group-hover:text-zinc-800"
            >
              POS
            </h1>
          </RouterLink>

          <form
            @submit.prevent="addProduct"
            class="flex flex-1 items-center gap-2 flex-shrink-0"
          >
            <div
              class="flex w-full items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 border"
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
                class="w-full bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-500 text-sm rounded"
              />
            </div>
          </form>

          <div class="flex flex-col items-center gap-2 flex-shrink-0">
            <button
              @click="showOrderInfo"
              class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-lg transition-colors font-medium"
              title="Show Order Details (Alt+Shift+O)"
            >
              <div class="flex items-center gap-1">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Order</span>
              </div>
            </button>
          </div>

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
              {{ orderStore.customer ? orderStore.customer.name : "Walk-in" }}
            </span>
            <div class="flex gap-1 flex-shrink-0">
              <button
                v-if="orderStore.customer"
                @click="removeCustomer"
                class="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1 rounded transition-colors"
                title="Remove Customer (F4)"
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
                title="Customer Selection (F5)"
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

          <div class="flex items-center gap-4 flex-1 min-w-0">
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
                  (orderStore.operator && orderStore.operator.name) ||
                  "No operator"
                }}
              </span>
              <div class="flex gap-1 flex-shrink-0">
                <button
                  v-if="orderStore.operator"
                  @click="removeOperator"
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
                  title="Operator Selection (F3)"
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

            <div class="flex flex-col items-center gap-2 flex-shrink-0">
              <ClockComponent />

              <SyncStatusIndicator />
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <router-view />
    </main>

    <ToastContainer
      :toasts="notificationStore.activeToasts"
      @remove="(id: string) => notificationStore.removeToast(id)"
    />

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

    <OrderDialog
      :is-open="showOrderDialog"
      @close="closeOrderDialog"
      @complete="completeOrder"
      @abandon="abandonOrder"
    />

    <HelpDialog
      :show="showHelpDialog"
      :shortcuts="posShortcuts"
      @close="showHelpDialog = false"
    />
  </div>
</template>

<style scoped>
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

/* Smooth transitions */
* {
  transition: all 0.2s ease;
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
