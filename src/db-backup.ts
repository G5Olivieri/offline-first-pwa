import { config } from "@/config/env";
import type { Customer } from "@/customer/customer";
import type { Operator } from "@/operator/operator";
import type { Product } from "@/product/product";
import { syncManager } from "@/services/sync-manager";
import { type Order } from "@/types/order";
import type {
  CustomerProductPreference,
  ProductAffinity,
  RecommendationConfig,
} from "@/types/recommendation";
import PouchDB from "@/db/pouchdb-config";

export const SYNCING = config.enableSync;
const COUCHDB_URL = config.couchdbUrl;
const POUCHDB_ADAPTER = config.pouchdbAdapter || "idb"; // Default to IndexedDB if not specified

const productConflictResolution = {
  strategy: "remote-wins" as const,
  resolver: (local: Product, remote: Product): Product => {
    // For products, remote should always win for product details
    // but stock levels should be handled by order sync completion
    return {
      ...remote,
      // Keep local stock until orders are synced and remote updates stock
      stock: local.stock,
    };
  },
};

const timestampConflictResolution = {
  strategy: "merge" as const, // Uses timestamp-based merge in sync manager
};

let _productDB: PouchDB.Database<Product> | null = null;
export const getProductDB = (): PouchDB.Database<Product> => {
  if (_productDB) {
    return _productDB;
  }

  _productDB = new PouchDB("products", {
    adapter: POUCHDB_ADAPTER,
  });
  _productDB.createIndex({
    index: { fields: ["barcode"] },
  });

  if (SYNCING) {
    const remoteProductDB = new PouchDB<Product>(`${COUCHDB_URL}/products`, {
      auth: {
        username: config.couchdbUsername,
        password: config.couchdbPassword,
      },
    });

    syncManager.setupBidirectionalSync(
      _productDB,
      remoteProductDB,
      "products",
      productConflictResolution,
      {
        live: true,
        retry: true,
      },
    );
  }

  return _productDB;
};

let _orderDB: PouchDB.Database<Order> | null = null;
export const getOrderDB = (): PouchDB.Database<Order> => {
  if (_orderDB) {
    return _orderDB;
  }

  _orderDB = new PouchDB("orders", {
    adapter: POUCHDB_ADAPTER,
  });

  if (SYNCING) {
    const remoteOrderDB = new PouchDB<Order>(`${COUCHDB_URL}/orders`, {
      auth: {
        username: config.couchdbUsername,
        password: config.couchdbPassword,
      },
    });

    syncManager.setupUnidirectionalSync(_orderDB, remoteOrderDB, "orders", {
      live: true,
      retry: true,
    });
  }

  return _orderDB;
};

let _operatorDB: PouchDB.Database<Operator> | null = null;

export const getOperatorDB = (): PouchDB.Database<Operator> => {
  if (_operatorDB) {
    return _operatorDB;
  }
  _operatorDB = new PouchDB("operators", {
    adapter: POUCHDB_ADAPTER,
  });
  _operatorDB.createIndex({
    index: { fields: ["name"] },
  });

  if (SYNCING) {
    const remoteOperatorsDB = new PouchDB<Operator>(
      `${COUCHDB_URL}/operators`,
      {
        auth: {
          username: config.couchdbUsername,
          password: config.couchdbPassword,
        },
      },
    );

    syncManager.setupBidirectionalSync(
      _operatorDB,
      remoteOperatorsDB,
      "operators",
      timestampConflictResolution,
      {
        live: true,
        retry: true,
      },
    );
  }
  return _operatorDB;
};

