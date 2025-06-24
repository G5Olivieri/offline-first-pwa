import { config } from "@/config/env";
import { PouchDB } from "@/db/pouchdb-config";
import type { Operator } from "@/operator/operator";
import { sync } from "@/db/sync";

const POUCHDB_ADAPTER = config.pouchdb.adapter || "idb";

let _operatorDB: PouchDB.Database<Operator> | null = null;

export const getOperatorDB = async (): Promise<PouchDB.Database<Operator>> => {
  if (_operatorDB) {
    return _operatorDB;
  }

  _operatorDB = new PouchDB("operators", {
    adapter: POUCHDB_ADAPTER,
  }) as PouchDB.Database<Operator>;

  await _operatorDB.createIndex({
    index: { fields: ["username"] },
  });

  await _operatorDB.createIndex({
    index: { fields: ["role"] },
  });

  sync(_operatorDB);
  return _operatorDB;
};

export const resetOperatorDB = async (): Promise<void> => {
  if (_operatorDB) {
    await _operatorDB.destroy();
    _operatorDB = null;
  }
};
