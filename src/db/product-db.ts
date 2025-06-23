import { config } from "@/config/env";
import { PouchDB } from "./pouchdb-config";
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

  await _productDB.createIndex({
    index: { fields: ["category"] },
  });

  return _productDB;
};

export const resetProductDB = async (): Promise<void> => {
  if (_productDB) {
    await _productDB.destroy();
    _productDB = null;
  }
};
