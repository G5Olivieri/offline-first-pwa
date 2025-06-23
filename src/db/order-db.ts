import { config } from "@/config/env";
import { PouchDB } from "./pouchdb-config";
import type { Order } from "@/types/order";

const POUCHDB_ADAPTER = config.pouchdb.adapter || "idb";

let _orderDB: PouchDB.Database<Order> | null = null;

export const getOrderDB = async (): Promise<PouchDB.Database<Order>> => {
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

  return _orderDB;
};

export const resetOrderDB = async (): Promise<void> => {
  if (_orderDB) {
    await _orderDB.destroy();
    _orderDB = null;
  }
};
