import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { syncManager } from '@/services/sync-manager';
import { syncService } from '@/services/sync-service';
import { SYNCING } from '@/db';

export interface SyncStatus {
  database: string;
  isActive: boolean;
  lastSyncTime?: string;
  error?: string;
}

export const useSyncStatusStore = defineStore('syncStatus', () => {
  const syncStatuses = ref<Record<string, SyncStatus>>({});
  const lastGlobalSyncTime = ref<string>('');
  const syncErrors = ref<string[]>([]);

  // Database names that should be monitored
  const monitoredDatabases = [
    'products',
    'customers',
    'operators',
    'orders-push',
    'product-affinity',
    'customer-preferences',
    'recommendation-config'
  ];

  const initializeSyncStatuses = () => {
    monitoredDatabases.forEach(dbName => {
      syncStatuses.value[dbName] = {
        database: dbName,
        isActive: false,
        lastSyncTime: undefined,
        error: undefined
      };
    });
  };

  const updateSyncStatus = (database: string, isActive: boolean, error?: string) => {
    if (syncStatuses.value[database]) {
      syncStatuses.value[database].isActive = isActive;
      syncStatuses.value[database].error = error;

      if (isActive && !error) {
        syncStatuses.value[database].lastSyncTime = new Date().toISOString();
        lastGlobalSyncTime.value = new Date().toISOString();
      }
    }
  };

  const addSyncError = (database: string, error: string) => {
    const errorMessage = `[${database}] ${error}`;
    syncErrors.value.unshift(errorMessage);

    // Keep only last 50 errors
    if (syncErrors.value.length > 50) {
      syncErrors.value = syncErrors.value.slice(0, 50);
    }

    updateSyncStatus(database, false, error);
  };

  const clearSyncError = (database: string) => {
    if (syncStatuses.value[database]) {
      syncStatuses.value[database].error = undefined;
    }
  };

  const clearAllSyncErrors = () => {
    syncErrors.value = [];
    Object.keys(syncStatuses.value).forEach(database => {
      clearSyncError(database);
    });
  };

  // Computed properties for UI
  const isSyncEnabled = computed(() => SYNCING);

  const isAnySyncActive = computed(() =>
    Object.values(syncStatuses.value).some(status => status.isActive)
  );

  const hasAnySyncError = computed(() =>
    Object.values(syncStatuses.value).some(status => status.error)
  );

  const activeSyncs = computed(() =>
    Object.values(syncStatuses.value).filter(status => status.isActive)
  );

  const failedSyncs = computed(() =>
    Object.values(syncStatuses.value).filter(status => status.error)
  );

  const overallSyncHealth = computed(() => {
    if (!isSyncEnabled.value) return 'disabled';
    if (hasAnySyncError.value) return 'error';
    if (isAnySyncActive.value) return 'syncing';
    return 'idle';
  });

  const getSyncStatusSummary = computed(() => {
    const total = Object.keys(syncStatuses.value).length;
    const active = activeSyncs.value.length;
    const failed = failedSyncs.value.length;
    const idle = total - active - failed;

    return {
      total,
      active,
      failed,
      idle,
      health: overallSyncHealth.value
    };
  });

  // Periodically refresh sync statuses from sync manager
  const refreshSyncStatuses = () => {
    const allStatuses = syncManager.getAllSyncStatuses();

    Object.keys(allStatuses).forEach(dbName => {
      const isActive = allStatuses[dbName];
      updateSyncStatus(dbName, isActive);
    });
  };

  // Manual sync operations
  const triggerManualSync = async (database: string) => {
    if (!syncService.isSyncEnabled()) {
      throw new Error('Synchronization is disabled');
    }

    updateSyncStatus(database, true);

    try {
      await syncService.syncDatabase(database);
      updateSyncStatus(database, false);
    } catch (error) {
      addSyncError(database, error instanceof Error ? error.message : String(error));
    }
  };

  const triggerFullResync = async () => {
    if (!syncService.isSyncEnabled()) {
      throw new Error('Synchronization is disabled');
    }

    try {
      await syncService.syncAllDatabases();
    } catch (error) {
      console.error('Full resync failed:', error);
      throw error;
    }
  };

  // Utility functions
  const formatLastSyncTime = (database: string): string => {
    const status = syncStatuses.value[database];
    if (!status?.lastSyncTime) return 'Never';

    const lastSync = new Date(status.lastSyncTime);
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getSyncStatusIcon = (database: string): string => {
    const status = syncStatuses.value[database];
    if (!status) return '❓';
    if (status.error) return '❌';
    if (status.isActive) return '🔄';
    return '✅';
  };

  const getSyncStatusColor = (database: string): string => {
    const status = syncStatuses.value[database];
    if (!status) return 'gray';
    if (status.error) return 'red';
    if (status.isActive) return 'blue';
    return 'green';
  };

  // Initialize on store creation
  initializeSyncStatuses();

  // Set up periodic refresh (every 30 seconds)
  if (typeof window !== 'undefined') {
    setInterval(refreshSyncStatuses, 30000);
  }

  return {
    // State
    syncStatuses,
    lastGlobalSyncTime,
    syncErrors,

    // Computed
    isSyncEnabled,
    isAnySyncActive,
    hasAnySyncError,
    activeSyncs,
    failedSyncs,
    overallSyncHealth,
    getSyncStatusSummary,

    // Actions
    updateSyncStatus,
    addSyncError,
    clearSyncError,
    clearAllSyncErrors,
    refreshSyncStatuses,
    triggerManualSync,
    triggerFullResync,

    // Utilities
    formatLastSyncTime,
    getSyncStatusIcon,
    getSyncStatusColor,
  };
});
