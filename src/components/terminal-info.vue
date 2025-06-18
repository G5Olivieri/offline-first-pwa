<template>
  <div class="terminal-info bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Terminal Information
      </h3>
      <span
        class="px-2 py-1 text-xs font-medium rounded-full"
        :class="statusClasses"
      >
        {{ terminalStatus.toUpperCase() }}
      </span>
    </div>

    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Terminal ID
          </label>
          <p class="text-sm font-mono bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
            {{ terminalId }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Terminal Name
          </label>
          <input
            v-model="editableName"
            @blur="updateName"
            @keyup.enter="updateName"
            class="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Location
        </label>
        <input
          v-model="editableLocation"
          @blur="updateLocation"
          @keyup.enter="updateLocation"
          placeholder="Enter terminal location (optional)"
          class="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-400">
        <p><strong>Platform:</strong> {{ terminalInfo.deviceInfo.platform }}</p>
        <p><strong>Language:</strong> {{ terminalInfo.deviceInfo.language }}</p>
        <p><strong>Timezone:</strong> {{ terminalInfo.deviceInfo.timezone }}</p>
        <p><strong>Last Active:</strong> {{ formatLastActive }}</p>
      </div>
    </div>

    <div class="mt-4 flex space-x-2">
      <button
        @click="copyTerminalId"
        class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Copy ID
      </button>
      <button
        @click="resetTerminal"
        class="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        Reset Terminal
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTerminalStore } from '../stores/terminal-store';
import { formatDate } from '../config/env';

const terminalStore = useTerminalStore();

const editableName = ref(terminalStore.terminalName);
const editableLocation = ref(terminalStore.terminalLocation || '');

const terminalId = computed(() => terminalStore.terminalId);
const terminalStatus = computed(() => terminalStore.terminalStatus);
const terminalInfo = computed(() => terminalStore.terminalInfo);

const statusClasses = computed(() => {
  switch (terminalStatus.value) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    case 'maintenance':
      return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  }
});

const formatLastActive = computed(() => {
  return formatDate(new Date(terminalInfo.value.lastActiveAt));
});

const updateName = () => {
  if (editableName.value.trim() !== terminalStore.terminalName) {
    terminalStore.updateTerminalName(editableName.value.trim());
  }
};

const updateLocation = () => {
  const newLocation = editableLocation.value.trim();
  if (newLocation !== terminalStore.terminalLocation) {
    terminalStore.updateTerminalLocation(newLocation);
  }
};

const copyTerminalId = async () => {
  try {
    await navigator.clipboard.writeText(terminalId.value);
    // You could add a toast notification here
    console.log('Terminal ID copied to clipboard');
  } catch (error) {
    console.error('Failed to copy terminal ID:', error);
  }
};

const resetTerminal = () => {
  if (confirm('Are you sure you want to reset the terminal? This will generate a new terminal ID and reload the page.')) {
    terminalStore.resetTerminalId();
  }
};
</script>
