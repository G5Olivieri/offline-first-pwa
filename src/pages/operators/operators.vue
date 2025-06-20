<script setup lang="ts">
defineOptions({
  name: "OperatorsPage",
});

import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification-store";
import { operatorService } from "@/services/operator-service";
import { useOrderStore } from "@/stores/order-store";
import type { Operator } from "@/types/operator";

const router = useRouter();
const operators = ref<Operator[]>([]);
const orderStore = useOrderStore();
const notificationStore = useNotificationStore();

const selectOperator = async (operator: Operator) => {
  try {
    orderStore.selectOperator(operator);
    router.push({ name: "home" });
  } catch {
    notificationStore.showError(
      "Failed to select operator",
      "Please try again later.",
    );
  }
};

onMounted(() => {
  operatorService.listOperators().then((result: Operator[]) => {
    operators.value = result;
  });
});
</script>
<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
  >
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Header Section -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-4"
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
        <h1
          class="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2"
        >
          Select Operator
        </h1>
        <p class="text-gray-600 max-w-md mx-auto">
          Choose an operator to continue with POS operations
        </p>
      </div>

      <!-- Operators Grid -->
      <div
        v-if="operators.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
        <div
          v-for="operator in operators"
          :key="operator._id"
          class="group relative"
        >
          <button
            type="button"
            @click="selectOperator(operator)"
            class="w-full p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300"
          >
            <!-- Operator Avatar -->
            <div class="flex flex-col items-center text-center">
              <div
                class="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
              >
                <span class="text-white font-bold text-xl">
                  {{ operator.name.charAt(0).toUpperCase() }}
                </span>
              </div>

              <!-- Operator Name -->
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                {{ operator.name }}
              </h3>

              <!-- Operator ID (subtle) -->
              <p class="text-xs text-gray-500 font-mono">
                ID: {{ operator._id }}
              </p>
            </div>

            <!-- Hover Effect -->
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"
            ></div>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div
          class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6"
        >
          <svg
            class="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          No Operators Found
        </h3>
        <p class="text-gray-500 mb-6 max-w-sm mx-auto">
          There are no operators available. Create a new operator to get
          started.
        </p>
        <router-link
          to="/operators/new"
          class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg
            class="w-5 h-5 mr-2"
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
          Create New Operator
        </router-link>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <router-link
          to="/operators/new"
          class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg
            class="w-5 h-5 mr-2"
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
          Add New Operator
        </router-link>

        <router-link
          to="/"
          class="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </router-link>
      </div>
    </div>
  </div>
</template>
