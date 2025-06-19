import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import { config } from "./config/env";
import type { Customer } from "./types/customer";
import type { Operator } from "./types/operator";
import type { Order } from "./types/order";
import { OrderStatus } from "./types/order";
import type { Product } from "./types/product";
import type {
  CustomerProductPreference,
  ProductAffinity,
  RecommendationConfig,
} from "./types/recommendation";

// Initialize PouchDB with plugins
PouchDB.plugin(PouchDBFind);

export const SYNCING = config.enableSync;
const COUCHDB_URL = config.couchdbUrl;

let _productDB: PouchDB.Database<Product> | null = null;
export const getProductDB = (): PouchDB.Database<Product> => {
  if (_productDB) {
    return _productDB;
  }

  _productDB = new PouchDB("products");
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

    remoteProductDB.sync(_productDB, {
      live: true,
      retry: true,
    });
  }

  return _productDB;
};

let _orderDB: PouchDB.Database<Order> | null = null;
export const getOrderDB = (): PouchDB.Database<Order> => {
  if (_orderDB) {
    return _orderDB;
  }

  _orderDB = new PouchDB("orders");

  if (SYNCING) {
    const remoteOrderDB = new PouchDB<Order>(`${COUCHDB_URL}/orders`, {
      auth: {
        username: config.couchdbUsername,
        password: config.couchdbPassword,
      },
    });

    // One-way sync: only push ALL local orders to remote, never pull
    _orderDB.replicate
      .to(remoteOrderDB, {
        live: true,
        retry: true,
        // Push all orders regardless of status
      })
      .on("change", async (info) => {
        // After successful push, purge all non-pending orders from local storage
        if (info.docs && info.docs.length > 0) {
          for (const doc of info.docs) {
            const order = doc as Order;
            // Purge completed and cancelled orders, keep pending orders
            if (
              (order.status === OrderStatus.COMPLETED ||
                order.status === OrderStatus.CANCELLED) &&
              doc._rev
            ) {
              await _orderDB!.remove(doc._id, doc._rev);
            }
          }
        }
      });
  }

  return _orderDB;
};

let _operatorDB: PouchDB.Database<Operator> | null = null;

export const getOperatorDB = (): PouchDB.Database<Operator> => {
  if (_operatorDB) {
    return _operatorDB;
  }
  _operatorDB = new PouchDB("operators");

  if (SYNCING) {
    const remoteOperatorsDB = new PouchDB(`${COUCHDB_URL}/operators`, {
      auth: {
        username: config.couchdbUsername,
        password: config.couchdbPassword,
      },
    });

    remoteOperatorsDB
      .sync(_operatorDB, {
        live: true,
        retry: true,
      })
      .on("change", (info) => {
        console.log("[operators] Sync change:", info);
      })
      .on("error", (err) => {
        console.error("[operators] Sync error:", err);
      });
  }
  return _operatorDB;
};

let _customerDB: PouchDB.Database<Customer> | null = null;
export const getCustomerDB = (): PouchDB.Database<Customer> => {
  if (_customerDB) {
    return _customerDB;
  }
  _customerDB = new PouchDB("customers");
  _customerDB.createIndex({
    index: { fields: ["document"] },
  });

  if (SYNCING) {
    const remoteCustomersDB = new PouchDB(`${COUCHDB_URL}/customers`, {
      auth: {
        username: config.couchdbUsername,
        password: config.couchdbPassword,
      },
    });

    remoteCustomersDB
      .sync(_customerDB, {
        live: true,
        retry: true,
      })
      .on("change", (info) => {
        console.log("[customers] Sync change:", info);
      })
      .on("error", (err) => {
        console.error("[customers] Sync error:", err);
      });
  }
  return _customerDB;
};

// Product Affinity Database
let _productAffinityDB: PouchDB.Database<ProductAffinity> | null = null;
export const getProductAffinityDB = (): PouchDB.Database<ProductAffinity> => {
  if (_productAffinityDB) {
    return _productAffinityDB;
  }

  _productAffinityDB = new PouchDB("product-affinity");
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
      }
    );

    remoteAffinityDB.sync(_productAffinityDB, {
      live: true,
      retry: true,
    });
  }

  return _productAffinityDB;
};

// Customer Product Preferences Database
let _customerPreferencesDB: PouchDB.Database<CustomerProductPreference> | null =
  null;
export const getCustomerPreferencesDB =
  (): PouchDB.Database<CustomerProductPreference> => {
    if (_customerPreferencesDB) {
      return _customerPreferencesDB;
    }

    _customerPreferencesDB = new PouchDB("customer-preferences");
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
        }
      );

      remotePreferencesDB.sync(_customerPreferencesDB, {
        live: true,
        retry: true,
      });
    }

    return _customerPreferencesDB;
  };

// Recommendation Configuration Database
let _recommendationConfigDB: PouchDB.Database<RecommendationConfig> | null =
  null;
export const getRecommendationConfigDB =
  (): PouchDB.Database<RecommendationConfig> => {
    if (_recommendationConfigDB) {
      return _recommendationConfigDB;
    }

    _recommendationConfigDB = new PouchDB("recommendation-config");

    if (SYNCING) {
      const remoteConfigDB = new PouchDB<RecommendationConfig>(
        `${COUCHDB_URL}/recommendation-config`,
        {
          auth: {
            username: config.couchdbUsername,
            password: config.couchdbPassword,
          },
        }
      );

      remoteConfigDB.sync(_recommendationConfigDB, {
        live: true,
        retry: true,
      });
    }

    return _recommendationConfigDB;
  };
