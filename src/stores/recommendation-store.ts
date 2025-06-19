import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import type {
  ProductRecommendation,
  RecommendationSet,
  RecommendationMetrics
} from '../types/recommendation';
import { RecommendationContext } from '../types/recommendation';
import type { Product } from '../types/product';
import type { Customer } from '../types/customer';
import type { Item } from '../types/order';
import { recommendationEngine } from '../services/recommendation-engine';
import { useAnalyticsStore } from './analytics-store';
import { createLogger } from '../services/logger-service';
import { useProductStore } from './product-store';

const logger = createLogger('RecommendationStore');

export const useRecommendationStore = defineStore('recommendationStore', () => {
  const productStore = useProductStore();
  const analyticsStore = useAnalyticsStore();

  // State
  const currentRecommendations = ref<Record<RecommendationContext, ProductRecommendation[]>>({
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
  const analytics = ref<RecommendationMetrics | null>(null);
  const sessionId = ref<string>(generateSessionId());

  // Computed
  const checkoutRecommendations = computed(() =>
    currentRecommendations.value[RecommendationContext.CHECKOUT]
  );

  const homepageRecommendations = computed(() =>
    currentRecommendations.value[RecommendationContext.HOMEPAGE]
  );

  const productDetailRecommendations = computed(() =>
    currentRecommendations.value[RecommendationContext.PRODUCT_DETAIL]
  );

  const customerProfileRecommendations = computed(() =>
    currentRecommendations.value[RecommendationContext.CUSTOMER_PROFILE]
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
      const isExpired = Date.now() - new Date(cached.generated_at).getTime() > 60 * 60 * 1000; // 1 hour

      if (!isExpired) {
        currentRecommendations.value[context] = cached.recommendations;
        return cached.recommendations;
      }
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Get all products for the recommendation engine
      const allProductsResult = await productStore.searchProducts('', { limit: 1000 });
      const allProducts = allProductsResult.products;

      // Generate recommendations
      const recommendations = await recommendationEngine.generateRecommendations(context, {
        ...options,
        allProducts
      });

      // Update state
      currentRecommendations.value[context] = recommendations;

      // Cache results
      const recommendationSet: RecommendationSet = {
        id: `set-${context}-${Date.now()}`,
        context,
        recommendations,
        total_score: recommendations.reduce((sum, rec) => sum + rec.score, 0),
        generated_at: new Date().toISOString(),
        customer_id: options.customer?._id,
        session_id: sessionId.value,
        cart_items: options.cartItems?.map(item => item.product._id)
      };

      recommendationCache.value.set(cacheKey, recommendationSet);

      // Track analytics
      await trackRecommendationsGenerated(recommendations, context);

      logger.debug(`Generated ${recommendations.length} recommendations for context: ${context}`);

      return recommendations;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to generate recommendations';
      logger.error('Error generating recommendations:', err);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function getRecommendationsForCheckout(cartItems: Item[], customer?: Customer): Promise<ProductRecommendation[]> {
    return generateRecommendations(RecommendationContext.CHECKOUT, { cartItems, customer });
  }

  async function getRecommendationsForProduct(product: Product, customer?: Customer): Promise<ProductRecommendation[]> {
    return generateRecommendations(RecommendationContext.PRODUCT_DETAIL, { currentProduct: product, customer });
  }

  async function getRecommendationsForHomepage(customer?: Customer): Promise<ProductRecommendation[]> {
    return generateRecommendations(RecommendationContext.HOMEPAGE, { customer });
  }

  async function getRecommendationsForCustomer(customer: Customer): Promise<ProductRecommendation[]> {
    return generateRecommendations(RecommendationContext.CUSTOMER_PROFILE, { customer });
  }

  async function getRecommendationsForCategory(_category: string, customer?: Customer): Promise<ProductRecommendation[]> {
    // This is a simplified approach - in a real implementation, you'd pass category info
    return generateRecommendations(RecommendationContext.CATEGORY_BROWSE, { customer });
  }

  async function getRecommendationsForSearch(_searchQuery: string, customer?: Customer): Promise<ProductRecommendation[]> {
    return generateRecommendations(RecommendationContext.SEARCH_RESULTS, { customer });
  }

  // Analytics functions
  async function trackRecommendationViewed(recommendation: ProductRecommendation, context: RecommendationContext): Promise<void> {
    await trackRecommendationEvent(recommendation, context, 'viewed');
  }

  async function trackRecommendationClicked(recommendation: ProductRecommendation, context: RecommendationContext): Promise<void> {
    await trackRecommendationEvent(recommendation, context, 'clicked');
  }

  async function trackRecommendationAddedToCart(recommendation: ProductRecommendation, context: RecommendationContext): Promise<void> {
    await trackRecommendationEvent(recommendation, context, 'added_to_cart');
  }

  async function trackRecommendationPurchased(recommendation: ProductRecommendation, context: RecommendationContext, orderId: string): Promise<void> {
    await trackRecommendationEvent(recommendation, context, 'purchased', { order_id: orderId });
  }

  async function trackRecommendationDismissed(recommendation: ProductRecommendation, context: RecommendationContext): Promise<void> {
    await trackRecommendationEvent(recommendation, context, 'dismissed');
  }

  async function trackRecommendationEvent(
    recommendation: ProductRecommendation,
    context: RecommendationContext,
    action: 'viewed' | 'clicked' | 'added_to_cart' | 'purchased' | 'dismissed',
    metadata: Record<string, string | number | boolean> = {}
  ): Promise<void> {
    try {
      const baseMetadata: Record<string, string | number | boolean> = {
        session_id: sessionId.value,
        ...metadata
      };

      if (recommendation.source_customer?._id) {
        baseMetadata.customer_id = recommendation.source_customer._id;
      }

      switch (action) {
        case 'viewed':
          analyticsStore.trackRecommendationViewed(
            recommendation.id,
            recommendation.product._id,
            context,
            recommendation.type,
            baseMetadata
          );
          break;
        case 'clicked':
          analyticsStore.trackRecommendationClicked(
            recommendation.id,
            recommendation.product._id,
            context,
            recommendation.type,
            baseMetadata
          );
          break;
        case 'added_to_cart':
          analyticsStore.trackRecommendationAddedToCart(
            recommendation.id,
            recommendation.product._id,
            context,
            recommendation.type,
            baseMetadata
          );
          break;
        case 'purchased':
          analyticsStore.trackRecommendationPurchased(
            recommendation.id,
            recommendation.product._id,
            context,
            recommendation.type,
            metadata.order_id as string || 'unknown',
            baseMetadata
          );
          break;
        case 'dismissed':
          analyticsStore.trackRecommendationDismissed(
            recommendation.id,
            recommendation.product._id,
            context,
            recommendation.type,
            baseMetadata
          );
          break;
      }

      logger.debug(`Tracked recommendation ${action}:`, {
        recommendation_id: recommendation.id,
        product_id: recommendation.product._id,
        context,
        action
      });
    } catch (err) {
      logger.error('Error tracking recommendation event:', err);
    }
  }

  async function trackRecommendationsGenerated(recommendations: ProductRecommendation[], context: RecommendationContext): Promise<void> {
    // Track the batch generation event
    analyticsStore.trackRecommendationsGenerated(
      recommendations.map(rec => ({
        id: rec.id,
        productId: rec.product._id,
        type: rec.type
      })),
      context,
      {
        session_id: sessionId.value
      }
    );
  }

  async function getRecommendationAnalytics(): Promise<RecommendationMetrics | null> {
    try {
      // Note: With the analytics service abstraction, we don't have direct access to stored events
      // This would need to be implemented by querying the analytics providers or maintaining
      // a separate metrics aggregation system

      logger.warn('getRecommendationAnalytics: Analytics data not available with current abstraction');

      // Return basic metrics structure with zeros for now
      const metrics: RecommendationMetrics = {
        total_recommendations_generated: 0,
        total_recommendations_clicked: 0,
        total_recommendations_purchased: 0,
        click_through_rate: 0,
        conversion_rate: 0,
        revenue_attributed: 0,
        top_performing_types: [],
        context_performance: {} as Record<RecommendationContext, {
          impressions: number;
          clicks: number;
          conversions: number;
          revenue: number;
        }>,
        last_updated: new Date().toISOString()
      };

      // Initialize context performance with zeros
      for (const context of Object.values(RecommendationContext)) {
        metrics.context_performance[context] = {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        };
      }

      analytics.value = metrics;
      return metrics;
    } catch (err) {
      logger.error('Error getting recommendation analytics:', err);
      return null;
    }
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
  function generateCacheKey(context: RecommendationContext, options: {
    customer?: Customer;
    cartItems?: Item[];
    currentProduct?: Product;
    limit?: number;
  }): string {
    const keyParts = [
      context,
      options.customer?._id || 'no-customer',
      options.currentProduct?._id || 'no-product',
      options.cartItems?.map((item: Item) => item.product._id).join(',') || 'no-cart',
      options.limit || 'default-limit'
    ];
    return keyParts.join('|');
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
    analytics: readonly(analytics),
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

    // Analytics
    trackRecommendationViewed,
    trackRecommendationClicked,
    trackRecommendationAddedToCart,
    trackRecommendationPurchased,
    trackRecommendationDismissed,
    getRecommendationAnalytics,

    // Utility
    clearCache,
    refreshRecommendations
  };
});
