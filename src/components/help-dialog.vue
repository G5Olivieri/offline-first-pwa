<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click="$emit('close')"
    >
      <div
        class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl mx-4 max-w-4xl w-full max-h-[90vh] overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold">Keyboard Shortcuts & Help</h2>
                <p class="text-blue-100 text-sm">Quick reference guide</p>
              </div>
            </div>
            <button
              @click="$emit('close')"
              class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div class="p-6">
            <!-- Quick Actions -->
            <div class="mb-8">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div class="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
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
                  <span class="text-gray-700">{{ shortcut.description }}</span>
                  <kbd class="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono shadow-sm">
                    {{ shortcut.key }}
                  </kbd>
                </div>
              </div>
            </div>

            <!-- Navigation -->
            <div class="mb-8">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div class="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                  <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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
                  <span class="text-gray-700">{{ shortcut.description }}</span>
                  <kbd class="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono shadow-sm">
                    {{ getShortcutDisplay(shortcut) }}
                  </kbd>
                </div>
              </div>
            </div>

            <!-- Tips & Tricks -->
            <div class="mb-8">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div class="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center mr-2">
                  <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                Tips & Tricks
              </h3>
              <div class="space-y-3">
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 class="font-medium text-blue-900 mb-2">Barcode Scanning</h4>
                  <p class="text-blue-700 text-sm">Use a barcode scanner or type product codes manually. The system automatically focuses the barcode input when you start typing.</p>
                </div>
                <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 class="font-medium text-green-900 mb-2">Order Management</h4>
                  <p class="text-green-700 text-sm">You can modify quantities by clicking on items in the order. Use F6 to quickly complete orders and F7 to abandon them.</p>
                </div>
                <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 class="font-medium text-purple-900 mb-2">Customer & Operator</h4>
                  <p class="text-purple-700 text-sm">Always select an operator before starting sales. Customers are optional but help with receipts and loyalty programs.</p>
                </div>
                <div class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 class="font-medium text-orange-900 mb-2">Offline Mode</h4>
                  <p class="text-orange-700 text-sm">The system works offline and syncs when connection is restored. Check the status indicator in the header.</p>
                </div>
              </div>
            </div>

            <!-- Contact & Support -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div class="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                  <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Support & Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 class="font-medium text-gray-900 mb-2">Application Version</h4>
                  <p class="text-gray-600 text-sm">{{ appVersion }}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 class="font-medium text-gray-900 mb-2">Environment</h4>
                  <p class="text-gray-600 text-sm">{{ environment }}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 class="font-medium text-gray-900 mb-2">Database Status</h4>
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-2 h-2 rounded-full"
                      :class="isOnline ? 'bg-green-500' : 'bg-red-500'"
                    ></div>
                    <span class="text-gray-600 text-sm">{{ isOnline ? 'Connected' : 'Offline' }}</span>
                  </div>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 class="font-medium text-gray-900 mb-2">Last Updated</h4>
                  <p class="text-gray-600 text-sm">{{ new Date().toLocaleDateString() }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500">
              Press <kbd class="px-1 bg-white border rounded text-xs">Shift + ?</kbd> to open this help dialog anytime
            </p>
            <button
              @click="$emit('close')"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOnlineStatusStore } from '../stores/online-status-store'
import { config as envConfig } from '../config/env'
import type { KeyboardShortcut } from '../composables/use-keyboard-shortcuts'

interface Props {
  show: boolean
  shortcuts?: KeyboardShortcut[]
}

const props = withDefaults(defineProps<Props>(), {
  shortcuts: () => []
})

const onlineStore = useOnlineStatusStore()

const isOnline = computed(() => onlineStore.isOnline)
const appVersion = computed(() => envConfig.appVersion)
const environment = computed(() => envConfig.environment)

const functionKeyShortcuts = computed(() =>
  props.shortcuts.filter(s => s.key.startsWith('F'))
)

const navigationShortcuts = computed(() =>
  props.shortcuts.filter(s => !s.key.startsWith('F'))
)

const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = []

  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.alt) parts.push('Alt')
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.meta) parts.push('Cmd')

  parts.push(shortcut.key.toUpperCase())

  return parts.join(' + ')
}
</script>
