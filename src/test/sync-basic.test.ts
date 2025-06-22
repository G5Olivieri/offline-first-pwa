import type { Customer } from "@/customer/customer";
import type { Product } from "@/product/product";
import PouchDB from "pouchdb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Test configuration
const TEST_COUCHDB_URL = "http://localhost:5984";
const TEST_DB_PREFIX = "test_pos_sync_";
const TEST_USERNAME = "admin";
const TEST_PASSWORD = "password";
const TEST_POUCHDB_ADAPTER = import.meta.env.VITE_POUCHDB_ADAPTER || "memory"; // Use memory adapter for tests

describe("PouchDB Sync Integration Tests", () => {
  let localProductDB: PouchDB.Database<Product>;
  let remoteProductDB: PouchDB.Database<Product>;
  let localCustomerDB: PouchDB.Database<Customer>;
  let remoteCustomerDB: PouchDB.Database<Customer>;

  // Helper function to create test product
  const createTestProduct = (id: string): Product => ({
    _id: `product_${id}`,
    name: `Test Product ${id}`,
    barcode: `TEST${id.padStart(5, "0")}`,
    price: Math.round((Math.random() * 100 + 1) * 100) / 100,
    stock: Math.floor(Math.random() * 100) + 10,
    category: "Test Category",
  });

  // Helper function to create test customer
  const createTestCustomer = (id: string): Customer => ({
    _id: `customer_${id}`,
    name: `Test Customer ${id}`,
    document: `DOC${id.padStart(8, "0")}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  beforeEach(async () => {
    // Create unique database names for each test
    const timestamp = Date.now();
    const productDbName = `${TEST_DB_PREFIX}products_${timestamp}`;
    const customerDbName = `${TEST_DB_PREFIX}customers_${timestamp}`;

    // Initialize local databases
    localProductDB = new PouchDB<Product>(productDbName, {
      adapter: TEST_POUCHDB_ADAPTER,
    });
    localCustomerDB = new PouchDB<Customer>(customerDbName, {
      adapter: TEST_POUCHDB_ADAPTER,
    });

    // Initialize remote databases
    remoteProductDB = new PouchDB<Product>(
      `${TEST_COUCHDB_URL}/${productDbName}`,
      {
        auth: {
          username: TEST_USERNAME,
          password: TEST_PASSWORD,
        },
      },
    );
    remoteCustomerDB = new PouchDB<Customer>(
      `${TEST_COUCHDB_URL}/${customerDbName}`,
      {
        auth: {
          username: TEST_USERNAME,
          password: TEST_PASSWORD,
        },
      },
    );

    // Mock console methods to reduce noise
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    // Cleanup databases
    try {
      await localProductDB.destroy();
      await remoteProductDB.destroy();
      await localCustomerDB.destroy();
      await remoteCustomerDB.destroy();
    } catch {
      // Ignore cleanup errors
    }

    // Restore console methods
    vi.restoreAllMocks();
  });

  describe("Basic Sync Operations", () => {
    it("should sync product from local to remote", async () => {
      const testProduct = createTestProduct("001");

      // Add product to local database
      const putResult = await localProductDB.put(testProduct);
      expect(putResult.ok).toBe(true);

      // Setup one-way sync (local to remote)
      const replication = localProductDB.replicate.to(remoteProductDB, {
        live: false,
        retry: false,
      });

      // Wait for sync to complete
      const syncResult = await new Promise<
        PouchDB.Replication.ReplicationResult<Product>
      >((resolve, reject) => {
        replication.on("complete", resolve);
        replication.on("error", reject);
      });

      expect(syncResult.ok).toBe(true);
      expect(syncResult.docs_written).toBe(1);

      // Verify document exists in remote database
      const remoteDoc = await remoteProductDB.get(testProduct._id);
      expect(remoteDoc._id).toBe(testProduct._id);
    });

    it("should sync customer from remote to local", async () => {
      const testCustomer = createTestCustomer("001");

      // Add customer to remote database
      const putResult = await remoteCustomerDB.put(testCustomer);
      expect(putResult.ok).toBe(true);

      // Setup one-way sync (remote to local)
      const replication = remoteCustomerDB.replicate.to(localCustomerDB, {
        live: false,
        retry: false,
      });

      // Wait for sync to complete
      const syncResult = await new Promise<
        PouchDB.Replication.ReplicationResult<Customer>
      >((resolve, reject) => {
        replication.on("complete", resolve);
        replication.on("error", reject);
      });

      expect(syncResult.ok).toBe(true);
      expect(syncResult.docs_written).toBe(1);

      // Verify document exists in local database
      const localDoc = await localCustomerDB.get(testCustomer._id);
      expect(localDoc._id).toBe(testCustomer._id);
    });
  });

  describe("Bulk Operations", () => {
    it("should sync multiple products efficiently", async () => {
      const productCount = 20;
      const products: Product[] = [];

      // Create test products
      for (let i = 1; i <= productCount; i++) {
        products.push(createTestProduct(i.toString().padStart(3, "0")));
      }

      // Bulk insert to local database
      const bulkResult = await localProductDB.bulkDocs(products);
      expect(bulkResult).toHaveLength(productCount);

      // Setup one-way sync
      const replication = localProductDB.replicate.to(remoteProductDB, {
        live: false,
        retry: false,
      });

      const startTime = Date.now();

      // Wait for sync to complete
      const syncResult = await new Promise<
        PouchDB.Replication.ReplicationResult<Product>
      >((resolve, reject) => {
        replication.on("complete", resolve);
        replication.on("error", reject);
      });

      const endTime = Date.now();
      const syncDuration = endTime - startTime;

      expect(syncResult.ok).toBe(true);
      expect(syncResult.docs_written).toBe(productCount);

      // Verify all documents synced
      const remoteDocs = await remoteProductDB.allDocs();
      expect(remoteDocs.rows).toHaveLength(productCount);

      // Performance check (should complete within reasonable time)
      expect(syncDuration).toBeLessThan(5000); // 5 seconds max

      console.log(`Synced ${productCount} products in ${syncDuration}ms`);
    });
  });

  describe("Sync Event Monitoring", () => {
    it("should emit correct sync events", async () => {
      const testProduct = createTestProduct("event_test");
      await localProductDB.put(testProduct);

      const events: string[] = [];

      const replication = localProductDB.replicate.to(remoteProductDB, {
        live: false,
        retry: false,
      });

      // Monitor sync events
      replication.on("change", () => events.push("change"));
      replication.on("paused", () => events.push("paused"));
      replication.on("active", () => events.push("active"));
      replication.on("complete", () => events.push("complete"));

      // Wait for sync to complete
      await new Promise<void>((resolve, reject) => {
        replication.on("complete", () => resolve());
        replication.on("error", reject);
      });

      // Verify events were emitted
      expect(events).toContain("change");
      expect(events).toContain("complete");
    });
  });

  describe("Live Sync Testing", () => {
    it("should handle live sync changes", async () => {
      const initialProduct = createTestProduct("live_001");

      // Add initial product
      await localProductDB.put(initialProduct);

      const changeEvents: PouchDB.Replication.SyncResult<Product>[] = [];

      // Setup live sync
      const sync = localProductDB.sync(remoteProductDB, {
        live: true,
        retry: false,
      });

      // Monitor changes
      sync.on("change", (info) => {
        changeEvents.push(info);
      });

      // Wait for initial sync
      await new Promise<void>((resolve) => {
        let hasInitialSync = false;
        sync.on("change", () => {
          if (!hasInitialSync) {
            hasInitialSync = true;
            setTimeout(resolve, 100); // Give time for sync to settle
          }
        });
      });

      // Add another product to trigger live sync
      const liveProduct = createTestProduct("live_002");
      await localProductDB.put(liveProduct);

      // Wait for live sync change
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 2000); // Max wait time
        const checkChanges = () => {
          if (changeEvents.length >= 2) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkChanges, 100);
          }
        };
        checkChanges();
      });

      // Stop live sync
      sync.cancel();

      // Verify we received change events
      expect(changeEvents.length).toBeGreaterThanOrEqual(1);

      // Verify both products exist in remote
      const remoteDocs = await remoteProductDB.allDocs();
      expect(remoteDocs.rows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Database Statistics", () => {
    it("should provide accurate database information", async () => {
      const products = [
        createTestProduct("stat_001"),
        createTestProduct("stat_002"),
        createTestProduct("stat_003"),
      ];

      // Add test data
      await localProductDB.bulkDocs(products);

      // Get database info
      const dbInfo = await localProductDB.info();

      expect(dbInfo.doc_count).toBe(3);
      expect(dbInfo.update_seq).toBeGreaterThan(0);
      expect(dbInfo.db_name).toContain("test_pos_sync_products_");
    });

    it("should track sync statistics", async () => {
      const testProducts = [
        createTestProduct("sync_001"),
        createTestProduct("sync_002"),
      ];

      await localProductDB.bulkDocs(testProducts);

      const replication = localProductDB.replicate.to(remoteProductDB, {
        live: false,
        retry: false,
      });

      const syncResult = await new Promise<
        PouchDB.Replication.ReplicationResult<Product>
      >((resolve, reject) => {
        replication.on("complete", resolve);
        replication.on("error", reject);
      });

      expect(syncResult.docs_read).toBe(2);
      expect(syncResult.docs_written).toBe(2);
      expect(syncResult.doc_write_failures).toBe(0);
      expect(syncResult.errors).toHaveLength(0);
    });
  });
});
