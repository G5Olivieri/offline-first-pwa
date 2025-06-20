import type { Customer } from "@/types/customer";
import type { Product } from "@/types/product";

export enum RecommendationType {
  CROSS_SELL = "cross-sell",
  UPSELL = "upsell",
  FREQUENTLY_BOUGHT_TOGETHER = "frequently-bought-together",
  CUSTOMER_BASED = "customer-based",
  SEASONAL = "seasonal",
  TRENDING = "trending",
  INVENTORY_BASED = "inventory-based",
  CATEGORY_BASED = "category-based",
  SUBSTITUTION = "substitution",
  REORDER = "reorder",
}

export enum RecommendationContext {
  CHECKOUT = "checkout",
  PRODUCT_DETAIL = "product-detail",
  CUSTOMER_PROFILE = "customer-profile",
  HOMEPAGE = "homepage",
  CATEGORY_BROWSE = "category-browse",
  SEARCH_RESULTS = "search-results",
  LOW_STOCK_ALERT = "low-stock-alert",
}

export type RecommendationRule = {
  id: string;
  name: string;
  type: RecommendationType;
  context: RecommendationContext[];
  priority: number;
  enabled: boolean;
  conditions: RecommendationCondition[];
  parameters: Record<string, string | number | boolean | string[]>;
  created_at: string;
  updated_at: string;
};

export type RecommendationCondition = {
  field: string;
  operator:
    | "equals"
    | "greater_than"
    | "less_than"
    | "contains"
    | "in"
    | "not_in";
  value: string | number | boolean | string[];
};

export type ProductRecommendation = {
  id: string;
  product: Product;
  type: RecommendationType;
  context: RecommendationContext;
  score: number;
  confidence: number;
  reason: string;
  source_products?: Product[];
  source_customer?: Customer;
  metadata?: Record<string, string | number | boolean>;
  created_at: string;
  expires_at?: string;
};

export type RecommendationSet = {
  id: string;
  context: RecommendationContext;
  recommendations: ProductRecommendation[];
  total_score: number;
  generated_at: string;
  customer_id?: string;
  session_id?: string;
  cart_items?: string[]; // Product IDs
};

export type ProductAffinity = {
  _id: string;
  _rev?: string;
  product_a_id: string;
  product_b_id: string;
  affinity_score: number;
  co_occurrence_count: number;
  total_orders_a: number;
  total_orders_b: number;
  confidence: number;
  lift: number;
  last_updated: string;
};

export type CustomerProductPreference = {
  _id: string;
  _rev?: string;
  customer_id: string;
  product_id: string;
  preference_score: number;
  purchase_frequency: number;
  last_purchase_date: string;
  average_quantity: number;
  total_spent: number;
  category_preference: number;
  brand_preference: number;
  seasonal_pattern?: Record<string, number>;
  last_updated: string;
};

export type RecommendationConfig = {
  enabled: boolean;
  max_recommendations_per_context: number;
  min_confidence_threshold: number;
  cache_duration_minutes: number;
  rules: RecommendationRule[];
  feature_flags: {
    collaborative_filtering: boolean;
    content_based_filtering: boolean;
    market_basket_analysis: boolean;
    seasonal_recommendations: boolean;
    inventory_based_recommendations: boolean;
    real_time_updates: boolean;
  };
};
