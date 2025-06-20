import {
  getCustomerPreferencesDB,
  getOrderDB,
  getProductAffinityDB,
  getRecommendationConfigDB,
} from "@/db";
import type { Customer } from "@/types/customer";
import type { Item, Order } from "@/types/order";
import type { Product } from "@/types/product";
import type {
  CustomerProductPreference,
  ProductAffinity,
  ProductRecommendation,
  RecommendationConfig,
} from "@/types/recommendation";
import {
  RecommendationContext,
  RecommendationType,
} from "@/types/recommendation";

export class RecommendationEngine {
  private affinityDB = getProductAffinityDB();
  private preferencesDB = getCustomerPreferencesDB();
  private configDB = getRecommendationConfigDB();
  private orderDB = getOrderDB();
  private config: RecommendationConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private async loadConfig(): Promise<void> {
    try {
      const result = await this.configDB.allDocs({
        include_docs: true,
        limit: 1,
      });
      if (result.rows.length > 0 && result.rows[0].doc) {
        this.config = result.rows[0].doc;
      } else {
        // Create default config if none exists
        this.config = this.getDefaultConfig();
        await this.configDB.put({ ...this.config, _id: "default-config" });
      }
    } catch {
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): RecommendationConfig {
    return {
      enabled: true,
      max_recommendations_per_context: 6,
      min_confidence_threshold: 0.3,
      cache_duration_minutes: 60,
      rules: [],
      feature_flags: {
        collaborative_filtering: true,
        content_based_filtering: true,
        market_basket_analysis: true,
        seasonal_recommendations: true,
        inventory_based_recommendations: true,
        real_time_updates: true,
      },
    };
  }

  async generateRecommendations(
    context: RecommendationContext,
    options: {
      customer?: Customer;
      cartItems?: Item[];
      currentProduct?: Product;
      limit?: number;
      allProducts?: Product[];
    } = {},
  ): Promise<ProductRecommendation[]> {
    if (!this.config?.enabled) {
      return [];
    }

    const {
      customer,
      cartItems = [],
      currentProduct,
      limit = this.config.max_recommendations_per_context,
      allProducts = [],
    } = options;

    const recommendations: ProductRecommendation[] = [];

    // 1. Collaborative Filtering - Based on similar customers
    if (this.config.feature_flags.collaborative_filtering && customer) {
      const collaborativeRecs = await this.generateCollaborativeRecommendations(
        customer,
        allProducts,
      );
      recommendations.push(...collaborativeRecs);
    }

    // 2. Content-Based Filtering - Based on product attributes
    if (
      this.config.feature_flags.content_based_filtering &&
      (currentProduct || cartItems.length > 0)
    ) {
      const contentRecs = await this.generateContentBasedRecommendations(
        currentProduct,
        cartItems,
        allProducts,
      );
      recommendations.push(...contentRecs);
    }

    // 3. Market Basket Analysis - Frequently bought together
    if (
      this.config.feature_flags.market_basket_analysis &&
      cartItems.length > 0
    ) {
      const basketRecs = await this.generateMarketBasketRecommendations(
        cartItems,
        allProducts,
      );
      recommendations.push(...basketRecs);
    }

    // 4. Trending/Popular Products
    const trendingRecs = await this.generateTrendingRecommendations(
      allProducts,
      cartItems,
    );
    recommendations.push(...trendingRecs);

    // 5. Inventory-Based Recommendations
    if (this.config.feature_flags.inventory_based_recommendations) {
      const inventoryRecs = await this.generateInventoryBasedRecommendations(
        allProducts,
        cartItems,
      );
      recommendations.push(...inventoryRecs);
    }

    // 6. Category-Based Recommendations
    if (currentProduct || cartItems.length > 0) {
      const categoryRecs = await this.generateCategoryBasedRecommendations(
        currentProduct,
        cartItems,
        allProducts,
      );
      recommendations.push(...categoryRecs);
    }

    // 7. Seasonal Recommendations
    if (this.config.feature_flags.seasonal_recommendations) {
      const seasonalRecs = await this.generateSeasonalRecommendations(
        allProducts,
        cartItems,
      );
      recommendations.push(...seasonalRecs);
    }

    // Filter, deduplicate, and rank recommendations
    return this.processRecommendations(
      recommendations,
      context,
      limit,
      cartItems,
    );
  }

  private async generateCollaborativeRecommendations(
    customer: Customer,
    allProducts: Product[],
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    // Get customer preferences
    const customerPrefs = await this.preferencesDB.find({
      selector: { customer_id: customer._id },
      sort: [{ preference_score: "desc" }],
      limit: 10,
    });

    // Generate recommendations based on preferences
    for (const pref of customerPrefs.docs) {
      const product = allProducts.find((p) => p._id === pref.product_id);
      if (product && product.stock > 0) {
        recommendations.push({
          id: `collab-${product._id}-${Date.now()}`,
          product,
          type: RecommendationType.CUSTOMER_BASED,
          context: RecommendationContext.CUSTOMER_PROFILE,
          score: pref.preference_score,
          confidence: Math.min(pref.preference_score * 0.8, 0.9),
          reason: `Based on your purchase history (${pref.purchase_frequency} purchases)`,
          source_customer: customer,
          created_at: new Date().toISOString(),
        });
      }
    }

    return recommendations;
  }

  private async generateContentBasedRecommendations(
    currentProduct: Product | undefined,
    cartItems: Item[],
    allProducts: Product[],
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    const sourceProducts = currentProduct
      ? [currentProduct]
      : cartItems.map((item) => item.product);

    for (const sourceProduct of sourceProducts) {
      // Find similar products by category
      const similarProducts = allProducts.filter(
        (product) =>
          product._id !== sourceProduct._id &&
          product.stock > 0 &&
          (product.category === sourceProduct.category ||
            (product.tags &&
              sourceProduct.tags &&
              product.tags.some((tag) => sourceProduct.tags!.includes(tag)))),
      );

      for (const product of similarProducts.slice(0, 3)) {
        const similarity = this.calculateProductSimilarity(
          sourceProduct,
          product,
        );

        recommendations.push({
          id: `content-${product._id}-${Date.now()}`,
          product,
          type: RecommendationType.CATEGORY_BASED,
          context: RecommendationContext.PRODUCT_DETAIL,
          score: similarity,
          confidence: similarity * 0.7,
          reason: `Similar to ${sourceProduct.name}`,
          source_products: [sourceProduct],
          created_at: new Date().toISOString(),
        });
      }
    }

    return recommendations;
  }

  private async generateMarketBasketRecommendations(
    cartItems: Item[],
    allProducts: Product[],
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    const cartProductIds = cartItems.map((item) => item.product._id);

    // Get product affinities for items in cart
    for (const cartItem of cartItems) {
      const affinities = await this.affinityDB.find({
        selector: { product_a_id: cartItem.product._id },
        sort: [{ affinity_score: "desc" }],
        limit: 5,
      });

      for (const affinity of affinities.docs) {
        if (!cartProductIds.includes(affinity.product_b_id)) {
          const product = allProducts.find(
            (p) => p._id === affinity.product_b_id,
          );
          if (product && product.stock > 0) {
            recommendations.push({
              id: `basket-${product._id}-${Date.now()}`,
              product,
              type: RecommendationType.FREQUENTLY_BOUGHT_TOGETHER,
              context: RecommendationContext.CHECKOUT,
              score: affinity.affinity_score,
              confidence: affinity.confidence,
              reason: `Frequently bought with ${cartItem.product.name}`,
              source_products: [cartItem.product],
              created_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    return recommendations;
  }

  private async generateTrendingRecommendations(
    allProducts: Product[],
    cartItems: Item[],
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    const cartProductIds = cartItems.map((item) => item.product._id);

    // Get recent order data for trending analysis
    const recentOrders = await this.orderDB.find({
      selector: {
        created_at: {
          $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      limit: 1000,
    });

    // Count product frequencies
    const productFrequency = new Map<string, number>();
    for (const order of recentOrders.docs) {
      for (const item of order.items) {
        const count = productFrequency.get(item.product._id) || 0;
        productFrequency.set(item.product._id, count + item.quantity);
      }
    }

    // Convert to trending recommendations
    const trendingProducts = Array.from(productFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .filter(([productId]) => !cartProductIds.includes(productId));

    for (const [productId, frequency] of trendingProducts) {
      const product = allProducts.find((p) => p._id === productId);
      if (product && product.stock > 0) {
        const score = Math.min(frequency / 100, 1.0); // Normalize score
        recommendations.push({
          id: `trending-${product._id}-${Date.now()}`,
          product,
          type: RecommendationType.TRENDING,
          context: RecommendationContext.HOMEPAGE,
          score,
          confidence: score * 0.6,
          reason: `Trending item (${frequency} recent sales)`,
          created_at: new Date().toISOString(),
        });
      }
    }

    return recommendations;
  }

  private async generateInventoryBasedRecommendations(
    allProducts: Product[],
    cartItems: Item[],
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    const cartProductIds = cartItems.map((item) => item.product._id);

    // Recommend products with high stock (to move inventory)
    const highStockProducts = allProducts
      .filter(
        (product) =>
          product.stock > 50 && !cartProductIds.includes(product._id),
      )
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 4);

    for (const product of highStockProducts) {
      const score = Math.min(product.stock / 200, 0.8); // Normalize stock to score
      recommendations.push({
        id: `inventory-${product._id}-${Date.now()}`,
        product,
        type: RecommendationType.INVENTORY_BASED,
        context: RecommendationContext.HOMEPAGE,
        score,
        confidence: score * 0.5,
        reason: `High availability (${product.stock} in stock)`,
        created_at: new Date().toISOString(),
      });
    }

    return recommendations;
  }

  private async generateCategoryBasedRecommendations(
    currentProduct: Product | undefined,
    cartItems: Item[],
    allProducts: Product[],
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    const cartProductIds = cartItems.map((item) => item.product._id);
    const categories = new Set<string>();

    // Collect categories from cart items and current product
    if (currentProduct?.category) {
      categories.add(currentProduct.category);
    }
    cartItems.forEach((item) => {
      if (item.product.category) {
        categories.add(item.product.category);
      }
    });

    // Find products in same categories
    for (const category of categories) {
      const categoryProducts = allProducts
        .filter(
          (product) =>
            product.category === category &&
            !cartProductIds.includes(product._id) &&
            product.stock > 0,
        )
        .sort((a, b) => b.price - a.price) // Sort by price as proxy for quality
        .slice(0, 3);

      for (const product of categoryProducts) {
        recommendations.push({
          id: `category-${product._id}-${Date.now()}`,
          product,
          type: RecommendationType.CATEGORY_BASED,
          context: RecommendationContext.CATEGORY_BROWSE,
          score: 0.6,
          confidence: 0.5,
          reason: `More items in ${category}`,
          created_at: new Date().toISOString(),
        });
      }
    }

    return recommendations;
  }

  private async generateSeasonalRecommendations(
    allProducts: Product[],
    cartItems: Item[],
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    const cartProductIds = cartItems.map((item) => item.product._id);
    const currentMonth = new Date().getMonth();

    // Simple seasonal logic (can be enhanced with actual seasonal data)
    const seasonalCategories = this.getSeasonalCategories(currentMonth);

    for (const category of seasonalCategories) {
      const seasonalProducts = allProducts
        .filter(
          (product) =>
            product.category === category &&
            !cartProductIds.includes(product._id) &&
            product.stock > 0,
        )
        .slice(0, 2);

      for (const product of seasonalProducts) {
        recommendations.push({
          id: `seasonal-${product._id}-${Date.now()}`,
          product,
          type: RecommendationType.SEASONAL,
          context: RecommendationContext.HOMEPAGE,
          score: 0.7,
          confidence: 0.6,
          reason: `Seasonal recommendation`,
          created_at: new Date().toISOString(),
        });
      }
    }

    return recommendations;
  }

  private getSeasonalCategories(month: number): string[] {
    // Simple seasonal mapping - can be enhanced with actual business logic
    const seasonalMap: Record<number, string[]> = {
      11: ["Cold Medicine", "Vitamins"], // December - Winter
      0: ["Cold Medicine", "Vitamins"], // January - Winter
      1: ["Cold Medicine", "Vitamins"], // February - Winter
      2: ["Allergy Medicine"], // March - Spring
      3: ["Allergy Medicine"], // April - Spring
      4: ["Allergy Medicine"], // May - Spring
      5: ["Sunscreen", "Hydration"], // June - Summer
      6: ["Sunscreen", "Hydration"], // July - Summer
      7: ["Sunscreen", "Hydration"], // August - Summer
      8: ["Back to School"], // September - Fall
      9: ["Cold Medicine"], // October - Fall
      10: ["Cold Medicine"], // November - Fall
    };

    return seasonalMap[month] || [];
  }

  private calculateProductSimilarity(
    productA: Product,
    productB: Product,
  ): number {
    let similarity = 0;

    // Category match
    if (productA.category === productB.category) {
      similarity += 0.4;
    }

    // Tag similarity
    if (productA.tags && productB.tags) {
      const commonTags = productA.tags.filter((tag) =>
        productB.tags!.includes(tag),
      );
      similarity +=
        (commonTags.length /
          Math.max(productA.tags.length, productB.tags.length)) *
        0.3;
    }

    // Price similarity (closer prices are more similar)
    const priceDiff = Math.abs(productA.price - productB.price);
    const maxPrice = Math.max(productA.price, productB.price);
    const priceScore = 1 - priceDiff / maxPrice;
    similarity += priceScore * 0.2;

    // Manufacturer similarity
    if (productA.manufacturer === productB.manufacturer) {
      similarity += 0.1;
    }

    return Math.min(similarity, 1.0);
  }

  private processRecommendations(
    recommendations: ProductRecommendation[],
    context: RecommendationContext,
    limit: number,
    cartItems: Item[],
  ): ProductRecommendation[] {
    const cartProductIds = cartItems.map((item) => item.product._id);

    // Filter out cart items and low confidence recommendations
    const filtered = recommendations.filter(
      (rec) =>
        !cartProductIds.includes(rec.product._id) &&
        rec.confidence >= (this.config?.min_confidence_threshold || 0.3),
    );

    // Deduplicate by product ID
    const uniqueRecs = new Map<string, ProductRecommendation>();
    for (const rec of filtered) {
      const existing = uniqueRecs.get(rec.product._id);
      if (!existing || rec.score > existing.score) {
        uniqueRecs.set(rec.product._id, rec);
      }
    }

    // Sort by score and apply context-specific ranking
    const sorted = Array.from(uniqueRecs.values()).sort((a, b) => {
      // Prioritize by context relevance
      const contextScore =
        this.getContextScore(a.type, context) -
        this.getContextScore(b.type, context);
      if (contextScore !== 0) return contextScore;

      // Then by score
      return b.score - a.score;
    });

    return sorted.slice(0, limit);
  }

  private getContextScore(
    type: RecommendationType,
    context: RecommendationContext,
  ): number {
    // Context-specific scoring for recommendation types
    const contextScores: Record<
      RecommendationContext,
      Record<RecommendationType, number>
    > = {
      [RecommendationContext.CHECKOUT]: {
        [RecommendationType.FREQUENTLY_BOUGHT_TOGETHER]: 100,
        [RecommendationType.CROSS_SELL]: 90,
        [RecommendationType.UPSELL]: 80,
        [RecommendationType.SUBSTITUTION]: 70,
        [RecommendationType.CATEGORY_BASED]: 60,
        [RecommendationType.CUSTOMER_BASED]: 50,
        [RecommendationType.TRENDING]: 40,
        [RecommendationType.SEASONAL]: 30,
        [RecommendationType.INVENTORY_BASED]: 20,
        [RecommendationType.REORDER]: 10,
      },
      [RecommendationContext.PRODUCT_DETAIL]: {
        [RecommendationType.SUBSTITUTION]: 100,
        [RecommendationType.CATEGORY_BASED]: 90,
        [RecommendationType.UPSELL]: 80,
        [RecommendationType.CROSS_SELL]: 70,
        [RecommendationType.FREQUENTLY_BOUGHT_TOGETHER]: 60,
        [RecommendationType.CUSTOMER_BASED]: 50,
        [RecommendationType.TRENDING]: 40,
        [RecommendationType.SEASONAL]: 30,
        [RecommendationType.INVENTORY_BASED]: 20,
        [RecommendationType.REORDER]: 10,
      },
      [RecommendationContext.HOMEPAGE]: {
        [RecommendationType.TRENDING]: 100,
        [RecommendationType.CUSTOMER_BASED]: 90,
        [RecommendationType.SEASONAL]: 80,
        [RecommendationType.INVENTORY_BASED]: 70,
        [RecommendationType.CATEGORY_BASED]: 60,
        [RecommendationType.REORDER]: 50,
        [RecommendationType.CROSS_SELL]: 40,
        [RecommendationType.UPSELL]: 30,
        [RecommendationType.FREQUENTLY_BOUGHT_TOGETHER]: 20,
        [RecommendationType.SUBSTITUTION]: 10,
      },
      [RecommendationContext.CUSTOMER_PROFILE]: {
        [RecommendationType.CUSTOMER_BASED]: 100,
        [RecommendationType.REORDER]: 90,
        [RecommendationType.TRENDING]: 80,
        [RecommendationType.SEASONAL]: 70,
        [RecommendationType.CATEGORY_BASED]: 60,
        [RecommendationType.CROSS_SELL]: 50,
        [RecommendationType.UPSELL]: 40,
        [RecommendationType.FREQUENTLY_BOUGHT_TOGETHER]: 30,
        [RecommendationType.INVENTORY_BASED]: 20,
        [RecommendationType.SUBSTITUTION]: 10,
      },
      [RecommendationContext.CATEGORY_BROWSE]: {
        [RecommendationType.CATEGORY_BASED]: 100,
        [RecommendationType.TRENDING]: 90,
        [RecommendationType.CUSTOMER_BASED]: 80,
        [RecommendationType.SEASONAL]: 70,
        [RecommendationType.INVENTORY_BASED]: 60,
        [RecommendationType.CROSS_SELL]: 50,
        [RecommendationType.UPSELL]: 40,
        [RecommendationType.FREQUENTLY_BOUGHT_TOGETHER]: 30,
        [RecommendationType.REORDER]: 20,
        [RecommendationType.SUBSTITUTION]: 10,
      },
      [RecommendationContext.SEARCH_RESULTS]: {
        [RecommendationType.CATEGORY_BASED]: 100,
        [RecommendationType.SUBSTITUTION]: 90,
        [RecommendationType.TRENDING]: 80,
        [RecommendationType.CUSTOMER_BASED]: 70,
        [RecommendationType.CROSS_SELL]: 60,
        [RecommendationType.UPSELL]: 50,
        [RecommendationType.SEASONAL]: 40,
        [RecommendationType.FREQUENTLY_BOUGHT_TOGETHER]: 30,
        [RecommendationType.INVENTORY_BASED]: 20,
        [RecommendationType.REORDER]: 10,
      },
      [RecommendationContext.LOW_STOCK_ALERT]: {
        [RecommendationType.SUBSTITUTION]: 100,
        [RecommendationType.CATEGORY_BASED]: 90,
        [RecommendationType.INVENTORY_BASED]: 80,
        [RecommendationType.TRENDING]: 70,
        [RecommendationType.CUSTOMER_BASED]: 60,
        [RecommendationType.CROSS_SELL]: 50,
        [RecommendationType.UPSELL]: 40,
        [RecommendationType.SEASONAL]: 30,
        [RecommendationType.FREQUENTLY_BOUGHT_TOGETHER]: 20,
        [RecommendationType.REORDER]: 10,
      },
    };

    return contextScores[context]?.[type] || 0;
  }

  // Method to update product affinities based on order data
  async updateProductAffinities(order: Order): Promise<void> {
    if (!this.config?.feature_flags.market_basket_analysis) {
      return;
    }

    const items = order.items;

    // Calculate affinities for all product pairs in the order
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const productA = items[i].product;
        const productB = items[j].product;

        await this.updateProductAffinityPair(productA._id, productB._id);
        await this.updateProductAffinityPair(productB._id, productA._id);
      }
    }
  }

  private async updateProductAffinityPair(
    productAId: string,
    productBId: string,
  ): Promise<void> {
    const existingAffinity = await this.affinityDB.find({
      selector: {
        product_a_id: productAId,
        product_b_id: productBId,
      },
      limit: 1,
    });

    if (existingAffinity.docs.length > 0) {
      // Update existing affinity
      const affinity = existingAffinity.docs[0];
      affinity.co_occurrence_count += 1;
      affinity.last_updated = new Date().toISOString();

      // Recalculate scores (simplified)
      affinity.confidence =
        affinity.co_occurrence_count / affinity.total_orders_a;
      affinity.affinity_score = affinity.confidence * 0.8; // Simplified scoring

      await this.affinityDB.put(affinity);
    } else {
      // Create new affinity
      const newAffinity: ProductAffinity = {
        _id: `affinity-${productAId}-${productBId}-${Date.now()}`,
        product_a_id: productAId,
        product_b_id: productBId,
        affinity_score: 0.5, // Initial score
        co_occurrence_count: 1,
        total_orders_a: 1, // Simplified - should be calculated from all orders
        total_orders_b: 1, // Simplified - should be calculated from all orders
        confidence: 0.5,
        lift: 1.0,
        last_updated: new Date().toISOString(),
      };

      await this.affinityDB.put(newAffinity);
    }
  }

  // Method to update customer preferences based on order data
  async updateCustomerPreferences(order: Order): Promise<void> {
    if (!order.customer_id) {
      return;
    }

    for (const item of order.items) {
      await this.updateCustomerProductPreference(order.customer_id, item);
    }
  }

  private async updateCustomerProductPreference(
    customerId: string,
    item: Item,
  ): Promise<void> {
    const existing = await this.preferencesDB.find({
      selector: {
        customer_id: customerId,
        product_id: item.product._id,
      },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      // Update existing preference
      const pref = existing.docs[0];
      pref.purchase_frequency += 1;
      pref.last_purchase_date = new Date().toISOString();
      pref.average_quantity = (pref.average_quantity + item.quantity) / 2;
      pref.total_spent += item.product.price * item.quantity;
      pref.preference_score = Math.min(
        pref.purchase_frequency * 0.1 + pref.total_spent * 0.0001,
        1.0,
      );
      pref.last_updated = new Date().toISOString();

      await this.preferencesDB.put(pref);
    } else {
      // Create new preference
      const newPref: CustomerProductPreference = {
        _id: `pref-${customerId}-${item.product._id}-${Date.now()}`,
        customer_id: customerId,
        product_id: item.product._id,
        preference_score: 0.3, // Initial score
        purchase_frequency: 1,
        last_purchase_date: new Date().toISOString(),
        average_quantity: item.quantity,
        total_spent: item.product.price * item.quantity,
        category_preference: 0.5,
        brand_preference: 0.5,
        last_updated: new Date().toISOString(),
      };

      await this.preferencesDB.put(newPref);
    }
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();