let _customerDB: PouchDB.Database<Customer> | null = null;
export const getCustomerDB = (): PouchDB.Database<Customer> => {
  if (_customerDB) {
    return _customerDB;
  }
  _customerDB = new PouchDB("customers", {
    adapter: POUCHDB_ADAPTER,
  });
  _customerDB.createIndex({
    index: { fields: ["document"] },
  });

  if (SYNCING) {
    const remoteCustomersDB = new PouchDB<Customer>(
      `${COUCHDB_URL}/customers`,
      {
        auth: {
          username: config.couchdbUsername,
          password: config.couchdbPassword,
        },
      },
    );

    syncManager.setupBidirectionalSync(
      _customerDB,
      remoteCustomersDB,
      "customers",
      timestampConflictResolution,
      {
        live: true,
        retry: true,
      },
    );
  }
  return _customerDB;
};

let _productAffinityDB: PouchDB.Database<ProductAffinity> | null = null;
export const getProductAffinityDB = (): PouchDB.Database<ProductAffinity> => {
  if (_productAffinityDB) {
    return _productAffinityDB;
  }

  _productAffinityDB = new PouchDB("product-affinity", {
    adapter: POUCHDB_ADAPTER,
  });
  _productAffinityDB.createIndex({
    index: { fields: ["product_a_id"] },
  });
  _productAffinityDB.createIndex({
    index: { fields: ["product_b_id"] },
  });
  _productAffinityDB.createIndex({
    index: { fields: ["affinity_score"] },
  });

  if (SYNCING) {
    const remoteAffinityDB = new PouchDB<ProductAffinity>(
      `${COUCHDB_URL}/product-affinity`,
      {
        auth: {
          username: config.couchdbUsername,
          password: config.couchdbPassword,
        },
      },
    );

    syncManager.setupBidirectionalSync(
      _productAffinityDB,
      remoteAffinityDB,
      "product-affinity",
      timestampConflictResolution,
      {
        live: true,
        retry: true,
      },
    );
  }

  return _productAffinityDB;
};

let _customerPreferencesDB: PouchDB.Database<CustomerProductPreference> | null =
  null;
export const getCustomerPreferencesDB =
  (): PouchDB.Database<CustomerProductPreference> => {
    if (_customerPreferencesDB) {
      return _customerPreferencesDB;
    }

    _customerPreferencesDB = new PouchDB("customer-preferences", {
      adapter: POUCHDB_ADAPTER,
    });
    _customerPreferencesDB.createIndex({
      index: { fields: ["customer_id"] },
    });
    _customerPreferencesDB.createIndex({
      index: { fields: ["product_id"] },
    });
    _customerPreferencesDB.createIndex({
      index: { fields: ["preference_score"] },
    });

    if (SYNCING) {
      const remotePreferencesDB = new PouchDB<CustomerProductPreference>(
        `${COUCHDB_URL}/customer-preferences`,
        {
          auth: {
            username: config.couchdbUsername,
            password: config.couchdbPassword,
          },
        },
      );

      syncManager.setupBidirectionalSync(
        _customerPreferencesDB,
        remotePreferencesDB,
        "customer-preferences",
        timestampConflictResolution,
        {
          live: true,
          retry: true,
        },
      );
    }

    return _customerPreferencesDB;
  };

let _recommendationConfigDB: PouchDB.Database<RecommendationConfig> | null =
  null;
export const getRecommendationConfigDB =
  (): PouchDB.Database<RecommendationConfig> => {
    if (_recommendationConfigDB) {
      return _recommendationConfigDB;
    }

    _recommendationConfigDB = new PouchDB("recommendation-config", {
      adapter: POUCHDB_ADAPTER,
    });

    if (SYNCING) {
      const remoteConfigDB = new PouchDB<RecommendationConfig>(
        `${COUCHDB_URL}/recommendation-config`,
        {
          auth: {
            username: config.couchdbUsername,
            password: config.couchdbPassword,
          },
        },
      );

      syncManager.setupBidirectionalSync(
        _recommendationConfigDB,
        remoteConfigDB,
        "recommendation-config",
        timestampConflictResolution,
        {
          live: true,
          retry: true,
        },
      );
    }

    return _recommendationConfigDB;
  };
