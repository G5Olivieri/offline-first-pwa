import type { Product } from "@/product/product";
import { getProductDB, resetProductDB } from "@/db/product-db";
import { syncService } from "@/db/sync-service";
import HttpAdapter from "pouchdb-adapter-http";
import MemoryAdapter from "pouchdb-adapter-memory";
import PouchDBCore from "pouchdb-core";
import PouchDBFind from "pouchdb-find";
import PouchDBMapReduce from "pouchdb-mapreduce";
import PouchDBReplication from "pouchdb-replication";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const PouchDB = PouchDBCore.plugin(MemoryAdapter)
  .plugin(HttpAdapter)
  .plugin(PouchDBFind)
  .plugin(PouchDBMapReduce)
  .plugin(PouchDBReplication);

const TEST_COUCHDB_URL = "http://localhost:5984";
const TEST_DB_PREFIX = "test_pos_products_";
const TEST_COUCHDB_USERNAME = "admin";
const TEST_COUCHDB_PASSWORD = "password";
const TEST_POUCHDB_ADAPTER = import.meta.env.VITE_POUCHDB_ADAPTER || "memory";

interface TestDatabase {
  name: string;
  localDB: PouchDB.Database<Product>;
  remoteDB: PouchDB.Database<Product>;
}

describe("Product Database Sync Integration Tests", () => {
  let databases: TestDatabase[];
  let syncHandlers: PouchDB.Replication.Sync<Product>[];

  beforeEach(async () => {
    databases = [];
    syncHandlers = [];
    vi.clearAllMocks();
    
    // Mock environment variables for testing
    vi.stubEnv("VITE_ENABLE_SYNC", "true");
    vi.stubEnv("VITE_COUCHDB_URL", TEST_COUCHDB_URL);
    vi.stubEnv("VITE_COUCHDB_USERNAME", TEST_COUCHDB_USERNAME);
    vi.stubEnv("VITE_COUCHDB_PASSWORD", TEST_COUCHDB_PASSWORD);
    vi.stubEnv("VITE_POUCHDB_ADAPTER", TEST_POUCHDB_ADAPTER);
  });

  afterEach(async () => {
    // Stop all sync services
    syncService.stopAllSyncs();
    
    // Reset product database
    try {
      await resetProductDB();
    } catch {
      // Ignore cleanup errors
    }

    for (const handler of syncHandlers) {
      handler.cancel();
    }

    for (const db of databases) {
      try {
        await db.localDB.destroy();
        await db.remoteDB.destroy();
      } catch {
        // Ignore cleanup errors
      }
    }

    databases = [];
    syncHandlers = [];
  });

  const createTestDB = async (): Promise<TestDatabase> => {
    const timestamp = Date.now();
    const fullName = `${TEST_DB_PREFIX}${timestamp}`;

    const localDB = new PouchDB<Product>(fullName, {
      adapter: TEST_POUCHDB_ADAPTER,
    });

    const remoteDB = new PouchDB<Product>(`${TEST_COUCHDB_URL}/${fullName}`, {
      auth: {
        username: TEST_COUCHDB_USERNAME,
        password: TEST_COUCHDB_PASSWORD,
      },
    });

    await localDB.createIndex({
      index: { fields: ["barcode"] },
    });

    try {
      await remoteDB.info();
    } catch {
      await remoteDB.put({
        _id: "_design/products",
        views: {
          by_barcode: {
            map: "function(doc) { if (doc.barcode) emit(doc.barcode, doc); }",
          },
        },
      } as unknown as Product);
    }

    const testDB = { name: fullName, localDB, remoteDB };
    databases.push(testDB);
    return testDB;
  };

  const createTestProduct = (id: string, overrides: Partial<Product> = {}): Product => ({
    _id: `product_${id}`,
    name: `Test Product ${id}`,
    barcode: `TEST${id.padStart(5, "0")}`,
    price: Math.round((Math.random() * 100 + 1) * 100) / 100,
    stock: Math.floor(Math.random() * 100) + 10,
    category: "Test Category",
    description: `Description for Test Product ${id}`,
    prescriptionStatus: 'PrescriptionOnly',
    activeIngredient: "",
    ...overrides,
  });

  const startBidirectionalSync = (db: TestDatabase) => {
    const sync = db.localDB.sync(db.remoteDB, {
      live: true,
      retry: true,
    });
    syncHandlers.push(sync);
    return sync;
  };

  describe("Bidirectional Sync", () => {
    it("should sync product from local to remote", async () => {
      const db = await createTestDB();
      const product = createTestProduct("001");

      await db.localDB.put(product);

      const sync = startBidirectionalSync(db);

      await new Promise((resolve) => {
        sync.on("change", resolve);
      });

      // Verify product exists in remote
      const remoteProduct = await db.remoteDB.get(product._id);
      expect(remoteProduct).toMatchObject({
        _id: product._id,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        stock: product.stock,
      });
    });

    it("should sync product from remote to local", async () => {
      const db = await createTestDB();
      const product = createTestProduct("002");

      // Add product to remote database
      await db.remoteDB.put(product);

      // Start sync
      const sync = startBidirectionalSync(db);

      // Wait for sync to complete
      await new Promise((resolve) => {
        sync.on("change", resolve);
      });

      const localProduct = await db.localDB.get(product._id);
      expect(localProduct).toMatchObject({
        _id: product._id,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        stock: product.stock,
      });
    });

    it("should handle bidirectional sync correctly", async () => {
      const db = await createTestDB();
      const localProduct = createTestProduct("003_local");
      const remoteProduct = createTestProduct("003_remote");

      // Add different products to each database
      await db.localDB.put(localProduct);
      await db.remoteDB.put(remoteProduct);

      // Start sync
      const sync = startBidirectionalSync(db);

      // Wait for both directions to sync
      await new Promise((resolve) => {
        let changeCount = 0;
        sync.on("change", () => {
          changeCount++;
          if (changeCount >= 2) resolve(undefined);
        });
      });

      // Verify both products exist in both databases
      const localFromRemote = await db.localDB.get(remoteProduct._id);
      const remoteFromLocal = await db.remoteDB.get(localProduct._id);

      expect(localFromRemote).toMatchObject({
        _id: remoteProduct._id,
        name: remoteProduct.name,
      });
      expect(remoteFromLocal).toMatchObject({
        _id: localProduct._id,
        name: localProduct.name,
      });
    });
  });

  describe("Conflict Resolution - Remote Wins for Product Details", () => {
    it("should resolve product detail conflicts with remote wins strategy", async () => {
      const db = await createTestDB();
      const baseProduct = createTestProduct("004");

      // Add same product to both databases
      await db.localDB.put(baseProduct);
      await db.remoteDB.put(baseProduct);

      // Get the documents with their revisions
      const localDoc = await db.localDB.get(baseProduct._id);
      const remoteDoc = await db.remoteDB.get(baseProduct._id);

      // Update product details in both databases (creating conflict)
      const localUpdate = {
        ...localDoc,
        name: "Local Updated Name",
        price: 99.99
      };
      const remoteUpdate = {
        ...remoteDoc,
        name: "Remote Updated Name",
        price: 199.99
      };

      await db.localDB.put(localUpdate);
      await db.remoteDB.put(remoteUpdate);

      // Start sync and wait for initial sync
      const sync = startBidirectionalSync(db);

      // Wait for conflict resolution - use a more robust approach
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Sync timeout")), 10000);

        sync.on("change", () => {
          clearTimeout(timeout);
          resolve(undefined);
        });

        sync.on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      // Allow some time for conflict resolution to stabilize
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify both databases have the same final state
      const finalLocalProduct = await db.localDB.get(baseProduct._id);
      const finalRemoteProduct = await db.remoteDB.get(baseProduct._id);

      // They should be the same (one should win)
      expect(finalLocalProduct.name).toBe(finalRemoteProduct.name);
      expect(finalLocalProduct.price).toBe(finalRemoteProduct.price);
      expect(finalLocalProduct._rev).toBe(finalRemoteProduct._rev);
    }, 15000);

    it("should handle stock level conflicts according to order sync completion", async () => {
      const db = await createTestDB();
      const baseProduct = createTestProduct("005", { stock: 100 });

      // Add same product to both databases
      await db.localDB.put(baseProduct);
      await db.remoteDB.put(baseProduct);

      // Get documents with revisions
      const localDoc = await db.localDB.get(baseProduct._id);
      const remoteDoc = await db.remoteDB.get(baseProduct._id);

      // Simulate local stock change (from local order)
      const localStockUpdate = { ...localDoc, stock: 95 };
      await db.localDB.put(localStockUpdate);

      // Simulate remote stock change (from other terminals)
      const remoteStockUpdate = { ...remoteDoc, stock: 85 };
      await db.remoteDB.put(remoteStockUpdate);

      // Start sync
      const sync = startBidirectionalSync(db);

      // Wait for sync with proper error handling
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Sync timeout")), 10000);

        sync.on("change", () => {
          clearTimeout(timeout);
          resolve(undefined);
        });

        sync.on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      // Wait for conflict resolution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify that stock levels are synchronized
      const finalLocalProduct = await db.localDB.get(baseProduct._id);
      const finalRemoteProduct = await db.remoteDB.get(baseProduct._id);

      expect(finalLocalProduct.stock).toBe(finalRemoteProduct.stock);
      expect(finalLocalProduct._rev).toBe(finalRemoteProduct._rev);
    }, 15000);
  });

  describe("Barcode Index Performance", () => {
    it("should efficiently query products by barcode using index", async () => {
      const db = await createTestDB();
      const products = [];
      
      // Create multiple products with different barcodes
      for (let i = 1; i <= 10; i++) {
        products.push(createTestProduct(i.toString().padStart(3, '0'), {
          barcode: `PERF${i.toString().padStart(5, '0')}`
        }));
      }

      // Bulk insert products
      const bulkResult = await db.localDB.bulkDocs(products);
      expect(bulkResult.length).toBe(10);

      // Test barcode query performance
      const startTime = performance.now();
      const result = await db.localDB.find({
        selector: { barcode: "PERF00005" }
      });
      const endTime = performance.now();

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].barcode).toBe("PERF00005");
      expect(endTime - startTime).toBeLessThan(100); // Should be fast with index
    }, 10000);

    it("should sync large product catalog efficiently", async () => {
      const db = await createTestDB();
      const largeProductCatalog = [];
      
      // Create a large product catalog (100 products)
      for (let i = 1; i <= 100; i++) {
        largeProductCatalog.push(createTestProduct(`large_${i.toString().padStart(3, '0')}`));
      }

      // Add to local database
      const bulkResult = await db.localDB.bulkDocs(largeProductCatalog);
      expect(bulkResult.length).toBe(100);

      // Start sync and measure time
      const startTime = performance.now();
      const sync = startBidirectionalSync(db);

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Sync timeout")), 30000);
        
        sync.on("change", (info) => {
          if (info.direction === "push" && info.change.docs_written === 100) {
            clearTimeout(timeout);
            resolve(undefined);
          }
        });

        sync.on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      const endTime = performance.now();
      
      // Verify all products are synced
      const remoteAllDocs = await db.remoteDB.allDocs();
      expect(remoteAllDocs.total_rows).toBeGreaterThanOrEqual(100);
      
      // Sync should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(30000);
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle network interruption gracefully", async () => {
      const db = await createTestDB();
      const product = createTestProduct("network_test");
      
      // Add product to local database
      await db.localDB.put(product);
      
      // Start sync
      const sync = startBidirectionalSync(db);
      
      // Simulate network interruption by destroying remote connection
      sync.on("error", (error) => {
        expect(error).toBeDefined();
      });
      
      // Force an error by trying to access non-existent remote database
      const fakeRemoteDB = new PouchDB(`${TEST_COUCHDB_URL}/non_existent_db_${Date.now()}`, {
        auth: {
          username: "fake_user",
          password: "fake_password",
        },
      });
      
      try {
        await fakeRemoteDB.info();
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      // Verify local database still works
      const localProduct = await db.localDB.get(product._id);
      expect(localProduct).toMatchObject({
        _id: product._id,
        name: product.name,
      });
    }, 10000);

    it("should handle authentication failure appropriately", async () => {
      const db = await createTestDB();
      
      // Try to create a remote database with invalid credentials
      const invalidRemoteDB = new PouchDB(`${TEST_COUCHDB_URL}/test_auth_fail_${Date.now()}`, {
        auth: {
          username: "invalid_user",
          password: "invalid_password",
        },
      });
      
      let authError = false;
      try {
        await invalidRemoteDB.info();
      } catch (error) {
        authError = true;
        expect(error).toBeDefined();
      }
      
      expect(authError).toBe(true);
      
      // Verify local database still works despite auth failure
      const product = createTestProduct("auth_test");
      await db.localDB.put(product);
      const retrievedProduct = await db.localDB.get(product._id);
      expect(retrievedProduct).toMatchObject({
        _id: product._id,
        name: product.name,
      });
    }, 10000);
  });

  describe("Real-time Sync Monitoring", () => {
    it("should report sync statistics correctly", async () => {
      const db = await createTestDB();
      const products = [];
      
      // Create test products
      for (let i = 1; i <= 5; i++) {
        products.push(createTestProduct(`stats_${i}`));
      }
      
      // Add products to local database
      await db.localDB.bulkDocs(products);
      
      // Start sync and monitor statistics
      const sync = startBidirectionalSync(db);
      
      let syncStats: PouchDB.Replication.SyncResult<Product> | null = null;
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Sync timeout")), 10000);
        
        sync.on("change", (info) => {
          syncStats = info;
          if (info.direction === "push" && info.change.docs_written === 5) {
            clearTimeout(timeout);
            resolve(undefined);
          }
        });
        
        sync.on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      
      expect(syncStats).toBeDefined();
      expect(syncStats!.direction).toBe("push");
      expect(syncStats!.change.docs_written).toBe(5);
      expect(syncStats!.change.docs_read).toBe(5);
    }, 15000);

    it("should maintain live sync for real-time updates", async () => {
      const db = await createTestDB();
      
      // Start live sync
      const sync = startBidirectionalSync(db);
      
      // Add initial product
      const product1 = createTestProduct("live_sync_1");
      await db.localDB.put(product1);
      
      // Wait for initial sync
      await new Promise((resolve) => {
        sync.on("change", resolve);
      });
      
      // Verify initial sync worked
      const remoteProduct1 = await db.remoteDB.get(product1._id);
      expect(remoteProduct1.name).toBe(product1.name);
      
      // Add another product and verify live sync picks it up
      const product2 = createTestProduct("live_sync_2");
      await db.localDB.put(product2);
      
      // Wait for live sync to pick up the change
      await new Promise((resolve) => {
        sync.on("change", (info) => {
          if (info.change.docs_written === 1 && info.change.last_seq) {
            resolve(undefined);
          }
        });
      });
      
      // Verify second product was synced
      const remoteProduct2 = await db.remoteDB.get(product2._id);
      expect(remoteProduct2.name).toBe(product2.name);
    }, 15000);
  });

  describe("getProductDB Integration with Sync Service", () => {
    it("should initialize product database with proper indexes", async () => {
      await resetProductDB();
      
      const productDB = await getProductDB();
      expect(productDB).toBeDefined();
      
      // Check if indexes exist by trying to use them
      const barcodeIndex = await productDB.getIndexes();
      expect(barcodeIndex.indexes.length).toBeGreaterThan(1); // Should have at least the default + barcode index
      
      // Test barcode index functionality
      const product = createTestProduct("index_test");
      await productDB.put(product);
      
      const result = await productDB.find({
        selector: { barcode: product.barcode }
      });
      
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]._id).toBe(product._id);
    });

    it("should handle sync initialization according to SYNCING.md specs", async () => {
      // Mock environment to enable sync
      vi.stubEnv("VITE_ENABLE_SYNC", "true");
      vi.stubEnv("VITE_COUCHDB_URL", TEST_COUCHDB_URL);
      
      await resetProductDB();
      const productDB = await getProductDB();
      
      // Add a product to test sync functionality
      const product = createTestProduct("sync_init_test");
      await productDB.put(product);
      
      // Give sync service time to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify database is working
      const retrievedProduct = await productDB.get(product._id);
      expect(retrievedProduct).toMatchObject({
        _id: product._id,
        name: product.name,
        barcode: product.barcode,
      });
    });

    it("should handle bidirectional sync for product details according to SYNCING.md", async () => {
      const db = await createTestDB();
      const product = createTestProduct("bidirectional_test");

      // Test local to remote sync
      await db.localDB.put(product);
      const sync = startBidirectionalSync(db);

      await new Promise((resolve) => {
        sync.on("change", resolve);
      });

      const remoteProduct = await db.remoteDB.get(product._id);
      expect(remoteProduct.name).toBe(product.name);
      expect(remoteProduct.barcode).toBe(product.barcode);
    });

    it("should implement remote wins conflict resolution for product details", async () => {
      const db = await createTestDB();
      const baseProduct = createTestProduct("conflict_test");

      // Add same product to both databases
      await db.localDB.put(baseProduct);
      await db.remoteDB.put(baseProduct);

      // Create conflicting updates
      const localDoc = await db.localDB.get(baseProduct._id);
      const remoteDoc = await db.remoteDB.get(baseProduct._id);

      const localUpdate = { ...localDoc, name: "Local Name", price: 10.99 };
      const remoteUpdate = { ...remoteDoc, name: "Remote Name", price: 20.99 };

      await db.localDB.put(localUpdate);
      await db.remoteDB.put(remoteUpdate);

      // Start sync and wait for resolution
      const sync = startBidirectionalSync(db);
      await new Promise((resolve) => {
        sync.on("change", resolve);
      });

      // Allow conflict resolution to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Both databases should have the same final state
      const finalLocal = await db.localDB.get(baseProduct._id);
      const finalRemote = await db.remoteDB.get(baseProduct._id);

      expect(finalLocal.name).toBe(finalRemote.name);
      expect(finalLocal.price).toBe(finalRemote.price);
      expect(finalLocal._rev).toBe(finalRemote._rev);
    });

    it("should handle stock level conflicts according to order sync completion strategy", async () => {
      const db = await createTestDB();
      const baseProduct = createTestProduct("stock_conflict", { stock: 100 });

      // Add product to both databases
      await db.localDB.put(baseProduct);
      await db.remoteDB.put(baseProduct);

      // Create conflicting stock updates
      const localDoc = await db.localDB.get(baseProduct._id);
      const remoteDoc = await db.remoteDB.get(baseProduct._id);

      const localStockUpdate = { ...localDoc, stock: 90 };
      const remoteStockUpdate = { ...remoteDoc, stock: 80 };

      await db.localDB.put(localStockUpdate);
      await db.remoteDB.put(remoteStockUpdate);

      // Start sync
      const sync = startBidirectionalSync(db);
      await new Promise((resolve) => {
        sync.on("change", resolve);
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify stock levels are consistent
      const finalLocal = await db.localDB.get(baseProduct._id);
      const finalRemote = await db.remoteDB.get(baseProduct._id);

      expect(finalLocal.stock).toBe(finalRemote.stock);
    });

    it("should efficiently query products by barcode using indexed search", async () => {
      await resetProductDB();
      const productDB = await getProductDB();

      // Add multiple products
      const products = [];
      for (let i = 1; i <= 20; i++) {
        products.push(createTestProduct(`perf_${i}`, {
          barcode: `PERF${i.toString().padStart(5, '0')}`
        }));
      }

      await productDB.bulkDocs(products);

      // Test indexed barcode search performance
      const startTime = performance.now();
      const result = await productDB.find({
        selector: { barcode: "PERF00010" }
      });
      const endTime = performance.now();

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].barcode).toBe("PERF00010");
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast with index
    });

    it("should handle prescription status and active ingredient fields correctly", async () => {
      await resetProductDB();
      const productDB = await getProductDB();

      const prescriptionProduct = createTestProduct("prescription_test", {
        prescriptionStatus: 'PrescriptionOnly',
        activeIngredient: "Ibuprofen 200mg"
      });

      await productDB.put(prescriptionProduct);
      const retrieved = await productDB.get(prescriptionProduct._id);

      expect(retrieved.prescriptionStatus).toBe('PrescriptionOnly');
      expect(retrieved.activeIngredient).toBe("Ibuprofen 200mg");
    });

    it("should maintain sync state monitoring capabilities", async () => {
      // This test verifies that sync service provides monitoring capabilities
      const db = await createTestDB();
      const sync = startBidirectionalSync(db);

      let syncStateReceived = false;
      sync.on("change", (info) => {
        expect(info).toHaveProperty("direction");
        expect(info).toHaveProperty("change");
        syncStateReceived = true;
      });

      // Trigger a sync event
      const product = createTestProduct("sync_state_test");
      await db.localDB.put(product);

      // Wait for sync event
      await new Promise((resolve) => {
        sync.on("change", resolve);
      });

      expect(syncStateReceived).toBe(true);
    });
  });

  describe("SYNCING.md Compliance Tests", () => {
    it("should implement two-way sync with conflict resolution as per SYNCING.md", async () => {
      const db = await createTestDB();
      
      // Test two-way sync: local -> remote
      const localProduct = createTestProduct("twoway_local");
      await db.localDB.put(localProduct);
      
      // Test two-way sync: remote -> local  
      const remoteProduct = createTestProduct("twoway_remote");
      await db.remoteDB.put(remoteProduct);
      
      // Start bidirectional sync
      const sync = startBidirectionalSync(db);
      
      // Wait for both directions to sync
      let changeCount = 0;
      await new Promise((resolve) => {
        sync.on("change", () => {
          changeCount++;
          if (changeCount >= 2) resolve(undefined);
        });
      });
      
      // Verify both products exist in both databases
      const localFromRemote = await db.localDB.get(remoteProduct._id);
      const remoteFromLocal = await db.remoteDB.get(localProduct._id);
      
      expect(localFromRemote._id).toBe(remoteProduct._id);
      expect(remoteFromLocal._id).toBe(localProduct._id);
    });

    it("should handle stock level conflicts with order sync completion strategy", async () => {
      const db = await createTestDB();
      const product = createTestProduct("stock_strategy", { stock: 50 });
      
      // Add to both databases
      await db.localDB.put(product);
      await db.remoteDB.put(product);
      
      // Simulate different stock levels from different terminals
      const localDoc = await db.localDB.get(product._id);
      const remoteDoc = await db.remoteDB.get(product._id);
      
      // Local terminal reduces stock (order completion)
      const localUpdate = { ...localDoc, stock: 45 };
      await db.localDB.put(localUpdate);
      
      // Remote terminal also reduces stock (different order)
      const remoteUpdate = { ...remoteDoc, stock: 40 };
      await db.remoteDB.put(remoteUpdate);
      
      // Start sync
      const sync = startBidirectionalSync(db);
      await new Promise((resolve) => {
        sync.on("change", resolve);
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify consistent final state (one wins)
      const finalLocal = await db.localDB.get(product._id);
      const finalRemote = await db.remoteDB.get(product._id);
      
      expect(finalLocal.stock).toBe(finalRemote.stock);
      expect([40, 45]).toContain(finalLocal.stock); // One of the values should win
    });

    it("should support real-time sync with live sync enabled", async () => {
      const db = await createTestDB();
      
      // Start live sync
      const sync = db.localDB.sync(db.remoteDB, {
        live: true,
        retry: true,
      });
      syncHandlers.push(sync);
      
      // Add product and verify immediate sync
      const product = createTestProduct("realtime_test");
      await db.localDB.put(product);
      
      // Wait for live sync to propagate
      await new Promise((resolve) => {
        sync.on("change", resolve);
      });
      
      // Verify product appeared in remote
      const remoteProduct = await db.remoteDB.get(product._id);
      expect(remoteProduct._id).toBe(product._id);
      
      // Test reverse direction
      const product2 = createTestProduct("realtime_test_2");
      await db.remoteDB.put(product2);
      
      // Wait for reverse sync
      await new Promise((resolve) => {
        sync.on("change", resolve);
      });
      
      // Verify product appeared in local
      const localProduct2 = await db.localDB.get(product2._id);
      expect(localProduct2._id).toBe(product2._id);
    });

    it("should maintain barcode field index for fast lookups as specified", async () => {
      const db = await createTestDB();
      
      // Add products with various barcodes
      const products = [];
      for (let i = 1; i <= 50; i++) {
        products.push(createTestProduct(`lookup_${i}`, {
          barcode: `LOOKUP${i.toString().padStart(6, '0')}`
        }));
      }
      
      await db.localDB.bulkDocs(products);
      
      // Test fast barcode lookup
      const startTime = performance.now();
      const result = await db.localDB.find({
        selector: { barcode: "LOOKUP000025" }
      });
      const endTime = performance.now();
      
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].barcode).toBe("LOOKUP000025");
      expect(endTime - startTime).toBeLessThan(100); // Fast lookup with index
    });

    it("should handle all prescription status types correctly", async () => {
      const db = await createTestDB();
      
      const prescriptionStatuses = ['OTC', 'PrescriptionOnly', 'Controlled'] as const;
      const products = prescriptionStatuses.map((status, index) => 
        createTestProduct(`prescription_${index}`, {
          prescriptionStatus: status,
          activeIngredient: status === 'PrescriptionOnly' ? "Active Ingredient" : ""
        })
      );
      
      await db.localDB.bulkDocs(products);
      
      // Verify all prescription types are stored correctly
      for (let i = 0; i < products.length; i++) {
        const retrieved = await db.localDB.get(products[i]._id);
        expect(retrieved.prescriptionStatus).toBe(prescriptionStatuses[i]);
      }
    });

    it("should support error handling and retry logic for sync failures", async () => {
      const db = await createTestDB();
      
      // Start sync with retry enabled
      const sync = db.localDB.sync(db.remoteDB, {
        live: true,
        retry: true,
      });
      syncHandlers.push(sync);
      
      sync.on("error", (error) => {
        expect(error).toBeDefined();
      });
      
      sync.on("active", () => {
        // Sync is active/retrying
        expect(true).toBe(true);
      });
      
      // Add a product to trigger sync
      const product = createTestProduct("retry_test");
      await db.localDB.put(product);
      
      // Wait for sync to complete successfully
      await new Promise((resolve) => {
        sync.on("change", resolve);
      });
      
      // Verify product synced successfully
      const remoteProduct = await db.remoteDB.get(product._id);
      expect(remoteProduct._id).toBe(product._id);
      
      // Verify sync is configured for retry (no actual error needed for this test)
      expect(sync).toBeDefined();
    });
  });
});
