import { computed, type Ref } from "vue";
import type { Product } from "../types/product";
import type { Item } from "../types/order";
import { useRecommendationStore } from "../stores/recommendation-store";
import { RecommendationType } from "../types/recommendation";

export const useUpsellCrossSell = (
  cartItems: Item[],
  allProducts: Ref<Product[]>
) => {
  const recommendationStore = useRecommendationStore();

  // Get products already in cart
  const cartProductIds = computed(() =>
    cartItems.map(item => item.product._id)
  );

  // Cross-sell: Get from recommendation system
  const crossSellSuggestions = computed(() => {
    return recommendationStore.checkoutRecommendations
      .filter(rec =>
        rec.type === RecommendationType.CROSS_SELL ||
        rec.type === RecommendationType.FREQUENTLY_BOUGHT_TOGETHER
      )
      .slice(0, 6)
      .map(rec => rec.product);
  });

  // Upsell: Get from recommendation system
  const upsellSuggestions = computed(() => {
    return recommendationStore.checkoutRecommendations
      .filter(rec =>
        rec.type === RecommendationType.UPSELL ||
        rec.type === RecommendationType.CATEGORY_BASED
      )
      .slice(0, 4)
      .map(rec => rec.product);
  });

  // Popular products (fallback when cart is empty) - enhanced with recommendation system
  const popularProducts = computed(() => {
    if (cartItems.length === 0) {
      // Use trending recommendations when cart is empty
      return recommendationStore.homepageRecommendations
        .filter(rec => rec.type === RecommendationType.TRENDING)
        .slice(0, 8)
        .map(rec => rec.product);
    }

    // Fallback to traditional logic if recommendations aren't available
    if (allProducts.value.length === 0) return [];

    return allProducts.value
      .filter(product => product.stock > 0)
      .sort((a, b) => b.price - a.price) // Sort by price descending as proxy for popularity
      .slice(0, 8);
  });

  // Enhanced suggestions that combine traditional logic with ML recommendations
  const enhancedSuggestions = computed(() => {
    const traditional = getTraditionalSuggestions();
    const mlRecommendations = recommendationStore.checkoutRecommendations
      .filter(rec => !cartProductIds.value.includes(rec.product._id))
      .slice(0, 6)
      .map(rec => rec.product);

    // Merge and deduplicate
    const allSuggestions = [...mlRecommendations, ...traditional];
    const uniqueSuggestions = allSuggestions.filter((product, index, self) =>
      index === self.findIndex(p => p._id === product._id)
    );

    return uniqueSuggestions.slice(0, 8);
  });

  // Traditional algorithm as fallback
  function getTraditionalSuggestions(): Product[] {
    if (cartItems.length === 0 || allProducts.value.length === 0) return [];

    const suggestions = new Set<Product>();

    cartItems.forEach(cartItem => {
      const { category, tags } = cartItem.product;

      // Find products in same category or with matching tags
      allProducts.value.forEach(product => {
        if (cartProductIds.value.includes(product._id)) return;
        if (product.stock <= 0) return;

        // Same category suggestions
        if (category && product.category === category) {
          suggestions.add(product);
        }

        // Tag-based suggestions
        if (tags && product.tags) {
          const hasMatchingTag = tags.some(tag =>
            product.tags!.includes(tag)
          );
          if (hasMatchingTag) {
            suggestions.add(product);
          }
        }
      });
    });

    return Array.from(suggestions).slice(0, 6);
  }

  // Load recommendations when cart changes
  async function loadRecommendations(): Promise<void> {
    if (cartItems.length > 0) {
      await recommendationStore.getRecommendationsForCheckout(cartItems);
    } else {
      await recommendationStore.getRecommendationsForHomepage();
    }
  }

  return {
    crossSellSuggestions,
    upsellSuggestions,
    popularProducts,
    enhancedSuggestions,
    loadRecommendations
  };
};
