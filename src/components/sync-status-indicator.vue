<template>
  <div class="sync-status-indicator">
    <!-- Compact status indicator -->
    <div
      v-if="!showDetailed"
      class="flex items-center space-x-2 px-3 py-1 rounded-md text-sm"
      :class="statusClasses"
      @click="openDialog"
    >
      <span class="sync-icon">{{ statusIcon }}</span>
      <span>{{ statusText }}</span>
      <span v-if="syncStore.isAnySyncActive" class="animate-spin">⟳</span>
    </div>

    <!-- Detailed sync status dialog -->
    <Teleport to="body">
      <Transition name="dialog" appear>
        <dialog
          v-if="showDetailed"
          ref="dialogElement"
          class="sync-status-dialog"
          @click="handleBackdropClick"
          @keydown.escape="closeDialog"
        >
          <div class="dialog-backdrop">
            <div class="dialog-content" @click.stop>
              <div class="dialog-header">
                <h3 class="dialog-title">Sync Status</h3>
                <button
                  @click="closeDialog"
                  class="dialog-close-button"
                  aria-label="Close dialog"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div class="dialog-body">
                <!-- Overall status -->
                <div class="status-section" :class="overallStatusClasses">
                  <div class="status-header">
                    <span class="status-title">Overall Status</span>
                    <span class="status-value" :class="statusTextClasses">{{ overallStatusText }}</span>
                  </div>
                  <div class="status-summary">
                    {{ syncStore.getSyncStatusSummary.active }} active,
                    {{ syncStore.getSyncStatusSummary.failed }} failed,
                    {{ syncStore.getSyncStatusSummary.idle }} idle
                  </div>
                </div>

                <!-- Individual database statuses -->
                <div class="database-statuses">
                  <h4 class="section-title">Database Sync Status</h4>
                  <div class="database-list">
                    <div
                      v-for="(status, database) in syncStore.syncStatuses"
                      :key="database"
                      class="database-item"
                    >
                      <div class="database-info">
                        <span
                          class="database-icon"
                          :style="{ color: syncStore.getSyncStatusColor(database) }"
                        >
                          {{ syncStore.getSyncStatusIcon(database) }}
                        </span>
                        <span class="database-name">{{ formatDatabaseName(database) }}</span>
                      </div>
                      <div class="database-status">
                        <div class="sync-time">
                          {{ syncStore.formatLastSyncTime(database) }}
                        </div>
                        <div v-if="status.error" class="sync-error" :title="status.error">
                          {{ status.error }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Recent errors -->
                <div v-if="syncStore.syncErrors.length > 0" class="error-section">
                  <h4 class="section-title">Recent Sync Errors</h4>
                  <div class="error-list">
                    <div
                      v-for="(error, index) in syncStore.syncErrors.slice(0, 5)"
                      :key="index"
                      class="error-item"
                    >
                      {{ error }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="dialog-footer">
                <!-- Action buttons -->
                <div class="action-buttons">
                  <button
                    @click="triggerManualSync"
                    :disabled="isTriggering"
                    class="sync-button"
                  >
                    <span v-if="!isTriggering">Sync All</span>
                    <span v-else class="syncing-indicator">
                      <span class="animate-spin mr-2">⟳</span>
                      Syncing...
                    </span>
                  </button>
                  <button
                    @click="clearErrors"
                    v-if="syncStore.syncErrors.length > 0"
                    class="clear-button"
                  >
                    Clear Errors
                  </button>
                </div>

                <!-- Last global sync time -->
                <div v-if="syncStore.lastGlobalSyncTime" class="last-sync-time">
                  Last sync: {{ formatTimestamp(syncStore.lastGlobalSyncTime) }}
                </div>
              </div>
            </div>
          </div>
        </dialog>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue';
import { useSyncStatusStore } from '@/stores/sync-status-store';

const syncStore = useSyncStatusStore();
const showDetailed = ref(false);
const isTriggering = ref(false);
const dialogElement = ref<HTMLDialogElement | null>(null);

// Dialog management
const openDialog = async () => {
  showDetailed.value = true;
  await nextTick();
  if (dialogElement.value) {
    dialogElement.value.showModal();
    document.body.style.overflow = 'hidden';
  }
};

const closeDialog = () => {
  if (dialogElement.value) {
    dialogElement.value.close();
    document.body.style.overflow = '';
  }
  showDetailed.value = false;
};

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === dialogElement.value) {
    closeDialog();
  }
};

// Keyboard handling
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showDetailed.value) {
    closeDialog();
  }
};

// Auto-focus management
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});

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

/* Dialog Styles */
.sync-status-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  padding: 0;
  z-index: 9999;
  overflow: hidden;
}

.sync-status-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.dialog-backdrop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.dialog-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 32rem;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.dialog-close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.dialog-close-button:hover {
  color: #374151;
  background: #f3f4f6;
}

.dialog-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.dialog-footer {
  padding: 0 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* Status Section Styles */
.status-section {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.status-title {
  font-weight: 500;
  color: #374151;
}

.status-value {
  font-size: 0.875rem;
}

.status-summary {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Database Statuses */
.database-statuses {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.database-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.database-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.database-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.database-icon {
  font-size: 1rem;
}

.database-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.database-status {
  text-align: right;
}

.sync-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.sync-error {
  font-size: 0.75rem;
  color: #dc2626;
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Error Section */
.error-section {
  margin-bottom: 1rem;
}

.error-list {
  background: #fef2f2;
  border-radius: 0.5rem;
  padding: 0.75rem;
  max-height: 8rem;
  overflow-y: auto;
}

.error-item {
  font-size: 0.75rem;
  color: #b91c1c;
  margin-bottom: 0.25rem;
}

.error-item:last-child {
  margin-bottom: 0;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.sync-button {
  flex: 1;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sync-button:hover:not(:disabled) {
  background: #2563eb;
}

.sync-button:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.clear-button {
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background: #4b5563;
}

.syncing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.last-sync-time {
  text-align: center;
  font-size: 0.75rem;
  color: #6b7280;
}

/* Dialog Transitions */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.95) translateY(-10px);
}

.dialog-enter-to .dialog-content,
.dialog-leave-from .dialog-content {
  transform: scale(1) translateY(0);
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

/* Responsive Design */
@media (max-width: 640px) {
  .dialog-content {
    margin: 0.5rem;
    max-width: calc(100% - 1rem);
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .database-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .database-status {
    text-align: left;
    width: 100%;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .dialog-enter-active,
  .dialog-leave-active {
    transition: none;
  }

  .animate-spin {
    animation: none;
  }
}
</style>
