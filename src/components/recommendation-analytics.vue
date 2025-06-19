<template>
  <div class="recommendation-analytics bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-6">Recommendation Analytics</h2>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">Loading analytics...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-600 mb-2">
        <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <p class="text-gray-600">{{ error }}</p>
    </div>

    <!-- Analytics Dashboard -->
    <div v-else-if="analytics" class="space-y-6">
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">
            {{ analytics.total_recommendations_generated.toLocaleString() }}
          </div>
          <div class="text-sm text-gray-600">Total Recommendations</div>
        </div>

        <div class="bg-green-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-green-600">
            {{ (analytics.click_through_rate * 100).toFixed(1) }}%
          </div>
          <div class="text-sm text-gray-600">Click Through Rate</div>
        </div>

        <div class="bg-purple-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">
            {{ (analytics.conversion_rate * 100).toFixed(1) }}%
          </div>
          <div class="text-sm text-gray-600">Conversion Rate</div>
        </div>

        <div class="bg-orange-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-orange-600">
            ${{ analytics.revenue_attributed.toFixed(2) }}
          </div>
          <div class="text-sm text-gray-600">Revenue Attributed</div>
        </div>
      </div>

      <!-- Context Performance -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Performance by Context</h3>
        <div class="space-y-3">
          <div
            v-for="(performance, context) in analytics.context_performance"
            :key="context"
            class="flex items-center justify-between py-2 px-3 bg-white rounded border"
          >
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ formatContextName(context) }}</div>
              <div class="text-sm text-gray-500">
                {{ performance.impressions }} impressions •
                {{ performance.clicks }} clicks •
                {{ performance.conversions }} conversions
              </div>
            </div>
            <div class="text-right">
              <div class="font-semibold text-gray-900">
                {{ performance.impressions > 0 ? ((performance.clicks / performance.impressions) * 100).toFixed(1) : '0.0' }}%
              </div>
              <div class="text-xs text-gray-500">CTR</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Performing Types -->
      <div v-if="analytics.top_performing_types.length > 0" class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Performing Recommendation Types</h3>
        <div class="space-y-2">
          <div
            v-for="typePerformance in analytics.top_performing_types.slice(0, 5)"
            :key="typePerformance.type"
            class="flex items-center justify-between py-2 px-3 bg-white rounded border"
          >
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ formatTypeName(typePerformance.type) }}</div>
              <div class="text-sm text-gray-500">
                Performance Score: {{ typePerformance.performance_score.toFixed(2) }}
              </div>
            </div>
            <div class="text-right">
              <div class="font-semibold text-green-600">
                {{ (typePerformance.conversion_rate * 100).toFixed(1) }}%
              </div>
              <div class="text-xs text-gray-500">Conversion</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-4 border-t">
        <div class="text-sm text-gray-500">
          Last updated: {{ formatDate(analytics.last_updated) }}
        </div>
        <div class="space-x-2">
          <button
            @click="refreshAnalytics"
            :disabled="isLoading"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Refresh
          </button>
          <button
            @click="exportAnalytics"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Export
          </button>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="text-center py-8">
      <div class="text-gray-400 mb-2">
        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      </div>
      <p class="text-gray-600">No analytics data available yet</p>
      <p class="text-sm text-gray-500 mt-1">Analytics will appear as recommendations are generated and tracked</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { RecommendationMetrics } from '../types/recommendation';
import { RecommendationContext, RecommendationType } from '../types/recommendation';
import { useRecommendationStore } from '../stores/recommendation-store';

const recommendationStore = useRecommendationStore();

// State
const analytics = ref<RecommendationMetrics | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Methods
async function loadAnalytics(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    analytics.value = await recommendationStore.getRecommendationAnalytics();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load analytics';
  } finally {
    isLoading.value = false;
  }
}

async function refreshAnalytics(): Promise<void> {
  await loadAnalytics();
}

function exportAnalytics(): void {
  if (!analytics.value) return;

  const dataStr = JSON.stringify(analytics.value, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `recommendation-analytics-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function formatContextName(context: string): string {
  const contextNames: Record<RecommendationContext, string> = {
    [RecommendationContext.CHECKOUT]: 'Checkout',
    [RecommendationContext.PRODUCT_DETAIL]: 'Product Detail',
    [RecommendationContext.CUSTOMER_PROFILE]: 'Customer Profile',
    [RecommendationContext.HOMEPAGE]: 'Homepage',
    [RecommendationContext.CATEGORY_BROWSE]: 'Category Browse',
    [RecommendationContext.SEARCH_RESULTS]: 'Search Results',
    [RecommendationContext.LOW_STOCK_ALERT]: 'Low Stock Alert',
  };

  return contextNames[context as RecommendationContext] || context;
}

function formatTypeName(type: string): string {
  const typeNames: Record<RecommendationType, string> = {
    [RecommendationType.CROSS_SELL]: 'Cross-sell',
    [RecommendationType.UPSELL]: 'Upsell',
    [RecommendationType.FREQUENTLY_BOUGHT_TOGETHER]: 'Frequently Bought Together',
    [RecommendationType.CUSTOMER_BASED]: 'Customer-based',
    [RecommendationType.SEASONAL]: 'Seasonal',
    [RecommendationType.TRENDING]: 'Trending',
    [RecommendationType.INVENTORY_BASED]: 'Inventory-based',
    [RecommendationType.CATEGORY_BASED]: 'Category-based',
    [RecommendationType.SUBSTITUTION]: 'Substitution',
    [RecommendationType.REORDER]: 'Reorder',
  };

  return typeNames[type as RecommendationType] || type;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

// Lifecycle
onMounted(() => {
  loadAnalytics();
});
</script>

<style scoped>
/* Custom styles if needed */
</style>
