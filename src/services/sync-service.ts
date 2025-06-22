import {
  getProductDB,
  getOrderDB,
  getCustomerDB,
  getOperatorDB,
  getProductAffinityDB,
  getCustomerPreferencesDB,
  getRecommendationConfigDB,
  SYNCING
} from '@/db';
import { syncManager, type BaseDocument } from './sync-manager';
import { config } from '@/config/env';
import PouchDB from 'pouchdb-browser';

export interface DatabaseInstance {
  name: string;
  localDB: PouchDB.Database<Record<string, unknown>>;
  remoteDB: PouchDB.Database<Record<string, unknown>>;
}

export interface SyncStatistics {
  localDocCount: number;
  localUpdateSeq: string | number;
  lastSync: string | null;
  error?: string;
}

export class SyncService {
  private static instance: SyncService;
  private databases: DatabaseInstance[] = [];

  private constructor() {
    this.initializeDatabases();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private initializeDatabases(): void {
    if (!SYNCING) return;

    const COUCHDB_URL = config.couchdbUrl;
    const auth = {
      username: config.couchdbUsername,
      password: config.couchdbPassword,
    };

    this.databases = [
      {
        name: 'products',
        localDB: getProductDB(),
        remoteDB: new PouchDB(`${COUCHDB_URL}/products`, { auth })
      },
      {
        name: 'customers',
        localDB: getCustomerDB(),
        remoteDB: new PouchDB(`${COUCHDB_URL}/customers`, { auth })
      },
      {
        name: 'operators',
        localDB: getOperatorDB(),
        remoteDB: new PouchDB(`${COUCHDB_URL}/operators`, { auth })
      },
      {
        name: 'orders',
        localDB: getOrderDB(),
        remoteDB: new PouchDB(`${COUCHDB_URL}/orders`, { auth })
      },
      {
        name: 'product-affinity',
        localDB: getProductAffinityDB(),
        remoteDB: new PouchDB(`${COUCHDB_URL}/product-affinity`, { auth })
      },
      {
        name: 'customer-preferences',
        localDB: getCustomerPreferencesDB(),
        remoteDB: new PouchDB(`${COUCHDB_URL}/customer-preferences`, { auth })
      },
      {
        name: 'recommendation-config',
        localDB: getRecommendationConfigDB(),
        remoteDB: new PouchDB(`${COUCHDB_URL}/recommendation-config`, { auth })
      }
    ];
  }

  /**
   * Trigger manual sync for a specific database
   */
  async syncDatabase(databaseName: string): Promise<void> {
    if (!SYNCING) {
      throw new Error('Synchronization is disabled');
    }

    const dbInstance = this.databases.find(db => db.name === databaseName);
    if (!dbInstance) {
      throw new Error(`Database ${databaseName} not found`);
    }

    try {
      if (databaseName === 'orders') {
        // Orders are unidirectional (local to remote only)
        await (dbInstance.localDB as PouchDB.Database<BaseDocument>).replicate.to(
          dbInstance.remoteDB as PouchDB.Database<BaseDocument>,
          {
            filter: (doc: Record<string, unknown>) => (doc as { status?: string }).status === 'completed'
          }
        );
      } else {
        // Bidirectional sync for other databases
        await syncManager.triggerManualSync(
          dbInstance.localDB as PouchDB.Database<BaseDocument>,
          dbInstance.remoteDB as PouchDB.Database<BaseDocument>,
          databaseName
        );
      }
    } catch (error) {
      console.error(`Failed to sync ${databaseName}:`, error);
      throw error;
    }
  }

  /**
   * Trigger manual sync for all databases
   */
  async syncAllDatabases(): Promise<void> {
    if (!SYNCING) {
      throw new Error('Synchronization is disabled');
    }

    const syncPromises = this.databases.map(async (dbInstance) => {
      try {
        await this.syncDatabase(dbInstance.name);
        return { database: dbInstance.name, success: true, error: null };
      } catch (error) {
        console.error(`Failed to sync ${dbInstance.name}:`, error);
        return {
          database: dbInstance.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });

    const results = await Promise.allSettled(syncPromises);

    // Check if any syncs failed
    const failedSyncs = results
      .map(result => result.status === 'fulfilled' ? result.value : null)
      .filter(result => result && !result.success);

    if (failedSyncs.length > 0) {
      const errorMessage = `Failed to sync: ${failedSyncs.map(f => f!.database).join(', ')}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Check connection to remote CouchDB
   */
  async checkRemoteConnection(): Promise<boolean> {
    if (!SYNCING) return false;

    try {
      const COUCHDB_URL = config.couchdbUrl;
      const auth = {
        username: config.couchdbUsername,
        password: config.couchdbPassword,
      };

      // Try to connect to a test database or server info
      const testDB = new PouchDB(`${COUCHDB_URL}/_users`, { auth });
      await testDB.info();

      return true;
    } catch (error) {
      console.error('Remote connection check failed:', error);
      return false;
    }
  }

  /**
   * Get sync statistics for all databases
   */
  async getSyncStatistics(): Promise<Record<string, SyncStatistics>> {
    const stats: Record<string, SyncStatistics> = {};

    for (const dbInstance of this.databases) {
      try {
        const localInfo = await dbInstance.localDB.info();
        stats[dbInstance.name] = {
          localDocCount: localInfo.doc_count,
          localUpdateSeq: localInfo.update_seq,
          lastSync: null // This would need to be tracked separately
        };
      } catch (error) {
        stats[dbInstance.name] = {
          localDocCount: 0,
          localUpdateSeq: 0,
          lastSync: null,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    return stats;
  }

  /**
   * Force a complete resync by destroying local databases and re-syncing
   * WARNING: This will delete all local data!
   */
  async forceCompleteResync(): Promise<void> {
    if (!SYNCING) {
      throw new Error('Synchronization is disabled');
    }

    const confirmation = confirm(
      'This will delete all local data and re-sync from remote. Are you sure?'
    );

    if (!confirmation) {
      throw new Error('Resync cancelled by user');
    }

    try {
      // Destroy all local databases
      for (const dbInstance of this.databases) {
        await dbInstance.localDB.destroy();
      }

      // Reinitialize databases (they will auto-sync from remote)
      this.initializeDatabases();

      console.log('Complete resync initiated');
    } catch (error) {
      console.error('Failed to perform complete resync:', error);
      throw error;
    }
  }

  /**
   * Get list of available databases
   */
  getDatabaseNames(): string[] {
    return this.databases.map(db => db.name);
  }

  /**
   * Check if sync is enabled
   */
  isSyncEnabled(): boolean {
    return SYNCING;
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();
