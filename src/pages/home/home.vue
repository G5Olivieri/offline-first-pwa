<script lang="ts" setup>
defineOptions({
  name: "HomePage",
});

import { computed, watch } from "vue";
import ProductSuggestions from "@/components/product-suggestions.vue";
import { useOrderStore } from "@/stores/order-store";
import { useRecommendationStore } from "@/stores/recommendation-store";
import { useTerminalStore } from "@/stores/terminal-store";
import { RecommendationType } from "@/types/recommendation";
import ItemCard from "@/pages/home/item-card.vue";

const orderStore = useOrderStore();
const recommendationStore = useRecommendationStore();
const terminalStore = useTerminalStore();

// Load recommendations when cart changes
const loadRecommendations = async () => {
  if (orderStore.items.length > 0) {
    await recommendationStore.getRecommendationsForCheckout(orderStore.items);
  } else {
    await recommendationStore.getRecommendationsForHomepage();
  }
};

// Watch cart changes and reload recommendations
watch(
  () => orderStore.items.length,
  () => {
    loadRecommendations();
  },
  { immediate: true },
);

// Get products already in cart for filtering
const cartProductIds = computed(() =>
  orderStore.items.map((item) => item.product._id),
);

// Cross-sell suggestions from recommendation store
const crossSellSuggestions = computed(() => {
  const recommendations = recommendationStore.checkoutRecommendations
    .filter(
      (rec) =>
        rec.type === RecommendationType.CROSS_SELL ||
        rec.type === RecommendationType.FREQUENTLY_BOUGHT_TOGETHER,
    )
    .filter((rec) => !cartProductIds.value.includes(rec.product._id))
    .slice(0, 6);

  return recommendations.map((rec) => rec.product);
});

// Upsell suggestions from recommendation store
const upsellSuggestions = computed(() => {
  const recommendations = recommendationStore.checkoutRecommendations
    .filter(
      (rec) =>
        rec.type === RecommendationType.UPSELL ||
        rec.type === RecommendationType.CATEGORY_BASED,
    )
    .filter((rec) => !cartProductIds.value.includes(rec.product._id))
    .slice(0, 4);

  return recommendations.map((rec) => rec.product);
});

// Popular products from recommendation store
const popularProducts = computed(() => {
  if (orderStore.items.length === 0) {
    // Use homepage recommendations when cart is empty
    const trending = recommendationStore.homepageRecommendations
      .filter((rec) => rec.type === RecommendationType.TRENDING)
      .slice(0, 8);

    const seasonal = recommendationStore.homepageRecommendations
      .filter((rec) => rec.type === RecommendationType.SEASONAL)
      .slice(0, 4);

    // Combine trending and seasonal recommendations
    const combined = [...trending, ...seasonal];
    const uniqueProducts = Array.from(
      new Map(combined.map((rec) => [rec.product._id, rec.product])).values(),
    );

    return uniqueProducts.slice(0, 8);
  }

  // When cart has items, show inventory-based popular products
  const inventoryBased = recommendationStore.checkoutRecommendations
    .filter((rec) => rec.type === RecommendationType.INVENTORY_BASED)
    .filter((rec) => !cartProductIds.value.includes(rec.product._id))
    .slice(0, 4);

  return inventoryBased.map((rec) => rec.product);
});

// Loading state from recommendation store
const isLoading = computed(() => recommendationStore.isLoading);
</script>

<template>
  <main
    class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
  >
    <!-- Header Section -->
    <div
      class="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10"
    >
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div
              class="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center"
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                />
              </svg>
            </div>
            <div>
              <h1
                class="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
              >
                Point of Sale
              </h1>
              <p class="text-gray-500 text-sm">Modern retail solution</p>
              <p class="text-xs text-gray-400 font-mono">
                Terminal: {{ terminalStore.terminalId }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <p class="text-sm text-gray-500">Current Total</p>
              <div
                class="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
              >
                ${{ orderStore.total.toFixed(2) }}
              </div>
            </div>
            <div
              class="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
            >
              <span class="text-white font-bold text-lg">{{
                orderStore.items.length
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Current Order Section -->
      <div class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-800">Shopping Cart</h2>
            <span
              class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
            >
              {{ orderStore.items.length }}
              {{ orderStore.items.length === 1 ? "item" : "items" }}
            </span>
          </div>
        </div>

        <div v-if="orderStore.items.length === 0" class="text-center py-16">
          <div
            class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-12 h-12 text-gray-400"
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
          <p class="text-xl font-semibold text-gray-600 mb-2">
            Your cart is empty
          </p>
          <p class="text-gray-500">Browse our products below to get started</p>
        </div>

        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <ItemCard
            v-for="item in orderStore.items"
            :key="item.product._id"
            :item="item"
            @decrease="orderStore.decrease(item)"
            @increase="orderStore.increase(item)"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-16">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-4"
        >
          <svg
            class="animate-spin w-8 h-8 text-white"
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
        </div>
        <p class="text-lg font-semibold text-gray-600">
          Loading suggestions...
        </p>
        <p class="text-gray-500">Finding the perfect products for you</p>
      </div>

      <!-- Suggestions Section -->
      <div v-else class="space-y-12">
        <!-- Upsell Suggestions -->
        <div v-if="orderStore.items.length > 0" class="relative">
          <div
            class="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl"
          ></div>
          <div
            class="relative bg-white/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20"
          >
            <ProductSuggestions
              :products="upsellSuggestions"
              title="🚀 Upgrade Your Selection"
              subtitle="Consider these premium alternatives"
              type="upsell"
            />
          </div>
        </div>

        <!-- Cross-sell Suggestions -->
        <div v-if="orderStore.items.length > 0" class="relative">
          <div
            class="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl"
          ></div>
          <div
            class="relative bg-white/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20"
          >
            <ProductSuggestions
              :products="crossSellSuggestions"
              title="🛍️ You Might Also Like"
              subtitle="Products that go great together"
              type="crosssell"
            />
          </div>
        </div>

        <!-- Popular Products (shown when cart is empty) -->
        <div v-if="orderStore.items.length === 0" class="relative">
          <div
            class="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl"
          ></div>
          <div
            class="relative bg-white/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20"
          >
            <ProductSuggestions
              :products="popularProducts"
              title="⭐ Popular Products"
              subtitle="Customer favorites to get you started"
              type="popular"
            />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Custom animations and effects */
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 20px rgba(59, 130, 246, 0);
  }
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

/* Glassmorphism effect */
.glass {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

/* Hover effects */
.hover-lift:hover {
  transform: translateY(-2px);
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  border: 2px solid transparent;
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5);
  background-clip: content-box;
}

/* Enhanced button effects */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

/* Card hover effects */
.card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* Floating animation for empty state */
.float-animation {
  animation: float 3s ease-in-out infinite;
}

/* Shimmer effect for loading */
.shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
