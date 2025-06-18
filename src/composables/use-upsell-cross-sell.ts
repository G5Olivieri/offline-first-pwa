import { computed, type Ref } from "vue";
import type { Product } from "../types/product";
import type { Item } from "../types/order";

export const useUpsellCrossSell = (
  cartItems: Item[],
  allProducts: Ref<Product[]>
) => {
  // Get products already in cart
  const cartProductIds = computed(() =>
    cartItems.map(item => item.product._id)
  );

  // Cross-sell: Find complementary products based on categories and tags
  const crossSellSuggestions = computed(() => {
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

    return Array.from(suggestions).slice(0, 6); // Limit to 6 suggestions
  });

  // Upsell: Find higher-value alternatives for cart items
  const upsellSuggestions = computed(() => {
    if (cartItems.length === 0 || allProducts.value.length === 0) return [];

    const suggestions = new Set<Product>();

    cartItems.forEach(cartItem => {
      const { category, price } = cartItem.product;

      // Find more expensive products in same category
      allProducts.value.forEach(product => {
        if (cartProductIds.value.includes(product._id)) return;
        if (product.stock <= 0) return;
        if (!category || product.category !== category) return;
        if (product.price <= price * 1.2) return; // At least 20% more expensive

        suggestions.add(product);
      });
    });

    return Array.from(suggestions)
      .sort((a, b) => a.price - b.price) // Sort by price ascending
      .slice(0, 4); // Limit to 4 suggestions
  });

  // Popular products (fallback when cart is empty)
  const popularProducts = computed(() => {
    if (allProducts.value.length === 0) return [];

    return allProducts.value
      .filter(product => product.stock > 0)
      .sort((a, b) => b.price - a.price) // Sort by price descending as proxy for popularity
      .slice(0, 8);
  });

  return {
    crossSellSuggestions,
    upsellSuggestions,
    popularProducts
  };
};
