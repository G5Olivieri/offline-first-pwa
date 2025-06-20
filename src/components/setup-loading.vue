<template>
  <div class="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div class="max-w-md w-full mx-4">
      <!-- Logo or App Name -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">POS System</h1>
        <p class="text-gray-600">Setting up your workspace...</p>
      </div>

      <!-- Progress Card -->
      <div class="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
        <!-- Current Step -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">{{
              currentStepText
            }}</span>
            <span class="text-sm text-gray-500">{{ progress }}%</span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>

        <!-- Step Details -->
        <div class="space-y-3">
          <!-- Loading Products Step -->
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div
                class="w-5 h-5 rounded-full border-2"
                :class="getStepStatusClass(SetupStep.LOADING_PRODUCTS)"
              >
                <svg
                  v-if="isStepCompleted(SetupStep.LOADING_PRODUCTS)"
                  class="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div
                  v-else-if="isStepActive(SetupStep.LOADING_PRODUCTS)"
                  class="w-2 h-2 bg-blue-600 rounded-full animate-pulse mx-auto mt-0.5"
                ></div>
              </div>
            </div>
            <span class="text-sm text-gray-700">
              Loading products from database
              <span v-if="totalProducts > 0" class="text-gray-500"
                >({{ totalProducts }} products)</span
              >
            </span>
          </div>

          <!-- Building Search Index Step -->
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div
                class="w-5 h-5 rounded-full border-2"
                :class="getStepStatusClass(SetupStep.BUILDING_SEARCH_INDEX)"
              >
                <svg
                  v-if="isStepCompleted(SetupStep.BUILDING_SEARCH_INDEX)"
                  class="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div
                  v-else-if="isStepActive(SetupStep.BUILDING_SEARCH_INDEX)"
                  class="w-2 h-2 bg-blue-600 rounded-full animate-pulse mx-auto mt-0.5"
                ></div>
              </div>
            </div>
            <span class="text-sm text-gray-700">Building search index</span>
          </div>

          <!-- Completing Setup Step -->
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div
                class="w-5 h-5 rounded-full border-2"
                :class="getStepStatusClass(SetupStep.COMPLETED)"
              >
                <svg
                  v-if="isStepCompleted(SetupStep.COMPLETED)"
                  class="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div
                  v-else-if="isStepActive(SetupStep.COMPLETED)"
                  class="w-2 h-2 bg-blue-600 rounded-full animate-pulse mx-auto mt-0.5"
                ></div>
              </div>
            </div>
            <span class="text-sm text-gray-700">Finalizing setup</span>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-if="hasError"
          class="mt-6 p-4 bg-red-50 border border-red-200 rounded-md"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Setup Failed</h3>
              <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
            </div>
          </div>

          <div class="mt-4">
            <button
              @click="retrySetup"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry Setup
            </button>
          </div>
        </div>

        <!-- Loading Animation -->
        <div v-else class="mt-6 flex justify-center">
          <div class="flex space-x-1">
            <div
              class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style="animation-delay: 0ms"
            ></div>
            <div
              class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style="animation-delay: 150ms"
            ></div>
            <div
              class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style="animation-delay: 300ms"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSetupStore, SetupStep } from "@/stores/setup-store";

const setupStore = useSetupStore();

// Computed properties
const currentStepText = computed(
  () => setupStore.setupState.currentStepDescription,
);
const progress = computed(() => setupStore.setupState.progress);
const totalProducts = computed(() => setupStore.setupState.totalProducts);
const hasError = computed(() => setupStore.hasError());
const errorMessage = computed(
  () => setupStore.setupState.error || "An unknown error occurred",
);

// Step status helpers
const isStepActive = (step: SetupStep) => {
  return setupStore.setupState.currentStep === step;
};

const isStepCompleted = (step: SetupStep) => {
  const stepOrder = [
    SetupStep.LOADING_PRODUCTS,
    SetupStep.BUILDING_SEARCH_INDEX,
    SetupStep.COMPLETED,
  ];
  const currentIndex = stepOrder.indexOf(setupStore.setupState.currentStep);
  const stepIndex = stepOrder.indexOf(step);
  return (
    currentIndex > stepIndex ||
    (currentIndex === stepIndex &&
      setupStore.setupState.currentStep === SetupStep.COMPLETED)
  );
};

const getStepStatusClass = (step: SetupStep) => {
  if (isStepCompleted(step)) {
    return "border-green-500 bg-green-500";
  } else if (isStepActive(step)) {
    return "border-blue-500 bg-white";
  } else {
    return "border-gray-300 bg-white";
  }
};

// Actions
const retrySetup = async () => {
  await setupStore.retrySetup();
};
</script>
