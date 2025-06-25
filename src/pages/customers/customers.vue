<script lang="ts" setup>
defineOptions({
  name: "CustomersPage",
});

import { type Customer } from "@/customer/customer";
import { getCustomerService } from "@/customer/get-customer-service";
import { useOrderStore } from "@/order/order-store";
import { userTrackingService } from "@/user-tracking/singleton";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

const searchDocument = ref("");
const router = useRouter();
const orderStore = useOrderStore();
const customerFound = ref<Customer | null>(null);
const error = ref<string>("");
const isLoading = ref(false);

const onSubmit = async () => {
  if (searchDocument.value.trim() === "") {
    error.value = "Please enter a document to search for a customer.";
    return;
  }

  userTrackingService.track("customer_search", {
    document: searchDocument.value,
  });

  isLoading.value = true;
  error.value = "";
  customerFound.value = null;

  try {
    const customerService = await getCustomerService();
    const customer = await customerService.findByDocument(searchDocument.value);
    if (customer) {
      customerFound.value = customer;
    } else {
      error.value =
        "Customer not found. Would you like to create a new customer?";
    }
  } catch (err) {
    console.error("Error searching for customer:", err);
    error.value = "Failed to search for customer. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

const selectCustomer = async (customer: Customer) => {
  userTrackingService.track("customer_selected", {
    document: customer.document,
  });
  orderStore.selectCustomer(customer);
  router.push({ name: "home" });
};

const clearSearch = () => {
  searchDocument.value = "";
  customerFound.value = null;
  error.value = "";
};

const hasSearched = computed(() => searchDocument.value.trim() !== "");
</script>
<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
  >
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Header Section -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-4"
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h1
          class="text-3xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent mb-2"
        >
          Customer Selection
        </h1>
        <p class="text-zinc-600 max-w-lg mx-auto">
          Search for an existing customer by document ID or create a new
          customer profile
        </p>
      </div>

      <!-- Search Section -->
      <div
        class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8"
      >
        <form @submit.prevent="onSubmit" class="space-y-6">
          <div>
            <label
              for="search-input"
              class="block text-sm font-semibold text-zinc-100 mb-3"
            >
              Customer Document ID
            </label>
            <div class="relative search-container">
              <input
                id="search-input"
                v-model="searchDocument"
                type="text"
                placeholder="Enter customer document (ID, CPF, etc.)"
                class="w-full px-6 py-4 text-white bg-white/90 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 placeholder-zinc-300 text-lg"
                :disabled="isLoading"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-6">
                <svg
                  class="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              :disabled="!hasSearched || isLoading"
              class="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-zinc-400 disabled:to-zinc-500 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed loading-button"
            >
              <svg
                v-if="isLoading"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {{ isLoading ? "Searching..." : "Search Customer" }}
            </button>

            <button
              v-if="hasSearched"
              type="button"
              @click="clearSearch"
              class="bg-zinc-500 hover:bg-zinc-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
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
              Clear
            </button>
          </div>
        </form>
      </div>

      <!-- Results Section -->
      <div v-if="customerFound || error" class="mb-8">
        <!-- Customer Found -->
        <div
          v-if="customerFound"
          class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 customer-card"
        >
          <div class="text-center mb-6">
            <div
              class="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4"
            >
              <svg
                class="w-6 h-6 text-green-600"
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
            <h3 class="text-xl font-bold text-zinc-900 mb-2">
              Customer Found!
            </h3>
          </div>

          <div
            class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6"
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
                <h4 class="text-lg font-bold text-zinc-700">
                  {{ customerFound.name }}
                </h4>
                <p class="text-zinc-700">
                  Document: {{ customerFound.document }}
                </p>
              </div>
            </div>
          </div>

          <button
            @click="selectCustomer(customerFound)"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-zinc-400 disabled:to-zinc-500 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            <svg
              v-if="isLoading"
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
            {{ isLoading ? "Selecting..." : "Select This Customer" }}
          </button>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 error-card"
        >
          <div class="text-center">
            <div
              class="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4"
            >
              <svg
                class="w-6 h-6 text-red-600"
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
            </div>
            <h3 class="text-lg font-semibold text-red-800 mb-2">
              Customer Not Found
            </h3>
            <p class="text-red-600 mb-6">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div
        class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20"
      >
        <div class="text-center mb-6">
          <h3 class="text-xl font-bold text-zinc-900 mb-2">Quick Actions</h3>
          <p class="text-zinc-600">
            Create a new customer profile or browse existing customers
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RouterLink
            to="/customers/new"
            class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl group"
          >
            <svg
              class="w-5 h-5 group-hover:scale-110 transition-transform"
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
            Add New Customer
          </RouterLink>

          <RouterLink
            to="/customers/all"
            class="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl group"
          >
            <svg
              class="w-5 h-5 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            View All Customers
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations for customer selection */
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

/* Page entrance animation */
.min-h-screen > div {
  animation: fadeInUp 0.6s ease-out;
}

/* Staggered animations for sections */
.bg-white\/80:nth-child(2) {
  animation: fadeInUp 0.8s ease-out;
}

.bg-white\/80:nth-child(3) {
  animation: slideInRight 1s ease-out;
}

.bg-white\/80:nth-child(4) {
  animation: fadeInUp 1.2s ease-out;
}

/* Form input focus effects */
input:focus {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  transform: translateY(-2px);
}

/* Button hover effects */
button:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

/* Customer card animation */
.customer-card {
  animation: bounceIn 0.6s ease-out;
}

/* Error state animation */
.error-card {
  animation: bounceIn 0.6s ease-out;
}

/* Loading state */
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

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* Icon hover animations */
.group:hover svg {
  animation: pulse 1s infinite;
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

/* Search input enhancement */
.search-container {
  position: relative;
  overflow: hidden;
}

.search-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(34, 197, 94, 0.1) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.search-container:hover::before {
  transform: translateX(100%);
}

/* Status indicators */
.status-dot {
  animation: pulse 2s infinite;
}

/* Accessibility improvements */
button:focus,
input:focus,
a:focus {
  outline: 2px solid rgba(34, 197, 94, 0.5);
  outline-offset: 2px;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .grid-cols-1 {
    gap: 0.75rem;
  }

  .px-8 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .py-4 {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .bg-white\/80 {
    background: rgba(31, 41, 55, 0.8);
  }

  .text-zinc-900 {
    color: #f3f4f6;
  }

  .text-zinc-600 {
    color: #d1d5db;
  }

  .border-zinc-200 {
    border-color: #374151;
  }

  .bg-white\/90 {
    background: rgba(31, 41, 55, 0.9);
  }
}

/* Smooth transitions */
* {
  transition: all 0.2s ease;
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
  background: rgba(34, 197, 94, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(34, 197, 94, 0.5);
}
</style>
