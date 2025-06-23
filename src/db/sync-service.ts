import { config } from "@/config/env";

export interface SyncOptions {
  live?: boolean;
  retry?: boolean;
  continuous?: boolean;
  heartbeat?: number;
  timeout?: number;
}

export class SyncService {
  private static instance: SyncService;
  private activeSyncs = new Map<string, PouchDB.Replication.Sync<object>>();

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async startSync(
    localDb: PouchDB.Database,
    remoteUrl: string,
    options: SyncOptions = {},
  ) {
    if (!config.enableSync) {
      return null;
    }

    const syncKey = `${localDb.name}-${remoteUrl}`;

    if (this.activeSyncs.has(syncKey)) {
      return this.activeSyncs.get(syncKey);
    }

    const defaultOptions: SyncOptions = {
      live: true,
      retry: true,
      continuous: true,
      heartbeat: 10000,
      timeout: 30000,
      ...options,
    };

    try {
      const sync = localDb.sync(
        new PouchDB(remoteUrl, {
          auth: {
            username: config.couchdbUsername,
            password: config.couchdbPassword,
          },
        }),
        defaultOptions,
      );
      this.activeSyncs.set(syncKey, sync);

      sync.on("error", (err) => {
        console.error(`Sync error for ${syncKey}:`, err);
        this.activeSyncs.delete(syncKey);
      });

      sync.on("denied", (err) => {
        console.error(`Sync denied for ${syncKey}:`, err);
      });

      return sync;
    } catch (error) {
      console.error(`Failed to start sync for ${syncKey}:`, error);
      return null;
    }
  }

  stopSync(localDb: PouchDB.Database, remoteUrl: string) {
    const syncKey = `${localDb.name}-${remoteUrl}`;
    const sync = this.activeSyncs.get(syncKey);

    if (sync) {
      sync.cancel();
      this.activeSyncs.delete(syncKey);
    }
  }

  stopAllSyncs() {
    for (const [, sync] of this.activeSyncs) {
      sync.cancel();
    }
    this.activeSyncs.clear();
  }

  getSyncStatus(localDb: PouchDB.Database, remoteUrl: string) {
    const syncKey = `${localDb.name}-${remoteUrl}`;
    return this.activeSyncs.has(syncKey);
  }
}

export const syncService = SyncService.getInstance();
