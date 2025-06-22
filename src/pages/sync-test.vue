<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-8">🧪 Sync Testing Environment</h1>

      <!-- Sync Status Overview -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">📊 Sync Status</h2>
          <SyncStatusIndicator />
          <div class="mt-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span>Sync Enabled:</span>
              <span :class="syncStore.isSyncEnabled ? 'text-green-600' : 'text-red-600'">
                {{ syncStore.isSyncEnabled ? 'Yes' : 'No' }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span>Active Syncs:</span>
              <span class="text-blue-600">{{ syncStore.activeSyncs.length }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>Failed Syncs:</span>
              <span class="text-red-600">{{ syncStore.failedSyncs.length }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">⚡ Quick Actions</h2>
          <div class="space-y-3">
            <button
              @click="triggerFullSync"
              :disabled="isSyncing"
              class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium"
            >
              {{ isSyncing ? 'Syncing...' : 'Sync All Databases' }}
            </button>
            <button
              @click="clearAllErrors"
              class="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Clear All Errors
            </button>
            <button
              @click="generateTestData"
              class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Generate Test Data
            </button>
          </div>
        </div>

        <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">🎛️ Sync Controls</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Test Database:</label>
              <select v-model="selectedDatabase" class="w-full border rounded-lg px-3 py-2">
                <option value="">Select Database</option>
                <option v-for="db in availableDatabases" :key="db" :value="db">
                  {{ formatDatabaseName(db) }}
                </option>
              </select>
            </div>
            <button
              @click="triggerSingleSync"
              :disabled="!selectedDatabase || isSyncing"
              class="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg font-medium"
            >
              Sync Selected DB
            </button>
          </div>
        </div>
      </div>

      <!-- Database Details -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">💾 Database Statistics</h2>
          <div class="space-y-4">
            <div v-for="(stats, dbName) in databaseStats" :key="dbName" class="border-b pb-3 last:border-b-0">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-medium text-gray-700">{{ formatDatabaseName(dbName) }}</h3>
                <span :class="getSyncStatusColor(dbName)" class="text-sm font-medium">
                  {{ syncStore.getSyncStatusIcon(dbName) }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span class="block">Documents:</span>
                  <span class="font-mono">{{ stats.localDocCount || 0 }}</span>
                </div>
                <div>
                  <span class="block">Last Sync:</span>
                  <span class="font-mono text-xs">{{ syncStore.formatLastSyncTime(dbName) }}</span>
                </div>
              </div>
              <div v-if="stats.error" class="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                {{ stats.error }}
              </div>
            </div>
          </div>
          <button
            @click="refreshStats"
            :disabled="isRefreshing"
            class="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            {{ isRefreshing ? 'Refreshing...' : 'Refresh Stats' }}
          </button>
        </div>

        <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">🔍 Test Operations</h2>
          <div class="space-y-4">
            <!-- Add Product Test -->
            <div class="border rounded-lg p-4">
              <h3 class="font-medium text-gray-700 mb-3">Add Test Product</h3>
              <div class="grid grid-cols-2 gap-3">
                <input
                  v-model="testProduct.name"
                  placeholder="Product Name"
                  class="border rounded px-3 py-2 text-sm"
                >
                <input
                  v-model="testProduct.barcode"
                  placeholder="Barcode"
                  class="border rounded px-3 py-2 text-sm"
                >
                <input
                  v-model.number="testProduct.price"
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  class="border rounded px-3 py-2 text-sm"
                >
                <input
                  v-model.number="testProduct.stock"
                  placeholder="Stock"
                  type="number"
                  class="border rounded px-3 py-2 text-sm"
                >
              </div>
              <button
                @click="addTestProduct"
                class="w-full mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
              >
                Add Product
              </button>
            </div>

            <!-- Add Customer Test -->
            <div class="border rounded-lg p-4">
              <h3 class="font-medium text-gray-700 mb-3">Add Test Customer</h3>
              <div class="grid grid-cols-2 gap-3">
                <input
                  v-model="testCustomer.name"
                  placeholder="Customer Name"
                  class="border rounded px-3 py-2 text-sm"
                >
                <input
                  v-model="testCustomer.email"
                  placeholder="Email"
                  class="border rounded px-3 py-2 text-sm"
                >
                <input
                  v-model="testCustomer.phone"
                  placeholder="Phone"
                  class="border rounded px-3 py-2 text-sm"
                >
                <input
                  v-model="testCustomer.document"
                  placeholder="Document ID"
                  class="border rounded px-3 py-2 text-sm"
                >
              </div>
              <button
                @click="addTestCustomer"
                class="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium"
              >
                Add Customer
              </button>
            </div>

            <!-- Create Test Order -->
            <div class="border rounded-lg p-4">
              <h3 class="font-medium text-gray-700 mb-3">Create Test Order</h3>
              <button
                @click="createTestOrder"
                class="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-medium"
              >
                Create Random Order
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sync Logs -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-700">📝 Sync Events Log</h2>
          <button
            @click="clearLogs"
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            Clear Logs
          </button>
        </div>
        <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          <div v-if="syncLogs.length === 0" class="text-gray-500">
            No sync events yet. Trigger some sync operations to see logs here.
          </div>
          <div
            v-for="(log, index) in syncLogs"
            :key="index"
            class="mb-1"
            :class="{
              'text-red-400': log.type === 'error',
              'text-yellow-400': log.type === 'warning',
              'text-green-400': log.type === 'success',
              'text-blue-400': log.type === 'info'
            }"
          >
            <span class="text-gray-500">[{{ formatTimestamp(log.timestamp) }}]</span>
            <span class="text-gray-400">[{{ log.type.toUpperCase() }}]</span>
            {{ log.message }}
          </div>
        </div>
      </div>

      <!-- JSON Debug Panel -->
      <div class="mt-6 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">🔧 Debug Information</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h3 class="font-medium text-gray-600 mb-2">Sync Status Store State</h3>
            <pre class="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-64">{{ JSON.stringify(debugSyncState, null, 2) }}</pre>
          </div>
          <div>
            <h3 class="font-medium text-gray-600 mb-2">Database Statistics</h3>
            <pre class="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-64">{{ JSON.stringify(databaseStats, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useSyncStatusStore } from '@/stores/sync-status-store';
import { syncService, type SyncStatistics } from '@/services/sync-service';
import SyncStatusIndicator from '@/components/sync-status-indicator.vue';
import { getProductDB, getCustomerDB, getOrderDB } from '@/db';
import type { Product } from '@/product/product';
import type { Customer } from '@/customer/customer';
import type { Order } from '@/types/order';
import { OrderStatus } from '@/types/order';

const syncStore = useSyncStatusStore();
const selectedDatabase = ref('');
const isSyncing = ref(false);
const isRefreshing = ref(false);

// Available databases for testing
const availableDatabases = [
  'products',
  'customers',
  'operators',
  'orders',
  'product-affinity',
  'customer-preferences',
  'recommendation-config'
];

// Test data forms
const testProduct = reactive({
  name: '',
  barcode: '',
  price: 0,
  stock: 0
});

const testCustomer = reactive({
  name: '',
  email: '',
  phone: '',
  document: ''
});

// Database statistics
const databaseStats = ref<Record<string, SyncStatistics>>({});

// Sync event logs
interface SyncLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

const syncLogs = ref<SyncLog[]>([]);

// Debug state
const debugSyncState = computed(() => ({
  syncStatuses: syncStore.syncStatuses,
  isAnySyncActive: syncStore.isAnySyncActive,
  hasAnySyncError: syncStore.hasAnySyncError,
  syncErrors: syncStore.syncErrors.slice(0, 5), // Show only last 5 errors
  overallHealth: syncStore.overallSyncHealth
}));

// Utility functions
const formatDatabaseName = (database: string): string => {
  return database
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString();
};

const getSyncStatusColor = (database: string): string => {
  const color = syncStore.getSyncStatusColor(database);
  return `text-${color}-600`;
};

const addLog = (type: SyncLog['type'], message: string) => {
  syncLogs.value.unshift({
    timestamp: new Date().toISOString(),
    type,
    message
  });

  // Keep only last 100 logs
  if (syncLogs.value.length > 100) {
    syncLogs.value = syncLogs.value.slice(0, 100);
  }
};

// Sync operations
const triggerFullSync = async () => {
  if (!syncService.isSyncEnabled()) {
    addLog('error', 'Sync is disabled. Check your environment configuration.');
    return;
  }

  isSyncing.value = true;
  addLog('info', 'Starting full database sync...');

  try {
    await syncStore.triggerFullResync();
    addLog('success', 'Full sync completed successfully');
    await refreshStats();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog('error', `Full sync failed: ${message}`);
  } finally {
    isSyncing.value = false;
  }
};

const triggerSingleSync = async () => {
  if (!selectedDatabase.value) return;

  isSyncing.value = true;
  addLog('info', `Starting sync for ${selectedDatabase.value}...`);

  try {
    await syncStore.triggerManualSync(selectedDatabase.value);
    addLog('success', `Sync completed for ${selectedDatabase.value}`);
    await refreshStats();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog('error', `Sync failed for ${selectedDatabase.value}: ${message}`);
  } finally {
    isSyncing.value = false;
  }
};

const clearAllErrors = () => {
  syncStore.clearAllSyncErrors();
  addLog('info', 'All sync errors cleared');
};

const clearLogs = () => {
  syncLogs.value = [];
  addLog('info', 'Sync logs cleared');
};

// Database operations
const addTestProduct = async () => {
  if (!testProduct.name || !testProduct.barcode) {
    addLog('warning', 'Product name and barcode are required');
    return;
  }

  try {
    const productDB = getProductDB();
    const product: Product = {
      _id: `product_${Date.now()}`,
      name: testProduct.name,
      barcode: testProduct.barcode,
      price: testProduct.price || 0,
      stock: testProduct.stock || 0,
      category: 'Test Category'
    };

    await productDB.put(product);
    addLog('success', `Test product "${product.name}" added successfully`);

    // Reset form
    Object.assign(testProduct, { name: '', barcode: '', price: 0, stock: 0 });
    await refreshStats();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog('error', `Failed to add test product: ${message}`);
  }
};

const addTestCustomer = async () => {
  if (!testCustomer.name || !testCustomer.document) {
    addLog('warning', 'Customer name and document are required');
    return;
  }

  try {
    const customerDB = getCustomerDB();
    const customer: Customer = {
      _id: `customer_${Date.now()}`,
      name: testCustomer.name,
      document: testCustomer.document,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await customerDB.put(customer);
    addLog('success', `Test customer "${customer.name}" added successfully`);

    // Reset form
    Object.assign(testCustomer, { name: '', email: '', phone: '', document: '' });
    await refreshStats();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog('error', `Failed to add test customer: ${message}`);
  }
};

const createTestOrder = async () => {
  try {
    // Get a random product for the order
    const productDB = getProductDB();
    const products = await productDB.allDocs({ include_docs: true });

    if (products.rows.length === 0) {
      addLog('warning', 'No products available. Add some test products first.');
      return;
    }

    const randomProduct = products.rows[Math.floor(Math.random() * products.rows.length)].doc as Product;

    const orderDB = await getOrderDB();
    const order: Order = {
      _id: `order_${Date.now()}`,
      items: [{
        product: randomProduct,
        quantity: Math.floor(Math.random() * 5) + 1,
        total: randomProduct.price * (Math.floor(Math.random() * 5) + 1)
      }],
      total: randomProduct.price * (Math.floor(Math.random() * 5) + 1),
      status: OrderStatus.COMPLETED,
      terminal_id: 'test_terminal',
      payment_method: Math.random() > 0.5 ? 'cash' : 'card',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await orderDB.put(order);
    addLog('success', `Test order created with total $${order.total.toFixed(2)}`);
    await refreshStats();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog('error', `Failed to create test order: ${message}`);
  }
};

const generateTestData = async () => {
  addLog('info', 'Generating test data...');

  const productNames = ['Apple', 'Banana', 'Orange', 'Milk', 'Bread', 'Cheese', 'Yogurt', 'Rice'];
  const customerNames = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];

  try {
    // Generate test products
    for (let i = 0; i < 5; i++) {
      const name = productNames[Math.floor(Math.random() * productNames.length)];
      testProduct.name = `${name} ${i + 1}`;
      testProduct.barcode = `TEST${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      testProduct.price = Math.round((Math.random() * 20 + 1) * 100) / 100;
      testProduct.stock = Math.floor(Math.random() * 100) + 10;
      await addTestProduct();
    }

    // Generate test customers
    for (let i = 0; i < 3; i++) {
      const name = customerNames[Math.floor(Math.random() * customerNames.length)];
      testCustomer.name = `${name} ${i + 1}`;
      testCustomer.document = `DOC${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      testCustomer.email = `test${i + 1}@example.com`;
      testCustomer.phone = `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      await addTestCustomer();
    }

    // Generate test orders
    for (let i = 0; i < 3; i++) {
      await createTestOrder();
    }

    addLog('success', 'Test data generation completed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog('error', `Test data generation failed: ${message}`);
  }
};

const refreshStats = async () => {
  isRefreshing.value = true;
  addLog('info', 'Refreshing database statistics...');

  try {
    const stats = await syncService.getSyncStatistics();
    databaseStats.value = stats;
    syncStore.refreshSyncStatuses();
    addLog('success', 'Database statistics refreshed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog('error', `Failed to refresh statistics: ${message}`);
  } finally {
    isRefreshing.value = false;
  }
};

// Initialize
onMounted(async () => {
  addLog('info', 'Sync Testing Environment initialized');
  await refreshStats();

  // Set up periodic refresh
  setInterval(refreshStats, 30000); // Refresh every 30 seconds
});
</script>

<style scoped>
/* Custom scrollbar for logs */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #1f2937;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
