import { config } from "@/config/env";
import type { Product } from "@/product/product";
import { getFullPouchDB } from "@/db/pouchdb-config";

const SYNCING = config.enableSync;
const COUCHDB_URL = config.couchdbUrl;
const POUCHDB_ADAPTER = config.pouchdbAdapter || "idb";

let _productDB: PouchDB.Database<Product> | null = null;

export const getProductDB = async (): Promise<PouchDB.Database<Product>> => {
  if (_productDB) {
    return _productDB;
  }

  const PouchDB = await getFullPouchDB();
  _productDB = new PouchDB("products", {
    adapter: POUCHDB_ADAPTER,
  }) as PouchDB.Database<Product>;

  await _productDB.createIndex({
    index: { fields: ["barcode"] },
  });

  await _productDB.createIndex({
    index: { fields: ["category"] },
  });

  await _productDB.createIndex({
    index: { fields: ["name"] },
  });

  if (SYNCING && COUCHDB_URL) {
    try {
      // Setup sync directly using the new sync service
      const { syncService } = await import("@/db/sync-service");
      await syncService.startSync(_productDB, `${COUCHDB_URL}/products`, {
        live: true,
        retry: true,
        continuous: true,
      });
    } catch (error) {
      console.warn("Failed to start product database sync:", error);
    }
  }

  return _productDB;
};

export const resetProductDB = async (): Promise<void> => {
  if (_productDB) {
    await _productDB.destroy();
    _productDB = null;
  }
};
