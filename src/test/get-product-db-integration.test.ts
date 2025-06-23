import type { Product } from "@/product/product";
import { getProductDB, resetProductDB } from "@/db/product-db";
import { syncService } from "@/db/sync-service";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

// Mock environment variables for testing
const mockEnv = {
  VITE_ENABLE_SYNC: "true",
  VITE_COUCHDB_URL: "http://localhost:5984",
  VITE_COUCHDB_USERNAME: "admin",
  VITE_COUCHDB_PASSWORD: "password",
  VITE_POUCHDB_ADAPTER: "memory"
};

describe("getProductDB Integration Tests with SYNCING.md Compliance", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock environment variables
    Object.entries(mockEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
  });

  afterEach(async () => {
    // Clean up database and sync service
    syncService.stopAllSyncs();
    try {
      await resetProductDB();
    } catch {
      // Ignore cleanup errors
    }
  });

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

  describe("Database Initialization and Index Creation", () => {
    it("should initialize product database with proper configuration", async () => {
      const productDB = await getProductDB();

      // Verify database is created
      const info = await productDB.info();
      expect(info.db_name).toBe("products");

      // Test that we can add and retrieve a product
      const testProduct = createTestProduct("init_001", {
        name: "Initialization Test Product",
        barcode: "INIT001"
      });

      await productDB.put(testProduct);
      const retrieved = await productDB.get(testProduct._id);

      expect(retrieved.name).toBe("Initialization Test Product");
      expect(retrieved.barcode).toBe("INIT001");
    });

    it("should create barcode index for fast lookups as per SYNCING.md", async () => {
      const productDB = await getProductDB();

      // Add test products
      const products = Array.from({ length: 10 }, (_, i) =>
        createTestProduct(`idx_${i}`, {
          barcode: `IDX${String(i).padStart(3, '0')}`,
          name: `Index Test ${i}`
        })
      );

      await productDB.bulkDocs(products);

      // Wait for indexing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test barcode query using index
      const result = await productDB.find({
        selector: { barcode: "IDX005" },
        limit: 1
      });

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].name).toBe("Index Test 5");
      expect(result.docs[0].barcode).toBe("IDX005");
    });

    it("should create category index for product categorization", async () => {
      const productDB = await getProductDB();

      // Add products with different categories
      const products = [
        createTestProduct("cat_001", { category: "Medicines", name: "Medicine A" }),
        createTestProduct("cat_002", { category: "Medicines", name: "Medicine B" }),
        createTestProduct("cat_003", { category: "Supplies", name: "Supply A" })
      ];

      await productDB.bulkDocs(products);

      // Wait for indexing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Query by category
      const medicineResult = await productDB.find({
        selector: { category: "Medicines" },
        limit: 10
      });

      expect(medicineResult.docs).toHaveLength(2);
      expect(medicineResult.docs.every(doc => doc.category === "Medicines")).toBe(true);
    });

    it("should create name index for product search", async () => {
      const productDB = await getProductDB();

      const testProduct = createTestProduct("name_001", {
        name: "Unique Product Name Search Test"
      });

      await productDB.put(testProduct);

      // Wait for indexing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test name-based search
      const result = await productDB.find({
        selector: { name: "Unique Product Name Search Test" },
        limit: 1
      });

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].name).toBe("Unique Product Name Search Test");
    });
  });

  describe("Sync Service Integration", () => {
    it("should initialize sync according to SYNCING.md specifications", async () => {
      const productDB = await getProductDB();

      // Verify sync service is aware of the database
      const syncStatus = syncService.getSyncStatus(productDB, `${mockEnv.VITE_COUCHDB_URL}/products`);
      expect(typeof syncStatus).toBe("boolean");

      // Test that products can be added (ready for sync)
      const syncProduct = createTestProduct("sync_001", {
        name: "Sync Ready Product",
        barcode: "SYNC001"
      });

      await productDB.put(syncProduct);
      const saved = await productDB.get(syncProduct._id);

      expect(saved.name).toBe("Sync Ready Product");
      expect(saved.barcode).toBe("SYNC001");
    });
  });

  describe("Product Fields According to SYNCING.md", () => {
    it("should handle all product detail fields that use 'remote wins' strategy", async () => {
      const productDB = await getProductDB();

      // Test product with all fields mentioned in SYNCING.md for remote wins strategy
      const productWithAllFields = createTestProduct("fields_001", {
        name: "Complete Product Name",
        price: 29.99,
        barcode: "FIELDS001",
        description: "Complete product description",
        prescriptionStatus: "PrescriptionOnly",
        activeIngredient: "Test Active Ingredient"
      });

      await productDB.put(productWithAllFields);
      const saved = await productDB.get(productWithAllFields._id);

      // Verify all remote-wins fields are properly stored
      expect(saved.name).toBe("Complete Product Name");
      expect(saved.price).toBe(29.99);
      expect(saved.barcode).toBe("FIELDS001");
      expect(saved.description).toBe("Complete product description");
      expect(saved.prescriptionStatus).toBe("PrescriptionOnly");
      expect(saved.activeIngredient).toBe("Test Active Ingredient");
    });

    it("should handle stock levels for order sync completion strategy", async () => {
      const productDB = await getProductDB();

      // Test stock level tracking (mentioned in SYNCING.md as deferred to order sync)
      const stockProduct = createTestProduct("stock_001", {
        name: "Stock Tracking Product",
        stock: 150,
        barcode: "STOCK001"
      });

      await productDB.put(stockProduct);
      const saved = await productDB.get(stockProduct._id);

      // Simulate stock change (local sale)
      const updatedProduct = { ...saved, stock: 145 }; // Sold 5 units
      await productDB.put(updatedProduct);

      const updated = await productDB.get(stockProduct._id);
      expect(updated.stock).toBe(145);

      // According to SYNCING.md, final stock reconciliation happens after order sync
      // This test verifies local stock changes are tracked correctly
    });

    it("should handle all prescription status types correctly", async () => {
      const productDB = await getProductDB();

      // Test all prescription status types as defined in Product interface
      const prescriptionProducts = [
        createTestProduct("rx_otc", {
          name: "OTC Medicine",
          prescriptionStatus: "OTC",
          activeIngredient: "Acetaminophen"
        }),
        createTestProduct("rx_prescription", {
          name: "Prescription Medicine",
          prescriptionStatus: "PrescriptionOnly",
          activeIngredient: "Amoxicillin"
        }),
        createTestProduct("rx_controlled", {
          name: "Controlled Substance",
          prescriptionStatus: "Controlled",
          activeIngredient: "Hydrocodone"
        })
      ];

      await productDB.bulkDocs(prescriptionProducts);

      // Verify all prescription types are saved correctly
      for (const product of prescriptionProducts) {
        const saved = await productDB.get(product._id);
        expect(saved.prescriptionStatus).toBe(product.prescriptionStatus);
        expect(saved.activeIngredient).toBe(product.activeIngredient);
      }

      // Test querying by prescription status
      const otcResult = await productDB.find({
        selector: { prescriptionStatus: "OTC" },
        limit: 10
      });

      expect(otcResult.docs).toHaveLength(1);
      expect(otcResult.docs[0].name).toBe("OTC Medicine");
    });
  });

  describe("Performance and Real-time Sync Requirements", () => {
    it("should handle rapid product additions for real-time scenarios", async () => {
      const productDB = await getProductDB();

      // According to SYNCING.md: "Frequency: Real-time with live sync enabled"
      const realTimeProducts = Array.from({ length: 20 }, (_, i) =>
        createTestProduct(`rt_${i}`, {
          name: `Real-time Product ${i}`,
          barcode: `RT${String(i).padStart(3, '0')}`
        })
      );

      const startTime = Date.now();

      // Add products rapidly
      for (const product of realTimeProducts) {
        await productDB.put(product);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all products were added
      const allProducts = await productDB.allDocs({ include_docs: true });
      const rtProducts = allProducts.rows.filter(row =>
        row.doc && row.doc.name && row.doc.name.startsWith("Real-time Product")
      );

      expect(rtProducts).toHaveLength(20);
      expect(duration).toBeLessThan(2000); // Should be reasonably fast
    });

    it("should provide efficient barcode lookup performance", async () => {
      const productDB = await getProductDB();

      // Add a larger dataset to test index performance
      const products = Array.from({ length: 100 }, (_, i) =>
        createTestProduct(`perf_${i}`, {
          barcode: `PERF${String(i).padStart(4, '0')}`,
          name: `Performance Test Product ${i}`
        })
      );

      await productDB.bulkDocs(products);

      // Wait for indexing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Test lookup performance
      const lookupTests = [
        "PERF0025", "PERF0050", "PERF0075", "PERF0099"
      ];

      for (const barcode of lookupTests) {
        const startTime = Date.now();
        const result = await productDB.find({
          selector: { barcode },
          limit: 1
        });
        const queryTime = Date.now() - startTime;

        expect(result.docs).toHaveLength(1);
        expect(result.docs[0].barcode).toBe(barcode);
        expect(queryTime).toBeLessThan(100); // Should be fast with index
      }
    });
  });

  describe("Error Handling and Offline Support", () => {
    it("should maintain local functionality regardless of sync status", async () => {
      const productDB = await getProductDB();

      // Test that local operations work even if sync might fail
      const offlineProduct = createTestProduct("offline_001", {
        name: "Offline Test Product",
        barcode: "OFFLINE001",
        price: 15.99
      });

      await productDB.put(offlineProduct);

      // Verify product is stored locally
      const saved = await productDB.get(offlineProduct._id);
      expect(saved.name).toBe("Offline Test Product");
      expect(saved.barcode).toBe("OFFLINE001");
      expect(saved.price).toBe(15.99);

      // Test local updates work
      saved.price = 18.99;
      await productDB.put(saved);

      const updated = await productDB.get(offlineProduct._id);
      expect(updated.price).toBe(18.99);
    });

    it("should support bulk operations for large product catalogs", async () => {
      const productDB = await getProductDB();

      // Test bulk operations as mentioned in SYNCING.md performance considerations
      const bulkProducts = Array.from({ length: 50 }, (_, i) =>
        createTestProduct(`bulk_${i}`, {
          name: `Bulk Product ${i}`,
          barcode: `BULK${String(i).padStart(3, '0')}`,
          category: i % 3 === 0 ? "Category A" : "Category B"
        })
      );

      const startTime = Date.now();
      const result = await productDB.bulkDocs(bulkProducts);
      const bulkTime = Date.now() - startTime;

      expect(result).toHaveLength(50);
      expect(result.every(res => !('error' in res))).toBe(true); // Check no errors occurred
      expect(bulkTime).toBeLessThan(1000); // Should be efficient

      // Verify products can be queried
      const categoryAResult = await productDB.find({
        selector: { category: "Category A" },
        limit: 20
      });

      expect(categoryAResult.docs.length).toBeGreaterThan(0);
      expect(categoryAResult.docs.every(doc => doc.category === "Category A")).toBe(true);
    });
  });

  describe("Database Singleton Pattern", () => {
    it("should return the same database instance on multiple calls", async () => {
      const db1 = await getProductDB();
      const db2 = await getProductDB();

      // Should be the same instance
      expect(db1).toBe(db2);

      // Test that operations on both references affect the same database
      const testProduct = createTestProduct("singleton_001", {
        name: "Singleton Test Product"
      });

      await db1.put(testProduct);
      const retrieved = await db2.get(testProduct._id);

      expect(retrieved.name).toBe("Singleton Test Product");
    });

    it("should properly reset database when requested", async () => {
      const db1 = await getProductDB();

      // Add a test product
      const testProduct = createTestProduct("reset_001", {
        name: "Reset Test Product"
      });
      await db1.put(testProduct);

      // Verify product exists
      const saved = await db1.get(testProduct._id);
      expect(saved.name).toBe("Reset Test Product");

      // Reset database
      await resetProductDB();

      // Get new database instance
      const db2 = await getProductDB();

      // Verify product no longer exists
      await expect(db2.get(testProduct._id)).rejects.toThrow();
    });
  });
});
