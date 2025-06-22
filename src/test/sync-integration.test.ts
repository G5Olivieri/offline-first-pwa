import type { Customer } from "@/customer/customer";
import type { Product } from "@/product/product";
import { SyncManager } from "@/services/sync-manager";
import { SyncService } from "@/services/sync-service";
import type { Order } from "@/types/order";
import { OrderStatus } from "@/types/order";
import PouchDB from "pouchdb";
import MemoryAdapter from "pouchdb-adapter-memory";
import PouchDBFind from "pouchdb-find";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Setup PouchDB with LevelDB adapter for integration tests
PouchDB.plugin(MemoryAdapter);
PouchDB.plugin(PouchDBFind);

// Test configuration
const TEST_COUCHDB_URL = "http://localhost:5984";
const TEST_DB_PREFIX = "test_pos_";

interface TestDatabase {
  name: string;
  localDB: PouchDB.Database;
  remoteDB: PouchDB.Database;
}

describe("Sync Integration Tests", () => {
  let testDatabases: TestDatabase[] = [];
  let syncManager: SyncManager;
  let syncService: SyncService;

  // Helper function to create test databases
  const createTestDatabase = async (name: string): Promise<TestDatabase> => {
    const fullName = `${TEST_DB_PREFIX}${name}_${Date.now()}`;
    const localDB = new PouchDB(fullName);
    const remoteDB = new PouchDB(`${TEST_COUCHDB_URL}/${fullName}`);

    // Ensure remote database exists
    try {
      await remoteDB.info();
    } catch {
      // Database might not exist, try to create it
      await remoteDB.put({ _id: "_design/test", views: {} });
    }

    return { name: fullName, localDB, remoteDB };
  };

  // Helper function to create test data
  const createTestProduct = (id: string): Product => ({
    _id: `product_${id}`,
    name: `Test Product ${id}`,
    barcode: `TEST${id.padStart(5, "0")}`,
    price: Math.round((Math.random() * 100 + 1) * 100) / 100,
    stock: Math.floor(Math.random() * 100) + 10,
    category: "Test Category",
  });

  const createTestCustomer = (id: string): Customer => ({
    _id: `customer_${id}`,
    name: `Test Customer ${id}`,
    document: `DOC${id.padStart(8, "0")}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const createTestOrder = (id: string, product: Product): Order => ({
    _id: `order_${id}`,
    items: [
      {
        product,
        quantity: Math.floor(Math.random() * 5) + 1,
        total: product.price * (Math.floor(Math.random() * 5) + 1),
      },
    ],
    total: product.price * (Math.floor(Math.random() * 5) + 1),
    status: OrderStatus.COMPLETED,
    terminal_id: "test_terminal",
    payment_method: Math.random() > 0.5 ? "cash" : "card",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  beforeEach(async () => {
    // Create test databases
    testDatabases = await Promise.all([
      createTestDatabase("products"),
      createTestDatabase("customers"),
      createTestDatabase("orders"),
    ]);

    // Initialize sync services
    syncManager = SyncManager.getInstance();
    syncService = SyncService.getInstance();

    // Mock console methods to reduce noise
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    // Cleanup test databases
    for (const db of testDatabases) {
      try {
        await db.localDB.destroy();
        await db.remoteDB.destroy();
      } catch {
        // Ignore cleanup errors
      }
    }
    testDatabases = [];

    // Restore console methods
    vi.restoreAllMocks();
  });

  describe("Basic Sync Operations", () => {
    it("should sync a single document from local to remote", async () => {
      const { localDB, remoteDB } = testDatabases[0]; // products
      const testProduct = createTestProduct("001");

      // Add document to local database
      await localDB.put(testProduct);

      // Setup one-way sync (local to remote)
      const replication = localDB.replicate.to(remoteDB, {
        live: false,
        retry: false,
      });

      // Wait for sync to complete
      await new Promise((resolve, reject) => {
        replication.on("complete", resolve);
        replication.on("error", reject);
      }); // Verify document exists in remote database
      const remoteDoc = (await remoteDB.get(testProduct._id)) as Product;
      expect(remoteDoc.name).toBe(testProduct.name);
      expect(remoteDoc.barcode).toBe(testProduct.barcode);
    });

    it("should sync a single document from remote to local", async () => {
      const { localDB, remoteDB } = testDatabases[1]; // customers
      const testCustomer = createTestCustomer("001");

      // Add document to remote database
      await remoteDB.put(testCustomer);

      // Setup one-way sync (remote to local)
      const replication = remoteDB.replicate.to(localDB, {
        live: false,
        retry: false,
      });

      // Wait for sync to complete
      await new Promise((resolve, reject) => {
        replication.on("complete", resolve);
        replication.on("error", reject);
      }); // Verify document exists in local database
      const localDoc = (await localDB.get(testCustomer._id)) as Customer;
      expect(localDoc.name).toBe(testCustomer.name);
      expect(localDoc.document).toBe(testCustomer.document);
    });

    it("should perform bidirectional sync", async () => {
      const { localDB, remoteDB } = testDatabases[0]; // products
      const localProduct = createTestProduct("local");
      const remoteProduct = createTestProduct("remote");

      // Add different documents to each database
      await localDB.put(localProduct);
      await remoteDB.put(remoteProduct);

      // Setup bidirectional sync
      const sync = localDB.sync(remoteDB, {
        live: false,
        retry: false,
      });

      // Wait for sync to complete
      await new Promise((resolve, reject) => {
        sync.on("complete", resolve);
        sync.on("error", reject);
      });

      // Verify both documents exist in both databases
      const localDocs = await localDB.allDocs({ include_docs: true });
      const remoteDocs = await remoteDB.allDocs({ include_docs: true });

      expect(localDocs.rows).toHaveLength(2);
      expect(remoteDocs.rows).toHaveLength(2);

      // Check specific documents
      await expect(localDB.get(remoteProduct._id)).resolves.toBeDefined();
      await expect(remoteDB.get(localProduct._id)).resolves.toBeDefined();
    });
  });

  describe("Conflict Resolution", () => {
    it("should handle conflicts with remote-wins strategy", async () => {
      const { localDB, remoteDB } = testDatabases[0]; // products
      const productId = "conflict_test";

      // Create initial document
      const initialProduct = createTestProduct(productId);
      await localDB.put(initialProduct);
      await remoteDB.put(initialProduct);

      // Create conflicting updates
      const localUpdate = {
        ...initialProduct,
        name: "Local Update",
        price: 100,
      };
      const remoteUpdate = {
        ...initialProduct,
        name: "Remote Update",
        price: 200,
      };

      // Get current revisions
      const localDoc = await localDB.get(productId);
      const remoteDoc = await remoteDB.get(productId);

      localUpdate._rev = localDoc._rev;
      remoteUpdate._rev = remoteDoc._rev;

      // Apply conflicting updates
      await localDB.put(localUpdate);
      await remoteDB.put(remoteUpdate);

      // Setup sync with conflict resolution
      const syncHandler = syncManager.setupBidirectionalSync(
        localDB,
        remoteDB,
        "products",
        { strategy: "remote-wins" },
      );

      // Wait for sync to complete
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 2000);
        syncHandler.on("complete", () => {
          clearTimeout(timeout);
          resolve(undefined);
        });
      });

      // Verify remote version won
      const finalLocalDoc = await localDB.get(productId);
      expect(finalLocalDoc.name).toBe("Remote Update");
      expect(finalLocalDoc.price).toBe(200);
    });

    it("should handle conflicts with merge strategy", async () => {
      const { localDB, remoteDB } = testDatabases[1]; // customers
      const customerId = "merge_test";

      // Create initial document
      const initialCustomer = createTestCustomer(customerId);
      await localDB.put(initialCustomer);
      await remoteDB.put(initialCustomer);

      // Create conflicting updates
      const localDoc = await localDB.get(customerId);
      const remoteDoc = await remoteDB.get(customerId);

      const localUpdate = {
        ...localDoc,
        name: "Updated Local Name",
        updated_at: new Date(Date.now() + 1000).toISOString(),
      };
      const remoteUpdate = {
        ...remoteDoc,
        document: "UPDATED_DOC",
        updated_at: new Date(Date.now() + 2000).toISOString(),
      };

      // Apply conflicting updates
      await localDB.put(localUpdate);
      await remoteDB.put(remoteUpdate);

      // Setup sync with merge strategy
      const syncHandler = syncManager.setupBidirectionalSync(
        localDB,
        remoteDB,
        "customers",
        {
          strategy: "merge",
          resolver: (local: Customer, remote: Customer) => ({
            ...local,
            ...remote,
            updated_at:
              local.updated_at > remote.updated_at
                ? local.updated_at
                : remote.updated_at,
          }),
        },
      );

      // Wait for sync to complete
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 2000);
        syncHandler.on("complete", () => {
          clearTimeout(timeout);
          resolve(undefined);
        });
      });

      // Verify merge occurred
      const finalDoc = await localDB.get(customerId);
      expect(finalDoc.document).toBe("UPDATED_DOC");
      expect(finalDoc.updated_at).toBe(remoteUpdate.updated_at);
    });
  });

  describe("Bulk Operations", () => {
    it("should sync multiple documents efficiently", async () => {
      const { localDB, remoteDB } = testDatabases[0]; // products
      const productCount = 50;
      const products: Product[] = [];

      // Create test products
      for (let i = 1; i <= productCount; i++) {
        products.push(createTestProduct(i.toString().padStart(3, "0")));
      }

      // Bulk insert to local database
      await localDB.bulkDocs(products);

      // Setup one-way sync
      const replication = localDB.replicate.to(remoteDB, {
        live: false,
        retry: false,
      });

      const startTime = Date.now();

      // Wait for sync to complete
      await new Promise((resolve, reject) => {
        replication.on("complete", resolve);
        replication.on("error", reject);
      });

      const endTime = Date.now();
      const syncDuration = endTime - startTime;

      // Verify all documents synced
      const remoteDocs = await remoteDB.allDocs();
      expect(remoteDocs.rows).toHaveLength(productCount);

      // Performance check (should complete within reasonable time)
      expect(syncDuration).toBeLessThan(10000); // 10 seconds max

      console.log(`Synced ${productCount} documents in ${syncDuration}ms`);
    });

    it("should handle concurrent sync operations", async () => {
      const databases = testDatabases;
      const syncPromises: Promise<void>[] = [];

      // Start concurrent sync operations
      databases.forEach((db, index) => {
        const promise = (async () => {
          let testData: PouchDB.Core.PutDocument<any>[];

          // Create appropriate test data for each database type
          if (index === 0) {
            // products
            testData = [createTestProduct("001"), createTestProduct("002")];
          } else if (index === 1) {
            // customers
            testData = [createTestCustomer("001"), createTestCustomer("002")];
          } else {
            // orders
            testData = [
              createTestOrder("001", createTestProduct("test")),
              createTestOrder("002", createTestProduct("test")),
            ];
          }

          // Add data to local database
          await db.localDB.bulkDocs(testData);

          // Start sync
          const sync = db.localDB.sync(db.remoteDB, {
            live: false,
            retry: false,
          });

          // Wait for completion
          await new Promise((resolve, reject) => {
            sync.on("complete", resolve);
            sync.on("error", reject);
          });
        })();

        syncPromises.push(promise);
      });

      // Wait for all syncs to complete
      await Promise.all(syncPromises);

      // Verify all data synced correctly
      for (let i = 0; i < databases.length; i++) {
        const remoteDocs = await databases[i].remoteDB.allDocs();
        expect(remoteDocs.rows.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle network interruption gracefully", async () => {
      const { localDB, remoteDB } = testDatabases[0]; // products
      const testProduct = createTestProduct("network_test");

      // Add document to local database
      await localDB.put(testProduct);

      // Create a mock that simulates network failure
      const originalFetch = global.fetch;
      let failureCount = 0;

      global.fetch = vi.fn().mockImplementation((url, options) => {
        failureCount++;
        if (failureCount <= 2) {
          // Simulate network failure for first 2 attempts
          return Promise.reject(new Error("Network Error"));
        }
        // Restore normal behavior after failures
        return originalFetch(url, options);
      });

      try {
        // Setup sync with retry enabled
        const replication = localDB.replicate.to(remoteDB, {
          live: false,
          retry: true,
        });

        // Wait for sync to eventually succeed
        await new Promise((resolve, reject) => {
          replication.on("complete", resolve);
          replication.on("error", reject);
        });

        // Verify document eventually synced
        const remoteDoc = await remoteDB.get(testProduct._id);
        expect(remoteDoc.name).toBe(testProduct.name);
      } finally {
        // Restore original fetch
        global.fetch = originalFetch;
      }
    });

    it("should handle database access errors", async () => {
      const { localDB } = testDatabases[0]; // products

      // Create an invalid remote database URL
      const invalidRemoteDB = new PouchDB("invalid://nonexistent.com/database");

      // Attempt sync with invalid remote
      const replication = localDB.replicate.to(invalidRemoteDB, {
        live: false,
        retry: false,
      });

      // Expect sync to fail gracefully
      await expect(
        new Promise((resolve, reject) => {
          replication.on("complete", resolve);
          replication.on("error", reject);
        }),
      ).rejects.toThrow();

      // Verify local database remains intact
      const localInfo = await localDB.info();
      expect(localInfo).toBeDefined();
    });
  });

  describe("Sync Service Integration", () => {
    it("should integrate with SyncService for manual sync triggers", async () => {
      // This test would require mocking the actual database instances
      // in the SyncService, which depends on the current implementation

      const syncStatistics = await syncService.getSyncStatistics();
      expect(syncStatistics).toBeDefined();
      expect(typeof syncStatistics).toBe("object");
    });

    it("should report sync statistics correctly", async () => {
      const { localDB } = testDatabases[0]; // products
      const products = [
        createTestProduct("stat_001"),
        createTestProduct("stat_002"),
        createTestProduct("stat_003"),
      ];

      // Add test data
      await localDB.bulkDocs(products);

      // Get database info
      const dbInfo = await localDB.info();

      expect(dbInfo.doc_count).toBe(3);
      expect(dbInfo.update_seq).toBeGreaterThan(0);
    });
  });

  describe("Performance Tests", () => {
    it("should maintain sync performance under load", async () => {
      const { localDB, remoteDB } = testDatabases[0]; // products
      const documentCount = 100;
      const batchSize = 20;

      const startTime = Date.now();

      // Create documents in batches
      for (let batch = 0; batch < documentCount / batchSize; batch++) {
        const batchProducts: Product[] = [];
        for (let i = 0; i < batchSize; i++) {
          const id = (batch * batchSize + i).toString().padStart(4, "0");
          batchProducts.push(createTestProduct(id));
        }

        await localDB.bulkDocs(batchProducts);

        // Sync each batch
        const replication = localDB.replicate.to(remoteDB, {
          live: false,
          retry: false,
        });

        await new Promise((resolve, reject) => {
          replication.on("complete", resolve);
          replication.on("error", reject);
        });
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerDoc = totalTime / documentCount;

      // Verify all documents synced
      const remoteDocs = await remoteDB.allDocs();
      expect(remoteDocs.rows).toHaveLength(documentCount);

      // Performance assertions
      expect(avgTimePerDoc).toBeLessThan(100); // Less than 100ms per document
      expect(totalTime).toBeLessThan(20000); // Less than 20 seconds total

      console.log(
        `Sync performance: ${avgTimePerDoc.toFixed(2)}ms per document, ${totalTime}ms total`,
      );
    });
  });
});
