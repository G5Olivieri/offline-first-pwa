import { describe, it, expect } from "vitest";

describe("Test Environment Setup", () => {
  it("should have access to global test utilities", () => {
    expect(globalThis.createMockProduct).toBeDefined();
    expect(globalThis.createMockCustomer).toBeDefined();
    expect(globalThis.createMockOperator).toBeDefined();
    expect(globalThis.createMockOrder).toBeDefined();
  });

  it("should create mock product correctly", () => {
    const product = createMockProduct();
    expect(product).toHaveProperty("_id");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("barcode");
    expect(product).toHaveProperty("price");
    expect(product).toHaveProperty("stock");
  });

  it("should create mock order correctly", () => {
    const order = createMockOrder();
    expect(order).toHaveProperty("_id");
    expect(order).toHaveProperty("items");
    expect(order).toHaveProperty("total");
    expect(order).toHaveProperty("status");
  });

  it("should create mock operator correctly", () => {
    const operator = createMockOperator();
    expect(operator).toHaveProperty("_id");
    expect(operator).toHaveProperty("name");
  });

  it("should support mock overrides", () => {
    const customProduct = createMockProduct({
      name: "Custom Product",
      price: 99.99,
    });

    expect(customProduct.name).toBe("Custom Product");
    expect(customProduct.price).toBe(99.99);
    expect(customProduct._id).toBe("test-product-1"); // Default preserved
  });

  it("should have environment variables mocked", () => {
    expect(import.meta.env.VITE_APP_TITLE).toBe("POS Test");
    expect(import.meta.env.VITE_THEME_PRIMARY_COLOR).toBe("#3B82F6");
    expect(import.meta.env.VITE_SYNCING).toBe(false);
  });

  it("should have navigator mocked", () => {
    expect(navigator.onLine).toBeDefined();
    expect(navigator.serviceWorker).toBeDefined();
  });

  it("should have window methods mocked", () => {
    expect(window.matchMedia).toBeDefined();
    expect(performance.now).toBeDefined();
  });
});
