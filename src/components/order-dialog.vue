<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click="close"
  >
    <div
      class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Current Order</h2>
        <button
          @click="close"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Order Info -->
      <div class="p-4 space-y-4">
        <!-- Order ID and Status -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Order ID</p>
            <p class="font-mono text-sm font-medium">#{{ orderStore.id?.slice(-9) || 'N/A' }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">Status</p>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {{ orderStatus }}
            </span>
          </div>
        </div>

        <!-- Customer and Operator Info -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Customer</p>
            <p class="text-sm font-medium">
              {{ customerStore.customer?.name || 'Walk-in Customer' }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Operator</p>
            <p class="text-sm font-medium">
              {{ operatorStore.operator?.name || 'No Operator' }}
            </p>
          </div>
        </div>

        <!-- Order Items -->
        <div>
          <p class="text-sm text-gray-600 mb-2">Items ({{ itemCount }})</p>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="item in orderItems"
              :key="item.product.barcode"
              class="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div class="flex-1">
                <p class="text-xs font-medium text-gray-900">{{ item.product.name }}</p>
                <p class="text-xs text-gray-500">{{ item.product.barcode }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs font-medium">${{ (item.quantity * item.product.price).toFixed(2) }}</p>
                <p class="text-xs text-gray-500">{{ item.quantity }}x ${{ item.product.price.toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="itemCount === 0" class="text-center py-4 text-gray-500">
            <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p class="text-sm">No items in order</p>
          </div>
        </div>

        <!-- Order Total -->
        <div class="border-t border-gray-200 pt-3">
          <div class="flex items-center justify-between">
            <p class="text-base font-semibold text-gray-900">Total</p>
            <p class="text-base font-semibold text-gray-900">${{ orderTotal.toFixed(2) }}</p>
          </div>
        </div>

        <!-- Timestamps -->
        <div class="text-xs text-gray-500 space-y-1">
          <p>Created: {{ formatDateTime(new Date().toISOString()) }}</p>
          <p v-if="lastUpdated">Updated: {{ formatDateTime(lastUpdated) }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 p-4 border-t border-gray-200">
        <button
          @click="handleCompleteOrder"
          :disabled="itemCount === 0 || isProcessing"
          class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          <span v-if="!isProcessing">{{ isCheckout ? 'Complete Order' : 'Go to Checkout' }}</span>
          <span v-else>Processing...</span>
        </button>

        <button
          @click="handleAbandonOrder"
          :disabled="isProcessing"
          class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          <span v-if="!isProcessing">Abandon Order</span>
          <span v-else>Processing...</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore } from '../stores/order-store';
import { useCustomerStore } from '../stores/customer-store';
import { useOperatorStore } from '../stores/operator-store';
import { useNotificationStore } from '../stores/notification-store';
import { analytics } from '../services/analytics-service';

interface Props {
  isOpen: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'complete'): void;
  (e: 'abandon'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();
const orderStore = useOrderStore();
const customerStore = useCustomerStore();
const operatorStore = useOperatorStore();
const notificationStore = useNotificationStore();

const isProcessing = ref(false);

// Computed properties
const isCheckout = computed(() => router.currentRoute.value.path === '/checkout');

const orderItems = computed(() => {
  return orderStore.values;
});

const itemCount = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + item.quantity, 0);
});

const orderTotal = computed(() => {
  return orderStore.total;
});

const orderStatus = computed(() => {
  if (!orderStore.id) return 'No Order';
  if (itemCount.value === 0) return 'Empty';
  return 'Active';
});

const lastUpdated = computed(() => {
  // This would need to be tracked in the order store
  return null; // Placeholder for now
});

// Methods
const close = () => {
  emit('close');
};

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return 'Invalid Date';
  }
};

const handleCompleteOrder = async () => {
  if (itemCount.value === 0) {
    notificationStore.showWarning('No Items', 'Cannot complete an empty order');
    return;
  }

  isProcessing.value = true;

  try {
    // Track dialog completion attempt
    analytics.trackUserAction({
      action: 'complete_order_from_dialog',
      category: 'order_management',
      label: isCheckout.value ? 'complete' : 'go_to_checkout',
      metadata: {
        orderId: orderStore.id || 'none',
        itemCount: itemCount.value,
        total: orderTotal.value,
        isCheckout: isCheckout.value,
      },
    });

    emit('complete');
    close();
  } catch (error) {
    console.error('Error completing order:', error);
    notificationStore.showError('Error', 'Failed to complete order');
  } finally {
    isProcessing.value = false;
  }
};

const handleAbandonOrder = async () => {
  if (itemCount.value === 0) {
    notificationStore.showWarning('No Order', 'No active order to abandon');
    return;
  }

  isProcessing.value = true;

  try {
    // Track dialog abandon attempt
    analytics.trackUserAction({
      action: 'abandon_order_from_dialog',
      category: 'order_management',
      label: 'user_initiated',
      metadata: {
        orderId: orderStore.id || 'none',
        itemCount: itemCount.value,
        total: orderTotal.value,
      },
    });

    emit('abandon');
    close();
  } catch (error) {
    console.error('Error abandoning order:', error);
    notificationStore.showError('Error', 'Failed to abandon order');
  } finally {
    isProcessing.value = false;
  }
};
</script>
