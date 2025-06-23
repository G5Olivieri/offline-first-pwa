import type { Product } from "@/product/product";
import { getProductDB, resetProductDB } from "@/db/product-db";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

describe("Debug Product DB Test", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock environment variables for testing
    vi.stubEnv("VITE_ENABLE_SYNC", "true");
    vi.stubEnv("VITE_COUCHDB_URL", "http://localhost:5984");
    vi.stubEnv("VITE_POUCHDB_ADAPTER", "memory");
  });

  afterEach(async () => {
    try {
      await resetProductDB();
    } catch {
      // Ignore cleanup errors
    }
  });

  const createTestProduct = (id: string): Product => ({
    _id: `product_${id}`,
    name: `Test Product ${id}`,
    barcode: `TEST${id.padStart(5, "0")}`,
    price: 29.99,
    stock: 100,
    category: "Test Category",
    description: `Description for Test Product ${id}`,
    prescriptionStatus: 'OTC',
    activeIngredient: "Test Ingredient",
  });

  it("should initialize product database - DEBUG VERSION", async () => {
    // Set a breakpoint on the next line to start debugging
    console.log("Starting debug test");

    // This line will call getProductDB - step into it
    const productDB = await getProductDB();

    // Verify database is created
    const info = await productDB.info();
    console.log("Database info:", info);

    expect(info.db_name).toBe("products");

    // Test adding a product
    const testProduct = createTestProduct("debug_001");
    console.log("Created test product:", testProduct);

    // Set breakpoint here to examine the product before saving
    await productDB.put(testProduct);

    // Set breakpoint here to examine after saving
    const retrieved = await productDB.get(testProduct._id);
    console.log("Retrieved product:", retrieved);

    expect(retrieved.name).toBe("Test Product debug_001");
    expect(retrieved.barcode).toBe("TEST00001");
  });

  it("should create and query indexes - DEBUG VERSION", async () => {
    console.log("Testing index creation and querying");

    const productDB = await getProductDB();

    // Add a test product
    const testProduct = createTestProduct("index_001");
    await productDB.put(testProduct);

    // Wait for indexing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test barcode query - set breakpoint to examine the query
    const result = await productDB.find({
      selector: { barcode: "TEST00001" },
      limit: 1
    });

    console.log("Query result:", result);

    expect(result.docs).toHaveLength(1);
    expect(result.docs[0].name).toBe("Test Product index_001");
  });
});
