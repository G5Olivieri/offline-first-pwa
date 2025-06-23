import { config } from "@/config/env";
import type { Customer } from "@/customer/customer";
import { PouchDBFactory } from "@/db/pouchdb-config";

const SYNCING = config.enableSync;
const COUCHDB_URL = config.couchdbUrl;
const POUCHDB_ADAPTER = config.pouchdb.adapter || "idb";

let _customerDB: PouchDB.Database<Customer> | null = null;

export const getCustomerDB = async (): Promise<PouchDB.Database<Customer>> => {
  if (_customerDB) {
    return _customerDB;
  }

  const PouchDB = await PouchDBFactory.createPouchDB();

  _customerDB = new PouchDB("customers", {
    adapter: POUCHDB_ADAPTER,
  }) as PouchDB.Database<Customer>;

  await _customerDB.createIndex({
    index: { fields: ["document"] },
  });

  await _customerDB.createIndex({
    index: { fields: ["name"] },
  });

  if (SYNCING && COUCHDB_URL) {
    try {
      const { syncService } = await import("@/db/sync-service");
      await syncService.startSync(_customerDB, `${COUCHDB_URL}/customers`, {
        live: true,
        retry: true,
        continuous: true,
      });
    } catch (error) {
      console.warn("Failed to start customer database sync:", error);
    }
  }

  return _customerDB;
};

export const resetCustomerDB = async (): Promise<void> => {
  if (_customerDB) {
    await _customerDB.destroy();
    _customerDB = null;
  }
};
