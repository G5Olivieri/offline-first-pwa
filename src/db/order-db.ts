import { config } from "@/config/env";
import type { Order } from "@/types/order";

const SYNCING = config.enableSync;
const COUCHDB_URL = config.couchdbUrl;
const POUCHDB_ADAPTER = config.pouchdbAdapter || "idb";

let _orderDB: PouchDB.Database<Order> | null = null;

export const getOrderDB = async (
  PouchDB: PouchDB.Static,
): Promise<PouchDB.Database<Order>> => {
  if (_orderDB) {
    return _orderDB;
  }

  _orderDB = new PouchDB("orders", {
    adapter: POUCHDB_ADAPTER,
  }) as PouchDB.Database<Order>;

  await _orderDB.createIndex({
    index: { fields: ["status"] },
  });

  await _orderDB.createIndex({
    index: { fields: ["created_at"] },
  });

  await _orderDB.createIndex({
    index: { fields: ["terminal_id"] },
  });

  if (SYNCING && COUCHDB_URL) {
    try {
      const { syncService } = await import("@/db/sync-service");
      await syncService.startSync(_orderDB, `${COUCHDB_URL}/orders`, {
        live: true,
        retry: true,
        continuous: true,
      });
    } catch (error) {
      console.warn("Failed to start order database sync:", error);
    }
  }

  return _orderDB;
};

export const resetOrderDB = async (): Promise<void> => {
  if (_orderDB) {
    await _orderDB.destroy();
    _orderDB = null;
  }
};
