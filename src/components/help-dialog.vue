<template>
  <Teleport to="body">
    <Transition
      name="modal"
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click="emit('close')"
      >
        <Transition
          name="modal-content"
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-200 ease-in"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="show"
            class="help-dialog bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl mx-4 max-w-4xl w-full max-h-[90vh] overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="gradient-header px-6 py-4 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold">Keyboard Shortcuts & Help</h2>
                    <p class="text-blue-100 text-sm">Quick reference guide</p>
                  </div>
                </div>
                <button
                  @click="emit('close')"
                  class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="overflow-y-auto max-h-[calc(90vh-5rem)]">
              <div class="p-6">
                <!-- Quick Actions -->
                <div class="mb-8">
                  <h3
                    class="text-lg font-semibold text-gray-900 mb-4 flex items-center"
                  >
                    <div
                      class="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2"
                    >
                      <svg
                        class="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    Quick Actions
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      v-for="shortcut in functionKeyShortcuts"
                      :key="shortcut.key"
                      class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span class="text-gray-700">{{
                        shortcut.description
                      }}</span>
                      <kbd
                        class="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono shadow-sm"
                      >
                        {{ shortcut.key }}
                      </kbd>
                    </div>
                  </div>
                </div>

                <!-- Navigation -->
                <div class="mb-8">
                  <h3
                    class="text-lg font-semibold text-gray-900 mb-4 flex items-center"
                  >
                    <div
                      class="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2"
                    >
                      <svg
                        class="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                    Navigation
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      v-for="shortcut in navigationShortcuts"
                      :key="shortcut.key"
                      class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span class="text-gray-700">{{
                        shortcut.description
                      }}</span>
                      <kbd
                        class="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono shadow-sm"
                      >
                        {{ getShortcutDisplay(shortcut) }}
                      </kbd>
                    </div>
                  </div>
                </div>

                <!-- Tips & Tricks -->
                <div class="mb-8">
                  <h3
                    class="text-lg font-semibold text-gray-900 mb-4 flex items-center"
                  >
                    <div
                      class="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center mr-2"
                    >
                      <svg
                        class="w-4 h-4 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    Tips & Tricks
                  </h3>
                  <div class="space-y-3">
                    <div
                      class="p-4 bg-indigo-50 border border-indigo-200 rounded-lg"
                    >
                      <h4
                        class="font-medium text-indigo-900 mb-2 flex items-center"
                      >
                        <svg
                          class="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Dialog Controls
                      </h4>
                      <p class="text-indigo-700 text-sm">
                        Press
                        <kbd
                          class="px-1 py-0.5 bg-white border border-indigo-300 rounded text-xs font-mono"
                          >Esc</kbd
                        >
                        to close this help dialog quickly, or click outside the
                        dialog area.
                      </p>
                    </div>
                    <div
                      class="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <h4 class="font-medium text-blue-900 mb-2">
                        Barcode Scanning
                      </h4>
                      <p class="text-blue-700 text-sm">
                        Use a barcode scanner or type product codes manually.
                        The system automatically focuses the barcode input when
                        you start typing.
                      </p>
                    </div>
                    <div
                      class="p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <h4 class="font-medium text-green-900 mb-2">
                        Order Management
                      </h4>
                      <p class="text-green-700 text-sm">
                        You can modify quantities by clicking on items in the
                        order. Use F6 to quickly complete orders and F7 to
                        abandon them.
                      </p>
                    </div>
                    <div
                      class="p-4 bg-purple-50 border border-purple-200 rounded-lg"
                    >
                      <h4 class="font-medium text-purple-900 mb-2">
                        Customer & Operator
                      </h4>
                      <p class="text-purple-700 text-sm">
                        Always select an operator before starting sales.
                        Customers are optional but help with receipts and
                        loyalty programs.
                      </p>
                    </div>
                    <div
                      class="p-4 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <h4 class="font-medium text-orange-900 mb-2">
                        Offline Mode
                      </h4>
                      <p class="text-orange-700 text-sm">
                        The system works offline and syncs when connection is
                        restored. Check the status indicator in the header.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Contact & Support -->
                <div>
                  <h3
                    class="text-lg font-semibold text-gray-900 mb-4 flex items-center"
                  >
                    <div
                      class="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mr-2"
                    >
                      <svg
                        class="w-4 h-4 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    Support & Information
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      class="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <h4 class="font-medium text-gray-900 mb-2">
                        Application Version
                      </h4>
                      <p class="text-gray-600 text-sm">{{ appVersion }}</p>
                    </div>
                    <div
                      class="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <h4 class="font-medium text-gray-900 mb-2">
                        Environment
                      </h4>
                      <p class="text-gray-600 text-sm">{{ environment }}</p>
                    </div>
                    <div
                      class="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <h4 class="font-medium text-gray-900 mb-2">
                        Terminal ID
                      </h4>
                      <p class="text-gray-600 text-xs font-mono">
                        {{ terminalStore.terminalId }}
                      </p>
                    </div>
                    <div
                      class="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <h4 class="font-medium text-gray-900 mb-2">
                        Connection Status
                      </h4>
                      <div class="flex items-center space-x-2">
                        <div
                          class="w-2 h-2 rounded-full status-indicator"
                          :class="isOnline ? 'bg-green-500' : 'bg-red-500'"
                        ></div>
                        <span class="text-gray-600 text-sm">{{
                          isOnline ? "Online" : "Offline"
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Database Status Section -->
                  <div class="mt-6">
                    <h4 class="font-medium text-gray-900 mb-4">
                      Database Sync Status
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        v-for="db in databaseStatus"
                        :key="db.name"
                        class="database-status-card p-3 border border-gray-200 rounded-lg bg-white"
                      >
                        <div class="flex items-center justify-between mb-2">
                          <h5 class="font-medium text-gray-900 text-sm">
                            {{ db.name }}
                          </h5>
                          <div class="flex items-center space-x-2">
                            <div
                              class="w-2 h-2 rounded-full status-indicator"
                              :class="db.syncStatus.color"
                            ></div>
                            <span
                              class="text-xs"
                              :class="db.syncStatus.textColor"
                              >{{ db.syncStatus.text }}</span
                            >
                          </div>
                        </div>
                        <p class="text-xs text-gray-600">{{ db.status }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <p class="text-sm text-gray-500">
                  Press
                  <kbd
                    class="px-2 py-1 bg-white border rounded text-xs font-mono shadow-sm"
                    >Shift + ?</kbd
                  >
                  to open this help dialog anytime
                </p>
                <button
                  @click="emit('close')"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useOnlineStatusStore } from "@/stores/online-status-store";
import { useTerminalStore } from "@/stores/terminal-store";
import { config as envConfig } from "@/config/env";
import type { KeyboardShortcut } from "@/composables/use-keyboard-shortcuts";

interface DatabaseInfo {
  name: string;
  status: string;
  syncStatus: {
    text: string;
    color: string;
    textColor: string;
  };
}

interface Props {
  show: boolean;
  shortcuts?: KeyboardShortcut[];
}

const props = withDefaults(defineProps<Props>(), {
  shortcuts: () => [],
});

const emit = defineEmits<{
  close: [];
}>();

const onlineStore = useOnlineStatusStore();
const terminalStore = useTerminalStore();

// Keyboard event handler for Escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.show) {
    emit("close");
  }
};

