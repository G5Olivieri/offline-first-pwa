import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import { config } from "./config/env";
import { createLogger } from "./services/logger-service";
import type { Customer } from "./stores/customer-store";
import type { Operator } from "./types/operator";
import type { Order } from "./types/order";
import { OrderStatus } from "./types/order";
import type { Product } from "./types/product";

// Initialize PouchDB with plugins
PouchDB.plugin(PouchDBFind);

const logger = createLogger("DB");

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
          logger.debug("[products] Sync change:", info);
        })
        .on("error", (err) => {
          logger.error("[products] Sync error:", err);
        })
        .on("active", () => {
          logger.debug("[products] Sync active");
        })
        .on("paused", () => {
          logger.debug("[products] Sync paused");
        });

      logger.info(`[products] Sync enabled with ${COUCHDB_URL}/products`);
    } catch (error) {
      logger.error("[products] Failed to setup sync:", error);
    }
  } else {
    logger.info("[products] Sync disabled");
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
    try {
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
          logger.debug("[orders] Pushed orders to remote:", info);

          // After successful push, purge all non-pending orders from local storage
          if (info.docs && info.docs.length > 0) {
            for (const doc of info.docs) {
              const order = doc as Order;
              // Purge completed and cancelled orders, keep pending orders
              if (
                order.status === OrderStatus.COMPLETED ||
                order.status === OrderStatus.CANCELLED
              ) {
                try {
                  if (doc._rev) {
                    await _orderDB!.remove(doc._id, doc._rev);
                    logger.debug(
                      `[orders] Purged ${order.status} order ${doc._id} from local storage`
                    );
                  }
                } catch (error) {
                  logger.error(
                    `[orders] Failed to purge order ${doc._id}:`,
                    error
                  );
                }
              }
            }
          }
        })
        .on("error", (err) => {
          logger.error("[orders] Sync error:", err);
        })
        .on("active", () => {
          logger.debug("[orders] Sync active");
        })
        .on("paused", () => {
          logger.debug("[orders] Sync paused");
        });

      logger.info(
        `[orders] One-way sync enabled with ${COUCHDB_URL}/orders (push all orders, never pull)`
      );
    } catch (error) {
      logger.error("[orders] Failed to setup sync:", error);
    }
  } else {
    logger.info("[orders] Sync disabled");
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
