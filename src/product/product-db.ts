import { config } from "@/config/env";
import { PouchDB } from "@/db/pouchdb-config";
import type { Product } from "@/product/product";

const POUCHDB_ADAPTER = config.pouchdb.adapter || "idb";

let _productDB: PouchDB.Database<Product> | null = null;

export const getProductDB = async (): Promise<PouchDB.Database<Product>> => {
  if (_productDB) {
    return _productDB;
  }

  _productDB = new PouchDB("products", {
    adapter: POUCHDB_ADAPTER,
  }) as PouchDB.Database<Product>;

  await _productDB.createIndex({
    index: { fields: ["barcode"] },
  });

  // TODO: sync stock
  await syncProductDB(_productDB);
  return _productDB;
};

export const resetProductDB = async (): Promise<void> => {
  if (_productDB) {
    await _productDB.destroy();
    _productDB = null;
  }
};

export const syncProductDB = async (
  productDB: PouchDB.Database<Product>,
): Promise<void> => {
  const syncHandler = productDB.sync(`${config.couchdbUrl}/${productDB.name}`, {
    live: true,
    retry: true,
    filter: (doc: Product) => {
      const filteredDoc = { ...doc };
      if ("stock" in filteredDoc) {
        // @ts-expect-error TypeScript doesn't know about the stock field
        delete filteredDoc.stock;
      }
      return true;
    },
  });

  syncHandler.on("change", async (info) => {
    console.log("Product DB Sync change:", info);
    if (info.direction === "pull" && info.change.docs) {
      console.log("Product DB Sync pull change:", info.change.docs);
      for (const doc of info.change.docs as Product[]) {
        const localDoc = await productDB.get<Product>(doc._id);
        if (localDoc.stock !== doc.stock) {
          console.log("Product DB Sync stock changed:", localDoc, doc);
          await productDB.put({ ...localDoc, stock: doc.stock });
        }
      }
    }
  });

  syncHandler.on("error", (err) => {
    console.error("Product DB Sync error:", err);
  });

  syncHandler.on("denied", (err) => {
    console.error("Product DB Sync denied:", err);
  });

  syncHandler.on("paused", (err) => {
    console.warn("Product DB Sync paused:", err);
  });

  syncHandler.on("active", () => {
    console.log("Product DB Sync active");
  });

  syncHandler.on("complete", () => {
    console.log("Product DB Sync complete");
  });
};
