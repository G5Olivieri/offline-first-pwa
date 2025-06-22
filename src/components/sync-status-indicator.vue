<template>
  <div class="sync-status-indicator">
    <!-- Compact status indicator -->
    <div
      v-if="!showDetailed"
      class="flex items-center space-x-2 px-3 py-1 rounded-md text-sm"
      :class="statusClasses"
      @click="showDetailed = true"
    >
      <span class="sync-icon">{{ statusIcon }}</span>
      <span>{{ statusText }}</span>
      <span v-if="syncStore.isAnySyncActive" class="animate-spin">⟳</span>
    </div>

    <!-- Detailed sync status modal -->
    <div v-if="showDetailed" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Sync Status</h3>
          <button @click="showDetailed = false" class="text-gray-500 hover:text-gray-700">
            <span class="sr-only">Close</span>
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Overall status -->
        <div class="mb-4 p-3 rounded-md" :class="overallStatusClasses">
          <div class="flex items-center justify-between">
            <span class="font-medium">Overall Status</span>
            <span class="text-sm" :class="statusTextClasses">{{ overallStatusText }}</span>
          </div>
          <div class="text-sm mt-1 text-gray-600">
            {{ syncStore.getSyncStatusSummary.active }} active,
            {{ syncStore.getSyncStatusSummary.failed }} failed,
            {{ syncStore.getSyncStatusSummary.idle }} idle
          </div>
        </div>

        <!-- Individual database statuses -->
        <div class="space-y-2 mb-4">
          <h4 class="font-medium text-sm text-gray-700">Database Sync Status</h4>
          <div
            v-for="(status, database) in syncStore.syncStatuses"
            :key="database"
            class="flex items-center justify-between p-2 bg-gray-50 rounded-md"
          >
            <div class="flex items-center space-x-2">
              <span :style="{ color: syncStore.getSyncStatusColor(database) }">
                {{ syncStore.getSyncStatusIcon(database) }}
              </span>
              <span class="text-sm font-medium">{{ formatDatabaseName(database) }}</span>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500">
                {{ syncStore.formatLastSyncTime(database) }}
              </div>
              <div v-if="status.error" class="text-xs text-red-500 truncate max-w-32" :title="status.error">
                {{ status.error }}
              </div>
            </div>
          </div>
        </div>

        <!-- Recent errors -->
        <div v-if="syncStore.syncErrors.length > 0" class="mb-4">
          <h4 class="font-medium text-sm text-gray-700 mb-2">Recent Sync Errors</h4>
          <div class="bg-red-50 rounded-md p-3 max-h-32 overflow-y-auto">
            <div
              v-for="(error, index) in syncStore.syncErrors.slice(0, 5)"
              :key="index"
              class="text-xs text-red-700 mb-1"
            >
              {{ error }}
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex space-x-2">
          <button
            @click="triggerManualSync"
            :disabled="isTriggering"
            class="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            <span v-if="!isTriggering">Sync All</span>
            <span v-else class="flex items-center justify-center">
              <span class="animate-spin mr-2">⟳</span>
              Syncing...
            </span>
          </button>
          <button
            @click="clearErrors"
            v-if="syncStore.syncErrors.length > 0"
            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Clear Errors
          </button>
        </div>

        <!-- Last global sync time -->
        <div v-if="syncStore.lastGlobalSyncTime" class="mt-4 text-center text-xs text-gray-500">
          Last sync: {{ formatTimestamp(syncStore.lastGlobalSyncTime) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSyncStatusStore } from '@/stores/sync-status-store';

const syncStore = useSyncStatusStore();
const showDetailed = ref(false);
const isTriggering = ref(false);

// Computed properties for status display
const statusIcon = computed(() => {
  if (!syncStore.isSyncEnabled) return '🔌';
  switch (syncStore.overallSyncHealth) {
    case 'disabled': return '🔌';
    case 'error': return '❌';
    case 'syncing': return '🔄';
    case 'idle': return '✅';
    default: return '❓';
  }
});

const statusText = computed(() => {
  if (!syncStore.isSyncEnabled) return 'Sync Disabled';
  switch (syncStore.overallSyncHealth) {
    case 'disabled': return 'Sync Disabled';
    case 'error': return 'Sync Error';
    case 'syncing': return 'Syncing';
    case 'idle': return 'Synced';
    default: return 'Unknown';
  }
});

const statusClasses = computed(() => ({
  'bg-gray-100 text-gray-700': !syncStore.isSyncEnabled,
  'bg-red-100 text-red-700': syncStore.overallSyncHealth === 'error',
  'bg-blue-100 text-blue-700': syncStore.overallSyncHealth === 'syncing',
  'bg-green-100 text-green-700': syncStore.overallSyncHealth === 'idle',
  'cursor-pointer hover:bg-opacity-80': true
}));

const overallStatusText = computed(() => {
  if (!syncStore.isSyncEnabled) return 'Synchronization is disabled';
  switch (syncStore.overallSyncHealth) {
    case 'error': return 'Some databases have sync errors';
    case 'syncing': return 'Synchronization in progress';
    case 'idle': return 'All databases are synchronized';
    default: return 'Unknown synchronization state';
  }
});

const overallStatusClasses = computed(() => ({
  'bg-gray-50': !syncStore.isSyncEnabled,
  'bg-red-50': syncStore.overallSyncHealth === 'error',
  'bg-blue-50': syncStore.overallSyncHealth === 'syncing',
  'bg-green-50': syncStore.overallSyncHealth === 'idle'
}));

const statusTextClasses = computed(() => ({
  'text-gray-600': !syncStore.isSyncEnabled,
  'text-red-600': syncStore.overallSyncHealth === 'error',
  'text-blue-600': syncStore.overallSyncHealth === 'syncing',
  'text-green-600': syncStore.overallSyncHealth === 'idle'
}));

// Helper functions
const formatDatabaseName = (database: string): string => {
  return database
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

const triggerManualSync = async () => {
  isTriggering.value = true;
  try {
    await syncStore.triggerFullResync();
  } finally {
    isTriggering.value = false;
  }
};

const clearErrors = () => {
  syncStore.clearAllSyncErrors();
};

// Auto-refresh sync statuses
if (typeof window !== 'undefined') {
  setInterval(() => {
    syncStore.refreshSyncStatuses();
  }, 10000); // Refresh every 10 seconds
}
</script>

<style scoped>
.sync-status-indicator {
  /* Component-specific styles */
}

.sync-icon {
  display: inline-block;
  font-size: 1rem;
}

/* Animation for spinning sync icon */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
