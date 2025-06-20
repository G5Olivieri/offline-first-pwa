import { productService } from "@/services/product-service";
import { recommendationEngine } from "@/services/recommendation-engine";
import type { Customer } from "@/types/customer";
import type { Item } from "@/types/order";
import type { Product } from "@/types/product";
import type {
  ProductRecommendation,
  RecommendationSet,
} from "@/types/recommendation";
import { RecommendationContext } from "@/types/recommendation";
import { defineStore } from "pinia";
import { computed, readonly, ref } from "vue";

// TODO: Review and refactor recommendation
export const useRecommendationStore = defineStore("recommendationStore", () => {
  const currentRecommendations = ref<
    Record<RecommendationContext, ProductRecommendation[]>
  >({
    [RecommendationContext.CHECKOUT]: [],
    [RecommendationContext.PRODUCT_DETAIL]: [],
    [RecommendationContext.CUSTOMER_PROFILE]: [],
    [RecommendationContext.HOMEPAGE]: [],
    [RecommendationContext.CATEGORY_BROWSE]: [],
    [RecommendationContext.SEARCH_RESULTS]: [],
    [RecommendationContext.LOW_STOCK_ALERT]: [],
  });

  const recommendationCache = ref<Map<string, RecommendationSet>>(new Map());
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const sessionId = ref<string>(generateSessionId());

  // Computed
  const checkoutRecommendations = computed(
    () => currentRecommendations.value[RecommendationContext.CHECKOUT]
  );

  const homepageRecommendations = computed(
    () => currentRecommendations.value[RecommendationContext.HOMEPAGE]
  );

  const productDetailRecommendations = computed(
    () => currentRecommendations.value[RecommendationContext.PRODUCT_DETAIL]
  );

  const customerProfileRecommendations = computed(
    () => currentRecommendations.value[RecommendationContext.CUSTOMER_PROFILE]
  );

  // Actions
  async function generateRecommendations(
    context: RecommendationContext,
    options: {
      customer?: Customer;
      cartItems?: Item[];
      currentProduct?: Product;
      limit?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<ProductRecommendation[]> {
    const cacheKey = generateCacheKey(context, options);

    // Check cache first
    if (!options.forceRefresh && recommendationCache.value.has(cacheKey)) {
      const cached = recommendationCache.value.get(cacheKey)!;
      const isExpired =
        Date.now() - new Date(cached.generated_at).getTime() > 60 * 60 * 1000; // 1 hour

      if (!isExpired) {
        currentRecommendations.value[context] = cached.recommendations;
        return cached.recommendations;
      }
    }

    isLoading.value = true;
    error.value = null;

    try {
      const allProductsResult = await productService.listProducts({
        limit: 1000,
      });
      const allProducts = allProductsResult.products;

      const recommendations =
        await recommendationEngine.generateRecommendations(context, {
          ...options,
          allProducts,
        });

      currentRecommendations.value[context] = recommendations;

      const recommendationSet: RecommendationSet = {
        id: `set-${context}-${Date.now()}`,
        context,
        recommendations,
        total_score: recommendations.reduce((sum, rec) => sum + rec.score, 0),
        generated_at: new Date().toISOString(),
        customer_id: options.customer?._id,
        session_id: sessionId.value,
        cart_items: options.cartItems?.map((item) => item.product._id),
      };

      recommendationCache.value.set(cacheKey, recommendationSet);

      return recommendations;
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : "Failed to generate recommendations";

      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function getRecommendationsForCheckout(
    cartItems: Item[],
    customer?: Customer
  ): Promise<ProductRecommendation[]> {
    return generateRecommendations(RecommendationContext.CHECKOUT, {
      cartItems,
      customer,
    });
  }

  async function getRecommendationsForProduct(
    product: Product,
    customer?: Customer
  ): Promise<ProductRecommendation[]> {
    return generateRecommendations(RecommendationContext.PRODUCT_DETAIL, {
      currentProduct: product,
      customer,
    });
  }

  async function getRecommendationsForHomepage(
    customer?: Customer
  ): Promise<ProductRecommendation[]> {
    return generateRecommendations(RecommendationContext.HOMEPAGE, {
      customer,
    });
  }

  async function getRecommendationsForCustomer(
    customer: Customer
  ): Promise<ProductRecommendation[]> {
    return generateRecommendations(RecommendationContext.CUSTOMER_PROFILE, {
      customer,
    });
  }

  async function getRecommendationsForCategory(
    _category: string,
    customer?: Customer
  ): Promise<ProductRecommendation[]> {
    // This is a simplified approach - in a real implementation, you'd pass category info
    return generateRecommendations(RecommendationContext.CATEGORY_BROWSE, {
      customer,
    });
  }

  async function getRecommendationsForSearch(
    _searchQuery: string,
    customer?: Customer
  ): Promise<ProductRecommendation[]> {
    return generateRecommendations(RecommendationContext.SEARCH_RESULTS, {
      customer,
    });
  }

  function clearCache(): void {
    recommendationCache.value.clear();
    currentRecommendations.value = {
      [RecommendationContext.CHECKOUT]: [],
      [RecommendationContext.PRODUCT_DETAIL]: [],
      [RecommendationContext.CUSTOMER_PROFILE]: [],
      [RecommendationContext.HOMEPAGE]: [],
      [RecommendationContext.CATEGORY_BROWSE]: [],
      [RecommendationContext.SEARCH_RESULTS]: [],
      [RecommendationContext.LOW_STOCK_ALERT]: [],
    };
  }

  function refreshRecommendations(context?: RecommendationContext): void {
    if (context) {
      currentRecommendations.value[context] = [];
      // Remove cache entries for this context
      for (const [key, value] of recommendationCache.value.entries()) {
        if (value.context === context) {
          recommendationCache.value.delete(key);
        }
      }
    } else {
      clearCache();
    }
  }

  // Helper functions
  function generateCacheKey(
    context: RecommendationContext,
    options: {
      customer?: Customer;
      cartItems?: Item[];
      currentProduct?: Product;
      limit?: number;
    }
  ): string {
    const keyParts = [
      context,
      options.customer?._id || "no-customer",
      options.currentProduct?._id || "no-product",
      options.cartItems?.map((item: Item) => item.product._id).join(",") ||
        "no-cart",
      options.limit || "default-limit",
    ];
    return keyParts.join("|");
  }

  function generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize homepage recommendations on store creation
  generateRecommendations(RecommendationContext.HOMEPAGE);

  return {
    // State
    currentRecommendations: readonly(currentRecommendations),
    isLoading: readonly(isLoading),
    error: readonly(error),
    sessionId: readonly(sessionId),

    // Computed
    checkoutRecommendations,
    homepageRecommendations,
    productDetailRecommendations,
    customerProfileRecommendations,

    // Actions
    generateRecommendations,
    getRecommendationsForCheckout,
    getRecommendationsForProduct,
    getRecommendationsForHomepage,
    getRecommendationsForCustomer,
    getRecommendationsForCategory,
    getRecommendationsForSearch,

    // Utility
    clearCache,
    refreshRecommendations,
  };
});
