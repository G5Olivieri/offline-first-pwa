<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-600">Finding related products...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-6">
      <div class="bg-red-50 rounded-lg p-4">
        <svg class="w-8 h-8 text-red-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-sm text-red-600">{{ error }}</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="recommendations.length === 0" class="text-center py-6">
      <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
      </svg>
      <p class="text-sm text-gray-500">No related products found</p>
    </div>

    <!-- Recommendations List -->
    <div v-else class="space-y-3">
      <div
        v-for="product in recommendations.slice(0, displayLimit)"
        :key="product._id"
        class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        @click="navigateToProduct(product._id)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-medium text-gray-900 truncate" :title="product.name">
              {{ product.name }}
            </h4>
            <p class="text-xs text-gray-500 mt-1">{{ product.barcode }}</p>

            <!-- Category or manufacturer if available -->
            <div class="flex items-center gap-2 mt-2">
              <span v-if="product.category" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {{ product.category }}
              </span>
              <span v-if="product.manufacturer" class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {{ product.manufacturer }}
              </span>
            </div>
          </div>

          <div class="flex-shrink-0 text-right">
            <p class="text-sm font-semibold text-green-600">${{ product.price }}</p>
            <p class="text-xs text-gray-500">{{ product.stock }} in stock</p>
          </div>
        </div>

        <!-- Quick action buttons -->
        <div class="flex gap-2 mt-3">
          <button
            @click.stop="addToOrder(product)"
            :disabled="product.stock === 0"
            class="flex-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-3 rounded transition-colors disabled:cursor-not-allowed"
          >
            {{ product.stock === 0 ? 'Out of Stock' : 'Add to Order' }}
          </button>
          <button
            @click.stop="navigateToProduct(product._id)"
            class="text-xs bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded transition-colors"
          >
            View
          </button>
        </div>
      </div>

      <!-- Show more button if there are more recommendations -->
      <div v-if="hasMore" class="text-center pt-2">
        <button
          @click="loadMore"
          :disabled="isLoadingMore"
          class="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
        >
          {{ isLoadingMore ? 'Loading...' : 'Show More' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "ProductDetailRecommendations",
});

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Product } from '../types/product';
import { RecommendationContext, RecommendationType } from '../types/recommendation';
import { useRecommendationStore } from '../stores/recommendation-store';
import { useOrderStore } from '../stores/order-store';
import { useNotificationStore } from '../stores/notification-store';
import { createLogger } from '../services/logger-service';

interface Props {
  currentProduct: Product;
  maxRecommendations?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxRecommendations: 5,
});

const router = useRouter();
const recommendationStore = useRecommendationStore();
const orderStore = useOrderStore();
const notificationStore = useNotificationStore();
const logger = createLogger('ProductDetailRecommendations');

// State
const recommendations = ref<Product[]>([]);
const isLoading = ref(false);
const isLoadingMore = ref(false);
const error = ref<string | null>(null);
const displayLimit = ref(props.maxRecommendations);

// Computed properties
const hasMore = computed(() => {
  return recommendations.value.length > displayLimit.value;
});

// Methods
async function loadRecommendations(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    // Get product recommendations based on the current product
    const productRecommendations = await recommendationStore.getRecommendationsForProduct(props.currentProduct);

    // Extract the actual products from the recommendations
    recommendations.value = productRecommendations.map(rec => rec.product);
  } catch (err) {
    logger.error('Error loading recommendations:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load recommendations';
  } finally {
    isLoading.value = false;
  }
}

function loadMore(): void {
  displayLimit.value = Math.min(displayLimit.value + props.maxRecommendations, recommendations.value.length);
}

async function addToOrder(product: Product): Promise<void> {
  try {
    await orderStore.addProduct(product);
    notificationStore.showSuccess(
      'Product Added',
      `${product.name} has been added to the order.`
    );

    // Track the cross-sell/upsell action - create a recommendation object to track
    const recommendation = {
      id: `${props.currentProduct._id}-${product._id}`,
      product,
      type: RecommendationType.CROSS_SELL,
      context: RecommendationContext.PRODUCT_DETAIL,
      score: 1.0,
      confidence: 0.8,
      reason: 'Product detail page recommendation',
      created_at: new Date().toISOString()
    };

    await recommendationStore.trackRecommendationAddedToCart(recommendation, RecommendationContext.PRODUCT_DETAIL);
  } catch (err) {
    logger.error('Error adding product to order:', err);
    notificationStore.showError(
      'Add to Order Error',
      'Failed to add product to order. Please try again.'
    );
  }
}

function navigateToProduct(productId: string): void {
  // Track the recommendation click
  const clickedProduct = recommendations.value.find(p => p._id === productId);
  if (clickedProduct) {
    const recommendation = {
      id: `${props.currentProduct._id}-${productId}`,
      product: clickedProduct,
      type: RecommendationType.CROSS_SELL,
      context: RecommendationContext.PRODUCT_DETAIL,
      score: 1.0,
      confidence: 0.8,
      reason: 'Product detail page recommendation',
      created_at: new Date().toISOString()
    };

    recommendationStore.trackRecommendationClicked(recommendation, RecommendationContext.PRODUCT_DETAIL).catch((err: unknown) => {
      logger.warn('Failed to track recommendation click:', err);
    });
  }

  router.push(`/products/${productId}`);
}

// Lifecycle
onMounted(() => {
  loadRecommendations();
});
</script>

<style scoped>
/* Custom styles if needed */
</style>
