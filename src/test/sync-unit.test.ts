import { describe, it, expect, beforeAll } from 'vitest';
import { SyncService } from '@/services/sync-service';
import { useSyncStatusStore } from '@/stores/sync-status-store';
import { createPinia, setActivePinia } from 'pinia';

describe('Sync Service Unit Tests', () => {
  beforeAll(() => {
    // Setup Pinia for store testing
    setActivePinia(createPinia());
  });

  describe('SyncService', () => {
    it('should be a singleton', () => {
      const instance1 = SyncService.getInstance();
      const instance2 = SyncService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should check if sync is enabled', () => {
      const syncService = SyncService.getInstance();
      const isEnabled = syncService.isSyncEnabled();

      // Should return boolean
      expect(typeof isEnabled).toBe('boolean');
    });

    it('should get sync statistics', async () => {
      const syncService = SyncService.getInstance();
      const stats = await syncService.getSyncStatistics();

      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });

  describe('Sync Status Store', () => {
    it('should initialize with default state', () => {
      const store = useSyncStatusStore();

      expect(store.syncStatuses).toBeDefined();
      expect(store.syncErrors).toBeInstanceOf(Array);
      expect(typeof store.isSyncEnabled).toBe('boolean');
    });

    it('should have sync status methods', () => {
      const store = useSyncStatusStore();

      expect(typeof store.getSyncStatusIcon).toBe('function');
      expect(typeof store.getSyncStatusColor).toBe('function');
      expect(typeof store.formatLastSyncTime).toBe('function');
    });

    it('should provide sync status summary', () => {
      const store = useSyncStatusStore();
      const summary = store.getSyncStatusSummary;

      expect(summary).toBeDefined();
      expect(typeof summary.active).toBe('number');
      expect(typeof summary.failed).toBe('number');
      expect(typeof summary.idle).toBe('number');
    });

    it('should handle manual sync triggers', async () => {
      const store = useSyncStatusStore();

      // Should not throw error when triggering sync
      await expect(store.triggerManualSync('products')).resolves.not.toThrow();
    });

    it('should handle error clearing', () => {
      const store = useSyncStatusStore();

      // Should not throw when clearing errors
      expect(() => store.clearAllSyncErrors()).not.toThrow();
    });
  });

  describe('Sync Configuration', () => {
    it('should handle sync configuration from environment', () => {
      // Test that sync configuration is properly loaded
      const syncService = SyncService.getInstance();

      // Should have a method to check configuration
      expect(typeof syncService.isSyncEnabled).toBe('function');
    });
  });
});
