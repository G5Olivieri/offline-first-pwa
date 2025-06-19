<script lang="ts" setup>
defineOptions({
  name: 'CheckoutPage'
});

import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useCustomerStore } from "../../stores/customer-store";
import { useOrderStore } from "../../stores/order-store";
import { formatCurrency } from "../../config/env";

const customerStore = useCustomerStore();
const orderStore = useOrderStore();
const router = useRouter();
const isProcessing = ref(false);

const formatPrice = (price: number) => {
  return formatCurrency(price);
};

const hasItems = computed(
  () => orderStore.items && orderStore.items.length > 0
);
const canProceed = computed(() => {
  if (!hasItems.value) return false;
  if (orderStore.paymentMethod === "cash") {
    return orderStore.amount && !orderStore.amountError;
  }
  return true;
});

const processPayment = async () => {
  if (!canProceed.value) return;

  isProcessing.value = true;
  try {
    await orderStore.complete();
    // Redirect to success page or home
    router.push("/");
  } catch (error) {
    console.error("Payment processing failed:", error);
    // Handle error
  } finally {
    isProcessing.value = false;
  }
};

const goBack = () => {
  router.push("/");
};
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100"
  >
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Header Section -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-4"
        >
          <svg
            class="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <h1
          class="text-3xl font-bold bg-gradient-to-r from-zinc-800 to-zinc-600 bg-clip-text text-transparent mb-2"
        >
          Checkout
        </h1>
        <p class="text-zinc-900 max-w-lg mx-auto">
          Review your order and complete the payment process
        </p>
      </div>

      <!-- No Items State -->
      <div v-if="!hasItems" class="text-center py-16">
        <div
          class="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svg
            class="w-12 h-12 text-zinc-400"
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
        </div>
        <h2 class="text-xl font-semibold text-zinc-900 mb-4">
          Your cart is empty
        </h2>
        <p class="text-zinc-700 mb-6">
          Add some products to your cart before proceeding to checkout
        </p>
        <button
          @click="goBack"
          class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Shopping
        </button>
      </div>

      <!-- Checkout Content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Order Summary Section -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer Information -->
          <div
            class="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
          >
            <div class="flex items-center space-x-3 mb-4">
              <svg
                class="w-5 h-5 text-green-600"
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
              <h2 class="text-xl font-bold text-zinc-800">
                Customer Information
              </h2>
            </div>

            <div
              v-if="customerStore.customer"
              class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4"
            >
              <div class="flex items-center space-x-4">
                <div
                  class="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-white"
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
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-zinc-700">
                    {{ customerStore.customer.name }}
                  </h3>
                  <p class="text-zinc-700 text-sm">
                    Document: {{ customerStore.customer.document }}
                  </p>
                </div>
                <div class="flex items-center text-green-600">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div
              v-else
              class="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4"
            >
              <div class="flex items-center space-x-4">
                <div
                  class="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-white"
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
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-zinc-700">Walk-in Customer</h3>
                  <p class="text-zinc-700 text-sm">
                    No customer profile selected
                  </p>
                </div>
                <RouterLink
                  to="/customers"
                  class="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
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
                  Add Customer
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- Order Items -->
          <div
            class="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
          >
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-blue-600"
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
                <h2 class="text-xl font-bold text-zinc-800">Order Summary</h2>
              </div>
              <span
                class="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                {{ orderStore.items.length }}
                {{ orderStore.items.length === 1 ? "item" : "items" }}
              </span>
            </div>

            <div class="space-y-4">
              <div
                v-for="item in orderStore.items"
                :key="item.product._id"
                class="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-colors"
              >
                <div class="flex items-center space-x-4 flex-1">
                  <div
                    class="w-12 h-12 bg-gradient-to-r from-zinc-200 to-zinc-300 rounded-xl flex items-center justify-center"
                  >
                    <svg
                      class="w-6 h-6 text-zinc-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-zinc-800">
                      {{ item.product.name }}
                    </h3>
                    <p class="text-sm text-zinc-600">
                      {{ formatPrice(item.product.price) }} each
                    </p>
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  <div class="text-center">
                    <p class="text-sm text-zinc-500">Qty</p>
                    <p class="font-bold text-zinc-800">{{ item.quantity }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-zinc-500">Subtotal</p>
                    <p class="font-bold text-zinc-800">
                      {{ formatPrice(orderStore.calculateTotal(item)) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Section -->
        <div class="lg:col-span-1">
          <div
            class="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20 sticky top-8"
          >
            <!-- Order Total -->
            <div class="border-b border-zinc-200 pb-6 mb-6">
              <div class="flex items-center space-x-3 mb-4">
                <svg
                  class="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <h3 class="text-lg font-bold text-zinc-800">Order Total</h3>
              </div>
              <div class="text-center">
                <p
                  class="text-3xl font-bold bg-gradient-to-r from-blue-100 to-indigo-600 bg-clip-text text-transparent"
                >
                  {{ formatPrice(orderStore.total) }}
                </p>
                <p class="text-sm text-zinc-500 mt-1">Total amount due</p>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="mb-6">
              <div class="flex items-center space-x-3 mb-4">
                <svg
                  class="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <h3 class="text-lg font-bold text-zinc-800">Payment Method</h3>
              </div>

              <div class="space-y-3">
                <label
                  class="flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-zinc-50 group"
                  :class="
                    orderStore.paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-zinc-200'
                  "
                >
                  <input
                    type="radio"
                    v-model="orderStore.paymentMethod"
                    value="card"
                    class="sr-only"
                  />
                  <div class="flex items-center space-x-3 w-full">
                    <div
                      class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center"
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
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <div class="flex-1">
                      <p
                        class="font-semibold"
                        :class="{
                          'text-blue-500': orderStore.paymentMethod === 'card',
                          'text-zinc-200': orderStore.paymentMethod !== 'card',
                          'group-hover:text-zinc-700':
                            orderStore.paymentMethod !== 'card',
                        }"
                      >
                        Card Payment
                      </p>
                      <p
                        class="text-sm"
                        :class="{
                          'text-blue-500': orderStore.paymentMethod === 'card',
                          'text-zinc-300': orderStore.paymentMethod !== 'card',
                          'group-hover:text-zinc-700':
                            orderStore.paymentMethod !== 'card',
                        }"
                      >
                        Credit/Debit card
                      </p>
                    </div>
                    <div
                      v-if="orderStore.paymentMethod === 'card'"
                      class="text-blue-500"
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                </label>

                <label
                  class="flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-zinc-50 group"
                  :class="
                    orderStore.paymentMethod === 'cash'
                      ? 'border-green-500 bg-green-50'
                      : 'border-zinc-200'
                  "
                >
                  <input
                    type="radio"
                    v-model="orderStore.paymentMethod"
                    value="cash"
                    class="sr-only"
                  />
                  <div class="flex items-center space-x-3 w-full">
                    <div
                      class="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center"
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
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div class="flex-1">
                      <p
                        class="font-semibold"
                        :class="{
                          'text-green-500': orderStore.paymentMethod === 'cash',
                          'text-zinc-200': orderStore.paymentMethod !== 'cash',
                          'group-hover:text-zinc-700':
                            orderStore.paymentMethod !== 'cash',
                        }"
                      >
                        Cash Payment
                      </p>
                      <p
                        class="text-sm"
                        :class="{
                          'text-green-500': orderStore.paymentMethod === 'cash',
                          'text-zinc-300': orderStore.paymentMethod !== 'cash',
                          'group-hover:text-zinc-700':
                            orderStore.paymentMethod !== 'cash',
                        }"
                      >
                        Pay with cash
                      </p>
                    </div>
                    <div
                      v-if="orderStore.paymentMethod === 'cash'"
                      class="text-green-500"
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Cash Payment Details -->
            <div v-if="orderStore.paymentMethod === 'cash'" class="mb-6">
              <div
                class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 space-y-4"
              >
                <div>
                  <label
                    for="cash-amount"
                    class="block text-sm font-semibold text-zinc-700 mb-2"
                  >
                    Cash Amount Received
                  </label>
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    >
                      <span class="text-zinc-500 text-lg">$</span>
                    </div>
                    <input
                      id="cash-amount"
                      type="number"
                      step="0.01"
                      v-model="orderStore.amount"
                      placeholder="0.00"
                      class="w-full pl-8 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-lg font-semibold"
                      :class="orderStore.amountError ? 'border-red-500' : ''"
                    />
                  </div>
                  <p
                    v-if="orderStore.amountError"
                    class="text-red-600 text-sm mt-2 flex items-center gap-1"
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    {{ orderStore.amountError }}
                  </p>
                </div>

                <div
                  v-if="orderStore.change !== null"
                  class="bg-white rounded-xl p-4 border-l-4 border-green-500"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <svg
                        class="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      <span class="font-semibold text-zinc-800"
                        >Change Due:</span
                      >
                    </div>
                    <span class="text-2xl font-bold text-green-600">{{
                      formatPrice(orderStore.change)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <button
                @click="processPayment"
                :disabled="!canProceed || isProcessing"
                class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-zinc-400 disabled:to-zinc-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                <svg
                  v-if="isProcessing"
                  class="animate-spin w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <svg
                  v-else
                  class="w-5 h-5"
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
                {{ isProcessing ? "Processing..." : "Complete Payment" }}
              </button>

              <button
                @click="goBack"
                :disabled="isProcessing"
                class="w-full bg-zinc-500 hover:bg-zinc-600 disabled:bg-zinc-400 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Checkout page animations and effects */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Page entrance animations */
.min-h-screen {
  animation: fadeInUp 0.6s ease-out;
}

/* Staggered animations for sections */
.lg\\:col-span-2 {
  animation: slideInLeft 0.8s ease-out;
}

.lg\\:col-span-1 {
  animation: slideInRight 0.8s ease-out;
}

/* Card hover effects */
.bg-white\/80 {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.bg-white\/80:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* Order item hover effects */
.bg-zinc-50 {
  transition: all 0.2s ease;
}

.bg-zinc-50:hover {
  transform: translateX(4px);
}

/* Button animations */
button {
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

/* Payment method selection effects */
.border-2 {
  transition: all 0.3s ease;
}

.border-blue-500 {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.border-green-500 {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

/* Radio button custom styling */
input[type="radio"]:checked + div {
  animation: bounceIn 0.3s ease-out;
}

/* Cash input focus effects */
#cash-amount:focus {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  transform: translateY(-2px);
}

/* Change due animation */
.border-l-4 {
  animation: slideInLeft 0.5s ease-out;
}

/* Loading button effect */
.loading-button {
  position: relative;
  overflow: hidden;
}

.loading-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: shimmer 2s infinite;
}

/* Gradient text animation */
.bg-clip-text {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Icon hover animations */
svg {
  transition: all 0.2s ease;
}

.group:hover svg,
button:hover svg {
  transform: scale(1.1);
}

/* Empty state animation */
.empty-cart {
  animation: fadeInUp 0.8s ease-out;
}

/* Sticky payment panel */
.sticky {
  transition: all 0.3s ease;
}

/* Total amount emphasis */
.text-3xl {
  animation: pulse 2s infinite;
}

/* Error state styling */
.border-red-500 {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

/* Success states */
.text-green-600 {
  animation: pulse 1s ease-in-out;
}

/* Mobile responsiveness */
@media (max-width: 1024px) {
  .lg\\:col-span-2,
  .lg\\:col-span-1 {
    animation: fadeInUp 0.6s ease-out;
  }

  .sticky {
    position: relative;
    top: auto;
  }
}

@media (max-width: 640px) {
  .grid-cols-1 {
    gap: 1rem;
  }

  .px-6 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .py-4 {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }

  .text-3xl {
    font-size: 2rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .bg-white\/80 {
    background: rgba(31, 41, 55, 0.8);
  }

  .text-zinc-800 {
    color: #f3f4f6;
  }

  .text-zinc-600 {
    color: #d1d5db;
  }

  .text-zinc-500 {
    color: #9ca3af;
  }

  .border-zinc-200 {
    border-color: #374151;
  }

  .bg-zinc-50 {
    background: rgba(55, 65, 81, 0.5);
  }

  .bg-white {
    background: #374151;
  }
}

/* Accessibility improvements */
button:focus,
input:focus,
label:focus {
  outline: 2px solid rgba(59, 130, 246, 0.5);
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .bg-gradient-to-r {
    background: solid;
  }

  .text-transparent {
    color: inherit;
    background-clip: unset;
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

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5);
}

/* Print styles */
@media print {
  .min-h-screen {
    min-height: auto;
  }

  .bg-gradient-to-br {
    background: white;
  }

  .shadow-xl,
  .shadow-lg {
    box-shadow: none;
  }

  button {
    display: none;
  }
}
</style>
