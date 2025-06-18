import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import type { Customer } from "./stores/customer-store";
import type { Operator } from "./types/operator";
import type { Order } from "./types/order";
import type { Product } from "./types/product";
import { config, log } from "./config/env";

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
    try {
      const remoteProductDB = new PouchDB<Product>(`${COUCHDB_URL}/products`, {
        auth: {
          username: config.couchdbUsername,
          password: config.couchdbPassword,
        },
      });

      remoteProductDB
        .sync(_productDB, {
          live: true,
          retry: true,
        })
        .on("change", (info) => {
          log('debug', "[products] Sync change:", info);
        })
        .on("error", (err) => {
          log('error', "[products] Sync error:", err);
        })
        .on("active", () => {
          log('debug', "[products] Sync active");
        })
        .on("paused", () => {
          log('debug', "[products] Sync paused");
        });

      log('info', `[products] Sync enabled with ${COUCHDB_URL}/products`);
    } catch (error) {
      log('error', "[products] Failed to setup sync:", error);
    }
  } else {
    log('info', "[products] Sync disabled");
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

    remoteOrderDB
      .sync(_orderDB, {
        live: true,
        retry: true,
      })
      .on("change", (info) => {
        console.log("[orders] Sync change:", info);
      })
      .on("error", (err) => {
        console.error("[orders] Sync error:", err);
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
    //@ts-ignore PouchDB is added as a global script in index.html
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
