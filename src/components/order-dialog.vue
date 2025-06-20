<template>
  <Teleport to="body">
    <Transition
      name="modal"
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click="close"
      >
        <Transition
          name="modal-content"
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 transform scale-90"
          enter-to-class="opacity-100 transform scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 transform scale-100"
          leave-to-class="opacity-0 transform scale-90"
        >
          <div
            v-if="isOpen"
            class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
            @click.stop
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between p-4 border-b border-gray-200"
            >
              <h2 class="text-lg font-semibold text-gray-900">Current Order</h2>
              <button
                @click="close"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  class="w-5 h-5"
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

            <!-- Order Info -->
            <div class="p-4 space-y-4">
              <!-- Order ID and Status -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Order ID</p>
                  <p class="font-mono text-sm font-medium">
                    #{{ orderStore.id?.slice(-9) || "N/A" }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-600">Status</p>
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ orderStatus }}
                  </span>
                </div>
              </div>

              <!-- Customer and Operator Info -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-600">Customer</p>
                  <p class="text-sm font-medium">
                    {{ orderStore.customer?.name || "Walk-in Customer" }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Operator</p>
                  <p class="text-sm font-medium">
                    {{ orderStore.operator?.name || "No Operator" }}
                  </p>
                </div>
              </div>

              <!-- Order Items -->
              <div>
                <p class="text-sm text-gray-600 mb-2">
                  Items ({{ itemCount }})
                </p>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                  <div
                    v-for="item in orderItems"
                    :key="item.product.barcode"
                    class="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div class="flex-1">
                      <p class="text-xs font-medium text-gray-900">
                        {{ item.product.name }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ item.product.barcode }}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs font-medium">
                        ${{ (item.quantity * item.product.price).toFixed(2) }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ item.quantity }}x ${{
                          item.product.price.toFixed(2)
                        }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Empty state -->
                <div
                  v-if="itemCount === 0"
                  class="text-center py-4 text-gray-500"
                >
                  <svg
                    class="w-8 h-8 mx-auto mb-2 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <p class="text-sm">No items in order</p>
                </div>
              </div>

              <!-- Order Total -->
              <div class="border-t border-gray-200 pt-3">
                <div class="flex items-center justify-between">
                  <p class="text-base font-semibold text-gray-900">Total</p>
                  <p class="text-base font-semibold text-gray-900">
                    ${{ orderTotal.toFixed(2) }}
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 p-4 border-t border-gray-200">
                <button
                  @click="handleCompleteOrder"
                  :disabled="itemCount === 0 || isProcessing"
                  class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  <span v-if="!isProcessing">{{
                    isCheckout ? "Complete Order (F6)" : "Go to Checkout (F6)"
                  }}</span>
                  <span v-else>Processing...</span>
                </button>

                <button
                  @click="handleAbandonOrder"
                  :disabled="isProcessing"
                  class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  <span v-if="!isProcessing">Abandon Order (F7)</span>
                  <span v-else>Processing...</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "../stores/notification-store";
import { useOrderStore } from "../stores/order-store";

interface Props {
  isOpen: boolean;
}

interface Emits {
  (e: "close"): void;
  (e: "complete"): void;
  (e: "abandon"): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();
const orderStore = useOrderStore();
const notificationStore = useNotificationStore();

const isProcessing = ref(false);

// Computed properties
const isCheckout = computed(
  () => router.currentRoute.value.path === "/checkout"
);

const orderItems = computed(() => {
  return orderStore.items;
});

const itemCount = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + item.quantity, 0);
});

const orderTotal = computed(() => {
  return orderStore.total;
});

const orderStatus = computed(() => {
  if (!orderStore.id) return "No Order";
  if (itemCount.value === 0) return "Empty";
  return "Active";
});

// Methods
const close = () => {
  emit("close");
};

const handleCompleteOrder = async () => {
  if (itemCount.value === 0) {
    notificationStore.showWarning("No Items", "Cannot complete an empty order");
    return;
  }

  isProcessing.value = true;

  try {
    emit("complete");
    close();
  } catch (error) {
    console.error("Error completing order:", error);
    notificationStore.showError("Error", "Failed to complete order");
  } finally {
    isProcessing.value = false;
  }
};

const handleAbandonOrder = async () => {
  if (itemCount.value === 0) {
    notificationStore.showWarning("No Order", "No active order to abandon");
    return;
  }

  isProcessing.value = true;

  try {
    emit("abandon");
    close();
  } catch (error) {
    console.error("Error abandoning order:", error);
    notificationStore.showError("Error", "Failed to abandon order");
  } finally {
    isProcessing.value = false;
  }
};

// Keyboard event handling
const handleKeyDown = (event: KeyboardEvent) => {
  if (["F6", "F7", "Escape"].includes(event.key)) {
    close();
  }
};

// Setup keyboard event listeners
onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
/* Modal backdrop transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Modal content transitions */
.modal-content-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-content-leave-active {
  transition: all 0.2s ease-in;
}

.modal-content-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.modal-content-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}
</style>
