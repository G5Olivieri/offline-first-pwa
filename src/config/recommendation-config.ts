/**
 * Recommendation System Configuration
 *
 * This file contains default configuration for the recommendation system.
 * These settings can be overridden through the database configuration.
 */

import type { RecommendationConfig } from '../types/recommendation';
import { RecommendationType, RecommendationContext } from '../types/recommendation';

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  enabled: true,
  max_recommendations_per_context: 8,
  min_confidence_threshold: 0.3,
  cache_duration_minutes: 60,
  analytics_enabled: true,
  rules: [
    // Checkout Context Rules
    {
      id: 'checkout-frequently-bought-together',
      name: 'Frequently Bought Together at Checkout',
      type: RecommendationType.FREQUENTLY_BOUGHT_TOGETHER,
      context: [RecommendationContext.CHECKOUT],
      priority: 100,
      enabled: true,
      conditions: [
        { field: 'cart_size', operator: 'greater_than', value: 0 },
        { field: 'product_stock', operator: 'greater_than', value: 0 }
      ],
      parameters: {
        max_recommendations: 4,
        min_affinity_score: 0.4,
        boost_high_margin: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // Homepage Context Rules
    {
      id: 'homepage-trending',
      name: 'Trending Products on Homepage',
      type: RecommendationType.TRENDING,
      context: [RecommendationContext.HOMEPAGE],
      priority: 90,
      enabled: true,
      conditions: [
        { field: 'product_stock', operator: 'greater_than', value: 0 },
        { field: 'recent_sales', operator: 'greater_than', value: 5 }
      ],
      parameters: {
        max_recommendations: 6,
        time_window_days: 7,
        min_sales_count: 5
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // Customer Profile Rules
    {
      id: 'customer-based-recommendations',
      name: 'Customer-Based Recommendations',
      type: RecommendationType.CUSTOMER_BASED,
      context: [RecommendationContext.CUSTOMER_PROFILE, RecommendationContext.HOMEPAGE],
      priority: 85,
      enabled: true,
      conditions: [
        { field: 'customer_id', operator: 'not_in', value: [''] },
        { field: 'product_stock', operator: 'greater_than', value: 0 }
      ],
      parameters: {
        max_recommendations: 5,
        min_preference_score: 0.3,
        include_new_products: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // Product Detail Rules
    {
      id: 'product-detail-similar',
      name: 'Similar Products on Detail Page',
      type: RecommendationType.CATEGORY_BASED,
      context: [RecommendationContext.PRODUCT_DETAIL],
      priority: 80,
      enabled: true,
      conditions: [
        { field: 'product_category', operator: 'not_in', value: [''] },
        { field: 'product_stock', operator: 'greater_than', value: 0 }
      ],
      parameters: {
        max_recommendations: 4,
        same_category_only: false,
        include_tag_matches: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // Inventory-Based Rules
    {
      id: 'high-stock-promotion',
      name: 'High Stock Promotion',
      type: RecommendationType.INVENTORY_BASED,
      context: [RecommendationContext.HOMEPAGE, RecommendationContext.CATEGORY_BROWSE],
      priority: 60,
      enabled: true,
      conditions: [
        { field: 'product_stock', operator: 'greater_than', value: 50 }
      ],
      parameters: {
        max_recommendations: 3,
        min_stock_level: 50,
        prioritize_slow_movers: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // Seasonal Rules
    {
      id: 'seasonal-recommendations',
      name: 'Seasonal Product Recommendations',
      type: RecommendationType.SEASONAL,
      context: [RecommendationContext.HOMEPAGE],
      priority: 70,
      enabled: true,
      conditions: [
        { field: 'product_stock', operator: 'greater_than', value: 0 }
      ],
      parameters: {
        max_recommendations: 4,
        seasonal_categories: ['Cold Medicine', 'Allergy Medicine', 'Sunscreen', 'Vitamins'],
        boost_seasonal_matches: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  feature_flags: {
    collaborative_filtering: true,
    content_based_filtering: true,
    market_basket_analysis: true,
    seasonal_recommendations: true,
    inventory_based_recommendations: true,
    real_time_updates: true
  }
};

// Configuration for different deployment environments
export const RECOMMENDATION_CONFIGS = {
  development: {
    ...DEFAULT_RECOMMENDATION_CONFIG,
    analytics_enabled: true,
    cache_duration_minutes: 5, // Shorter cache for development
    min_confidence_threshold: 0.1 // Lower threshold for testing
  },

  staging: {
    ...DEFAULT_RECOMMENDATION_CONFIG,
    analytics_enabled: true,
    max_recommendations_per_context: 6
  },

  production: {
    ...DEFAULT_RECOMMENDATION_CONFIG,
    analytics_enabled: true,
    min_confidence_threshold: 0.4, // Higher threshold for production
    cache_duration_minutes: 120 // Longer cache for production
  }
};

// Helper function to get config based on environment
export function getRecommendationConfig(environment = 'production'): RecommendationConfig {
  return RECOMMENDATION_CONFIGS[environment as keyof typeof RECOMMENDATION_CONFIGS] || DEFAULT_RECOMMENDATION_CONFIG;
}