// Add/remove event listeners when component mounts/unmounts
onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});

const isOnline = computed(() => onlineStore.isOnline);
const appVersion = computed(() => envConfig.appVersion);
const environment = computed(() => envConfig.environment);

const functionKeyShortcuts = computed(() =>
  props.shortcuts.filter((s) => s.key.startsWith("F")),
);

const navigationShortcuts = computed(() =>
  props.shortcuts.filter((s) => !s.key.startsWith("F")),
);

// Database status helper
const getSyncStatus = (dbName: string) => {
  const isOnline = onlineStore.isOnline;
  const isSyncEnabled = onlineStore.isSyncEnabled;

  if (!isOnline) {
    return {
      text: "Offline",
      color: "bg-yellow-400",
      textColor: "text-yellow-700",
    };
  }

  if (!isSyncEnabled) {
    return {
      text: "Disabled",
      color: "bg-gray-400",
      textColor: "text-gray-700",
    };
  }

  // Special case for orders - they use one-way sync (push only)
  if (dbName === "orders") {
    return {
      text: "Push Only",
      color: "bg-blue-400",
      textColor: "text-blue-700",
    };
  }

  return {
    text: "Ready",
    color: "bg-green-400",
    textColor: "text-green-700",
  };
};

const databaseStatus = computed<DatabaseInfo[]>(() => {
  return [
    {
      name: "Products",
      status: "Two-way sync enabled",
      syncStatus: getSyncStatus("products"),
    },
    {
      name: "Orders",
      status: "Push all, keep pending only",
      syncStatus: getSyncStatus("orders"),
    },
    {
      name: "Customers",
      status: "Two-way sync enabled",
      syncStatus: getSyncStatus("customers"),
    },
    {
      name: "Operators",
      status: "Two-way sync enabled",
      syncStatus: getSyncStatus("operators"),
    },
  ];
});

const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");
  if (shortcut.meta) parts.push("Cmd");

  parts.push(shortcut.key.toUpperCase());

  return parts.join(" + ");
};
</script>

<style scoped>
/* Modal backdrop transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  backdrop-filter: blur(4px);
}

/* Modal content transitions */
.modal-content-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-content-leave-active {
  transition: all 0.2s ease-in;
}

.modal-content-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.modal-content-enter-to,
.modal-content-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Enhanced hover effects */
.help-dialog button {
  transition: all 0.2s ease;
}

.help-dialog button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Keyboard shortcut styling */
.help-dialog kbd {
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.help-dialog kbd:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* Database status cards animations */
.help-dialog .database-status-card {
  transition: all 0.2s ease;
}

.help-dialog .database-status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Header gradient animation */
.help-dialog .gradient-header {
  background: linear-gradient(45deg, #3b82f6, #6366f1, #8b5cf6);
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Status indicator pulse animation */
.status-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
