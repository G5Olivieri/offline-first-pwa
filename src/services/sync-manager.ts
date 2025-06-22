import type { Order } from "@/types/order";
import { OrderStatus } from "@/types/order";

export interface BaseDocument {
  _id: string;
  _rev?: string;
  [key: string]: unknown;
}

export interface SyncOptions {
  live?: boolean;
  retry?: boolean;
  filter?: string | ((doc: BaseDocument) => boolean);
  since?: number | string;
  timeout?: number;
}

export interface SyncResult {
  ok: boolean;
  start_time: string;
  end_time: string;
  docs_read: number;
  docs_written: number;
  doc_write_failures: number;
  errors: Error[];
}

export interface ConflictResolution<T extends BaseDocument> {
  strategy: 'remote-wins' | 'local-wins' | 'merge' | 'custom';
  resolver?: (local: T, remote: T) => T;
}

export class SyncManager {
  private static instance: SyncManager;
  private syncStates: Map<string, boolean> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private maxRetryAttempts = 3;
  private retryDelay = 1000; // Start with 1 second

  private constructor() {}

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }


  setupBidirectionalSync<T extends BaseDocument>(
    localDB: PouchDB.Database<T>,
    remoteDB: PouchDB.Database<T>,
    dbName: string,
    conflictResolution: ConflictResolution<T>,
    options: SyncOptions = {}
  ): PouchDB.Replication.Sync<T> {
    const defaultOptions: SyncOptions = {
      live: true,
      retry: true,
      ...options
    };

    const syncHandler = localDB.sync(remoteDB, {
      ...defaultOptions,
      since: options.since || 0,
    } as PouchDB.Replication.SyncOptions);

    this.setupConflictResolution(localDB, conflictResolution);

    syncHandler.on('change', (info) => {
      console.log(`[${dbName}] Sync change:`, info);
      this.syncStates.set(dbName, true);
    });

    syncHandler.on('paused', (err) => {
      if (err) {
        console.error(`[${dbName}] Sync paused with error:`, err);
      } else {
        console.log(`[${dbName}] Sync paused (caught up)`);
      }
      this.syncStates.set(dbName, false);
    });

    syncHandler.on('active', () => {
      console.log(`[${dbName}] Sync resumed`);
      this.syncStates.set(dbName, true);
    });

    syncHandler.on('denied', (err) => {
      console.error(`[${dbName}] Sync denied:`, err);
      this.handleSyncError(dbName, err instanceof Error ? err : new Error(String(err)));
    });

    syncHandler.on('error', (err) => {
      console.error(`[${dbName}] Sync error:`, err);
      this.handleSyncError(dbName, err instanceof Error ? err : new Error(String(err)));
    });

    return syncHandler;
  }

  setupUnidirectionalSync<T extends BaseDocument>(
    localDB: PouchDB.Database<T>,
    remoteDB: PouchDB.Database<T>,
    dbName: string,
    options: SyncOptions = {}
  ): PouchDB.Replication.Replication<T> {
    const defaultOptions: SyncOptions = {
      live: true,
      retry: true,
      filter: (doc: BaseDocument) => {
        // Only sync completed orders
        if (dbName === 'orders') {
          return (doc as Order).status === OrderStatus.COMPLETED;
        }
        return true;
      },
      ...options
    };

    const replication = localDB.replicate.to(remoteDB, defaultOptions as PouchDB.Replication.ReplicateOptions);

    replication.on('change', (info) => {
      console.log(`[${dbName}] Push sync change:`, info);
      if (dbName === 'orders') {
        this.purgeSuccessfulOrders(
          localDB as unknown as PouchDB.Database<Order>,
          info.docs as unknown as Order[]
        );
      }
    });

    replication.on('paused', (err) => {
      if (err) {
        console.error(`[${dbName}] Push sync paused with error:`, err);
      } else {
        console.log(`[${dbName}] Push sync paused (caught up)`);
      }
      this.syncStates.set(`${dbName}-push`, false);
    });

    replication.on('active', () => {
      console.log(`[${dbName}] Push sync resumed`);
      this.syncStates.set(`${dbName}-push`, true);
    });

    replication.on('denied', (err) => {
      console.error(`[${dbName}] Push sync denied:`, err);
      this.handleSyncError(`${dbName}-push`, err instanceof Error ? err : new Error(String(err)));
    });

    replication.on('error', (err) => {
      console.error(`[${dbName}] Push sync error:`, err);
      this.handleSyncError(`${dbName}-push`, err instanceof Error ? err : new Error(String(err)));
    });

    return replication;
  }

  private setupConflictResolution<T extends BaseDocument>(
    db: PouchDB.Database<T>,
    resolution: ConflictResolution<T>
  ): void {
    db.changes({
      since: 'now',
      live: true,
      include_docs: true,
      conflicts: true
    }).on('change', async (change) => {
      if (change.doc && (change.doc as BaseDocument & { _conflicts?: string[] })._conflicts) {
        await this.resolveConflict(db, change.doc as T, resolution);
      }
    });
  }

  private async resolveConflict<T extends BaseDocument>(
    db: PouchDB.Database<T>,
    doc: T,
    resolution: ConflictResolution<T>
  ): Promise<void> {
    try {
      const docWithConflicts = doc as T & { _conflicts?: string[] };
      const conflicts = docWithConflicts._conflicts || [];

      if (conflicts.length === 0) return;

      const conflictDocs = await Promise.all(
        conflicts.map((rev: string) =>
          db.get(doc._id, { rev })
        )
      );

      let resolvedDoc: T;

      switch (resolution.strategy) {
        case 'remote-wins':
          resolvedDoc = conflictDocs.sort((a: T, b: T) =>
            (b._rev || '').localeCompare(a._rev || '')
          )[0];
          break;

        case 'local-wins':
          resolvedDoc = doc;
          break;

        case 'merge':
          resolvedDoc = this.mergeDocuments(doc, conflictDocs[0]);
          break;

        case 'custom':
          if (resolution.resolver) {
            resolvedDoc = resolution.resolver(doc, conflictDocs[0]);
          } else {
            throw new Error('Custom resolver not provided');
          }
          break;

        default:
          resolvedDoc = doc;
      }

      await db.put(resolvedDoc as PouchDB.Core.PutDocument<T>);

      await Promise.all(
        conflicts.map((rev: string) =>
          db.remove(doc._id, rev)
        )
      );

      console.log(`Conflict resolved for document ${doc._id}`);
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  }


  private mergeDocuments<T extends BaseDocument>(local: T, remote: T): T {
    const localWithTime = local as T & { updated_at?: string; created_at?: string };
    const remoteWithTime = remote as T & { updated_at?: string; created_at?: string };

    const localTime = new Date(localWithTime.updated_at || localWithTime.created_at || 0);
    const remoteTime = new Date(remoteWithTime.updated_at || remoteWithTime.created_at || 0);

    return localTime > remoteTime ? local : remote;
  }

  private async purgeSuccessfulOrders(
    localDB: PouchDB.Database<Order>,
    syncedDocs: Order[]
  ): Promise<void> {
    try {
      const docsToRemove = syncedDocs.map(doc => ({
        ...doc,
        _deleted: true
      }));

      if (docsToRemove.length > 0) {
        await localDB.bulkDocs(docsToRemove);
        console.log(`Purged ${docsToRemove.length} synced orders from local database`);
      }
    } catch (error) {
      console.error('Error purging synced orders:', error);
    }
  }


  private handleSyncError(syncName: string, error: Error): void {
    const attempts = this.retryAttempts.get(syncName) || 0;

    if (attempts < this.maxRetryAttempts) {
      const delay = this.retryDelay * Math.pow(2, attempts); // Exponential backoff
      this.retryAttempts.set(syncName, attempts + 1);

      console.log(`Retrying sync ${syncName} in ${delay}ms (attempt ${attempts + 1})`);

      setTimeout(() => {
        console.log(`Retry attempt ${attempts + 1} for ${syncName}`, error);
      }, delay);
    } else {
      console.error(`Max retry attempts reached for sync ${syncName}`);
      // Could emit an event here for UI notification
    }
  }

  getSyncStatus(dbName: string): boolean {
    return this.syncStates.get(dbName) || false;
  }

  getAllSyncStatuses(): Record<string, boolean> {
    const statuses: Record<string, boolean> = {};
    this.syncStates.forEach((status, name) => {
      statuses[name] = status;
    });
    return statuses;
  }

  async triggerManualSync<T extends BaseDocument>(
    localDB: PouchDB.Database<T>,
    remoteDB: PouchDB.Database<T>,
    dbName: string
  ): Promise<SyncResult> {
    try {
      console.log(`Triggering manual sync for ${dbName}`);
      const startTime = new Date().toISOString();

      const result = await localDB.sync(remoteDB, {
        timeout: 30000 // 30 second timeout for manual sync
      });

      return {
        ok: true,
        start_time: startTime,
        end_time: new Date().toISOString(),
        docs_read: result.pull?.docs_read || 0,
        docs_written: result.push?.docs_written || 0,
        doc_write_failures: result.push?.doc_write_failures || 0,
        errors: []
      };
    } catch (error) {
      console.error(`Manual sync failed for ${dbName}:`, error);
      return {
        ok: false,
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        docs_read: 0,
        docs_written: 0,
        doc_write_failures: 0,
        errors: [error instanceof Error ? error : new Error(String(error))]
      };
    }
  }
}

export const syncManager = SyncManager.getInstance();
