import { config } from "@/config/env";
import type { Operator } from "@/operator/operator";
import { getFullPouchDB } from "@/db/pouchdb-config";

const SYNCING = config.enableSync;
const COUCHDB_URL = config.couchdbUrl;
const POUCHDB_ADAPTER = config.pouchdbAdapter || "idb";

let _operatorDB: PouchDB.Database<Operator> | null = null;

export const getOperatorDB = async (): Promise<PouchDB.Database<Operator>> => {
  if (_operatorDB) {
    return _operatorDB;
  }

  const PouchDB = await getFullPouchDB();
  _operatorDB = new PouchDB("operators", {
    adapter: POUCHDB_ADAPTER,
  }) as PouchDB.Database<Operator>;

  await _operatorDB.createIndex({
    index: { fields: ["username"] },
  });

  await _operatorDB.createIndex({
    index: { fields: ["role"] },
  });

  if (SYNCING && COUCHDB_URL) {
    try {
      const { syncService } = await import("@/db/sync-service");
      await syncService.startSync(_operatorDB, `${COUCHDB_URL}/operators`, {
        live: true,
        retry: true,
        continuous: true,
      });
    } catch (error) {
      console.warn("Failed to start operator database sync:", error);
    }
  }

  return _operatorDB;
};

export const resetOperatorDB = async (): Promise<void> => {
  if (_operatorDB) {
    await _operatorDB.destroy();
    _operatorDB = null;
  }
};
