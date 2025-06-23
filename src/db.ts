import { config } from "@/config/env";
import type {
  CustomerProductPreference,
  ProductAffinity,
  RecommendationConfig,
} from "@/types/recommendation";

export const SYNCING = config.enableSync;

// Lazy-loaded database getters for better code splitting
export const getProductDB = async () => {
  const { getProductDB } = await import("@/db/product-db");
  return getProductDB();
};

export const getCustomerDB = async () => {
  const { getCustomerDB } = await import("@/db/customer-db");
  return getCustomerDB();
};

export const getOrderDB = async () => {
  const { getOrderDB } = await import("@/db/order-db");
  return getOrderDB();
};

export const getOperatorDB = async () => {
  const { getOperatorDB } = await import("@/db/operator-db");
  return getOperatorDB();
};

// Reset functions for cleanup
export const resetProductDB = async () => {
  const { resetProductDB } = await import("@/db/product-db");
  return resetProductDB();
};

export const resetCustomerDB = async () => {
  const { resetCustomerDB } = await import("@/db/customer-db");
  return resetCustomerDB();
};

export const resetOrderDB = async () => {
  const { resetOrderDB } = await import("@/db/order-db");
  return resetOrderDB();
};

export const resetOperatorDB = async () => {
  const { resetOperatorDB } = await import("@/db/operator-db");
  return resetOperatorDB();
};

// Recommendation system databases
let _customerProductPreferenceDB: PouchDB.Database<CustomerProductPreference> | null =
  null;
let _productAffinityDB: PouchDB.Database<ProductAffinity> | null = null;
let _recommendationConfigDB: PouchDB.Database<RecommendationConfig> | null =
  null;

export const getCustomerProductPreferenceDB = async (): Promise<
  PouchDB.Database<CustomerProductPreference>
> => {
  if (_customerProductPreferenceDB) {
    return _customerProductPreferenceDB;
  }
  const PouchDB = await PouchDBFactory.createPouchDB();
  _customerProductPreferenceDB = new PouchDB("customer_product_preferences", {
    adapter: config.pouchdb.adapter,
  });
  await _customerProductPreferenceDB.createIndex({
    index: { fields: ["customer_id"] },
  });
  await _customerProductPreferenceDB.createIndex({
    index: { fields: ["product_id"] },
  });
  return _customerProductPreferenceDB;
};

export const getProductAffinityDB = async (): Promise<
  PouchDB.Database<ProductAffinity>
> => {
  if (_productAffinityDB) {
    return _productAffinityDB;
  }
  _productAffinityDB = new PouchDB("product_affinity", {
    adapter: config.pouchdb.adapter,
  });
  await _productAffinityDB.createIndex({
    index: { fields: ["product_a"] },
  });
  await _productAffinityDB.createIndex({
    index: { fields: ["product_b"] },
  });
  return _productAffinityDB;
};

export const getRecommendationConfigDB = async (): Promise<
  PouchDB.Database<RecommendationConfig>
> => {
  if (_recommendationConfigDB) {
    return _recommendationConfigDB;
  }
  _recommendationConfigDB = new PouchDB("recommendation_config", {
    adapter: config.pouchdb.adapter,
  });
  return _recommendationConfigDB;
};

// Sync all databases
export const initializeDatabases = async () => {
  // Initialize all databases (this will trigger the lazy loading)
  await Promise.all([
    getProductDB(),
    getCustomerDB(),
    getOrderDB(),
    getOperatorDB(),
    getCustomerProductPreferenceDB(),
    getProductAffinityDB(),
    getRecommendationConfigDB(),
  ]);
};

// Reset all databases for testing
export const resetAllDatabases = async () => {
  await Promise.all([
    resetProductDB(),
    resetCustomerDB(),
    resetOrderDB(),
    resetOperatorDB(),
  ]);

  // Reset recommendation databases
  if (_customerProductPreferenceDB) {
    await _customerProductPreferenceDB.destroy();
    _customerProductPreferenceDB = null;
  }
  if (_productAffinityDB) {
    await _productAffinityDB.destroy();
    _productAffinityDB = null;
  }
  if (_recommendationConfigDB) {
    await _recommendationConfigDB.destroy();
    _recommendationConfigDB = null;
  }
};
