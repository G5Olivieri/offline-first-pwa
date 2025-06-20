<template>
  <div
    v-if="recommendations.length > 0"
    class="recommendation-container bg-white rounded-lg shadow-sm border border-gray-200 p-4"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">
        {{ title }}
      </h3>
      <button
        v-if="showDismiss"
        @click="handleDismissAll"
        class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        Dismiss
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
      ></div>
      <span class="ml-2 text-gray-600">Loading recommendations...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-600 mb-2">
        <svg
          class="w-8 h-8 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
      </div>
      <p class="text-gray-600">{{ error }}</p>
    </div>

    <!-- Recommendations Grid -->
    <div v-else class="space-y-3">
      <div
        v-for="recommendation in displayedRecommendations"
        :key="recommendation.id"
        class="recommendation-item group flex items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
        @click="handleRecommendationClick(recommendation)"
      >
        <!-- Product Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900 truncate">
                {{ recommendation.product.name }}
              </h4>
              <p class="text-xs text-gray-500 mt-1">
                {{ recommendation.reason }}
              </p>
              <div class="flex items-center mt-2">
                <span class="text-sm font-semibold text-green-600">
                  ${{ recommendation.product.price.toFixed(2) }}
                </span>
                <span
                  v-if="recommendation.product.stock > 0"
                  class="ml-2 text-xs text-gray-500"
                >
                  {{ recommendation.product.stock }} in stock
                </span>
                <span v-else class="ml-2 text-xs text-red-500">
                  Out of stock
                </span>
              </div>
            </div>

            <!-- Confidence Badge -->
            <div class="ml-3 flex-shrink-0">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="getConfidenceBadgeClass(recommendation.confidence)"
              >
                {{ Math.round(recommendation.confidence * 100) }}%
              </span>
            </div>
          </div>

          <!-- Tags -->
          <div
            v-if="
              recommendation.product.tags &&
              recommendation.product.tags.length > 0
            "
            class="mt-2"
          >
            <div class="flex flex-wrap gap-1">
              <span
                v-for="tag in recommendation.product.tags.slice(0, 3)"
                :key="tag"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div
          class="ml-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            @click.stop="handleAddToCart(recommendation)"
            :disabled="recommendation.product.stock <= 0"
            class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Add to Cart
          </button>
          <button
            @click.stop="handleDismiss(recommendation)"
            class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Dismiss this recommendation"
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
              ></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Show More Button -->
      <div
        v-if="recommendations.length > maxVisible && !showAll"
        class="text-center pt-2"
      >
        <button
          @click="showAll = true"
          class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Show {{ recommendations.length - maxVisible }} more recommendations
        </button>
      </div>

      <!-- Show Less Button -->
      <div
        v-if="showAll && recommendations.length > maxVisible"
        class="text-center pt-2"
      >
        <button
          @click="showAll = false"
          class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Show less
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { ProductRecommendation } from "@/types/recommendation";
import { RecommendationContext } from "@/types/recommendation";

interface Props {
  recommendations: ProductRecommendation[];
  title: string;
  context: RecommendationContext;
  isLoading?: boolean;
  error?: string | null;
  maxVisible?: number;
  showDismiss?: boolean;
}

interface Emits {
  (e: "add-to-cart", recommendation: ProductRecommendation): void;
  (e: "click-recommendation", recommendation: ProductRecommendation): void;
  (e: "dismiss-recommendation", recommendation: ProductRecommendation): void;
  (e: "dismiss-all"): void;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
  maxVisible: 4,
  showDismiss: false,
});

const emit = defineEmits<Emits>();

const showAll = ref(false);

// Computed
const displayedRecommendations = computed(() => {
  if (showAll.value) {
    return props.recommendations;
  }
  return props.recommendations.slice(0, props.maxVisible);
});

// Methods
function getConfidenceBadgeClass(confidence: number): string {
  if (confidence >= 0.8) {
    return "bg-green-100 text-green-800";
  } else if (confidence >= 0.6) {
    return "bg-yellow-100 text-yellow-800";
  } else {
    return "bg-gray-100 text-gray-800";
  }
}

async function handleRecommendationClick(
  recommendation: ProductRecommendation,
): Promise<void> {
  emit("click-recommendation", recommendation);
}

async function handleAddToCart(
  recommendation: ProductRecommendation,
): Promise<void> {
  emit("add-to-cart", recommendation);
}

async function handleDismiss(
  recommendation: ProductRecommendation,
): Promise<void> {
  emit("dismiss-recommendation", recommendation);
}

function handleDismissAll(): void {
  emit("dismiss-all");
}
</script>

<style scoped>
/* Custom styles can be added here as needed */
</style>
