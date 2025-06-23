import { config } from "@/config/env";
import { PouchDB } from "./pouchdb-config";
import type { Customer } from "@/customer/customer";

const POUCHDB_ADAPTER = config.pouchdb.adapter || "idb";

let _customerDB: PouchDB.Database<Customer> | null = null;

export const getCustomerDB = async (): Promise<PouchDB.Database<Customer>> => {
  if (_customerDB) {
    return _customerDB;
  }

  _customerDB = new PouchDB("customers", {
    adapter: POUCHDB_ADAPTER,
  }) as PouchDB.Database<Customer>;

  await _customerDB.createIndex({
    index: { fields: ["document"] },
  });

  await _customerDB.createIndex({
    index: { fields: ["name"] },
  });

  return _customerDB;
};

export const resetCustomerDB = async (): Promise<void> => {
  if (_customerDB) {
    await _customerDB.destroy();
    _customerDB = null;
  }
};
