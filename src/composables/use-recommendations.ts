import { computed, onMounted, onUnmounted, readonly, ref, type Ref } from "vue";
import { useRecommendationStore } from "@/stores/recommendation-store";
import type { Customer } from "@/types/customer";
import type { Item } from "@/types/order";
import type { Product } from "@/product/product";
import type { ProductRecommendation } from "@/types/recommendation";
import {
  RecommendationContext,
  RecommendationType,
} from "@/types/recommendation";

export interface UseRecommendationsOptions {
  context: RecommendationContext;
  autoLoad?: boolean;
  maxRecommendations?: number;
  refreshInterval?: number;
}

export interface UseRecommendationsReturn {
  recommendations: Readonly<Ref<ProductRecommendation[]>>;
  isLoading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;
  loadRecommendations: (options?: {
    customer?: Customer;
    cartItems?: Item[];
    currentProduct?: Product;
    forceRefresh?: boolean;
  }) => Promise<ProductRecommendation[]>;
  refreshRecommendations: () => Promise<void>;
  clearRecommendations: () => void;
  getRecommendationsByType: (
    type: RecommendationType,
  ) => ProductRecommendation[];
  getHighConfidenceRecommendations: (
    minConfidence?: number,
  ) => ProductRecommendation[];
  getAffordableRecommendations: (maxPrice: number) => ProductRecommendation[];
  getInStockRecommendations: () => ProductRecommendation[];
}

export function useRecommendations(
  options: UseRecommendationsOptions,
): UseRecommendationsReturn {
  const {
    context,
    autoLoad = true,
    maxRecommendations = 10,
    refreshInterval,
  } = options;

  const recommendationStore = useRecommendationStore();

  // State
  const recommendations = ref<ProductRecommendation[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const refreshTimer = ref<number | null>(null);

  // Computed
  const computedRecommendations = computed(() =>
    recommendations.value.slice(0, maxRecommendations),
  );

  // Methods
  async function loadRecommendations(
    loadOptions: {
      customer?: Customer;
      cartItems?: Item[];
      currentProduct?: Product;
      forceRefresh?: boolean;
    } = {},
  ): Promise<ProductRecommendation[]> {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await recommendationStore.generateRecommendations(
        context,
        {
          ...loadOptions,
          limit: maxRecommendations,
        },
      );

      recommendations.value = result;

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load recommendations";
      error.value = errorMessage;
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function refreshRecommendations(): Promise<void> {
    await loadRecommendations({ forceRefresh: true });
  }

  function clearRecommendations(): void {
    recommendations.value = [];
    error.value = null;
  }

  function getRecommendationsByType(
    type: RecommendationType,
  ): ProductRecommendation[] {
    return recommendations.value.filter((rec) => rec.type === type);
  }

  function getHighConfidenceRecommendations(
    minConfidence = 0.7,
  ): ProductRecommendation[] {
    return recommendations.value.filter(
      (rec) => rec.confidence >= minConfidence,
    );
  }

  function getAffordableRecommendations(
    maxPrice: number,
  ): ProductRecommendation[] {
    return recommendations.value.filter((rec) => rec.product.price <= maxPrice);
  }

  function getInStockRecommendations(): ProductRecommendation[] {
    return recommendations.value.filter((rec) => rec.product.stock > 0);
  }

  // Setup refresh interval if specified
  function setupRefreshInterval(): void {
    if (refreshInterval && refreshInterval > 0) {
      refreshTimer.value = window.setInterval(() => {
        refreshRecommendations();
      }, refreshInterval);
    }
  }

  function clearRefreshInterval(): void {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value);
      refreshTimer.value = null;
    }
  }

  // Lifecycle
  onMounted(() => {
    if (autoLoad) {
      loadRecommendations();
    }
    setupRefreshInterval();
  });

  // Cleanup
  onUnmounted(() => {
    clearRefreshInterval();
  });

  return {
    recommendations: computedRecommendations,
    isLoading: readonly(isLoading),
    error: readonly(error),
    loadRecommendations,
    refreshRecommendations,
    clearRecommendations,
    getRecommendationsByType,
    getHighConfidenceRecommendations,
    getAffordableRecommendations,
    getInStockRecommendations,
  };
}

// Specialized composables for different contexts
export function useCheckoutRecommendations(
  options: Omit<UseRecommendationsOptions, "context"> = {},
) {
  return useRecommendations({
    ...options,
    context: RecommendationContext.CHECKOUT,
  });
}

export function useHomepageRecommendations(
  options: Omit<UseRecommendationsOptions, "context"> = {},
) {
  return useRecommendations({
    ...options,
    context: RecommendationContext.HOMEPAGE,
  });
}

export function useProductDetailRecommendations(
  options: Omit<UseRecommendationsOptions, "context"> = {},
) {
  return useRecommendations({
    ...options,
    context: RecommendationContext.PRODUCT_DETAIL,
  });
}

export function useCustomerRecommendations(
  options: Omit<UseRecommendationsOptions, "context"> = {},
) {
  return useRecommendations({
    ...options,
    context: RecommendationContext.CUSTOMER_PROFILE,
  });
}

export function useCategoryRecommendations(
  options: Omit<UseRecommendationsOptions, "context"> = {},
) {
  return useRecommendations({
    ...options,
    context: RecommendationContext.CATEGORY_BROWSE,
  });
}

export function useSearchRecommendations(
  options: Omit<UseRecommendationsOptions, "context"> = {},
) {
  return useRecommendations({
    ...options,
    context: RecommendationContext.SEARCH_RESULTS,
  });
}
