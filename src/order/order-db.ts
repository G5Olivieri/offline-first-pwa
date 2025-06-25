import { config } from "@/config/env";
import { PouchDB } from "@/db/pouchdb-config";
import type { Order } from "@/order/order";
import { useAuthStore } from "@/stores/auth-store";

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

  if (config.enableSync && config.couchdbUrl) {
    const name = _orderDB.name;
    _orderDB.replicate
      .to<Order>(`${config.couchdbUrl}/${name}`, {
        live: true,
        retry: true,
      })
      .on("active", () => {
        console.log(`${name} DB replication started successfully.`);
      })
      .on("change", (info) => {
        if (info.docs && info.docs.length > 0) {
          info.docs.forEach((doc) => {
            if (["cancelled", "completed"].includes(doc.status)) {
              // Only supported in IndexedDB adapter
              if (POUCHDB_ADAPTER === "indexeddb") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (_orderDB as any)
                  .purge(doc._id, doc._rev)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .then((result: any) => {
                    console.log(
                      `Purged order ${doc._id} (${doc.status}):`,
                      result,
                    );
                  });
                // TODO: purge old orders
              }
            }
          });
        }
      })
      .on("complete", (info) => {
        console.log(`${name} DB replication completed:`, info);
      })
      .on("denied", (err) => {
        console.error(`${name} DB replication denied:`, err);
      })
      .on("error", (err) => {
        console.error(`${name} DB replication error:`, err);
        if (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (err as any).error === "unauthorized"
        ) {
          // TODO: remove store dependency
          const authStore = useAuthStore();
          authStore.handleUnauthorized();
        }
      })
      .on("paused", () => {
        console.log(`${name} DB replication paused.`);
      });
  }
  return _orderDB;
};

export const resetOrderDB = async (): Promise<void> => {
  if (_orderDB) {
    await _orderDB.destroy();
    _orderDB = null;
  }
};
