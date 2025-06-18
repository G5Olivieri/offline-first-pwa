import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabaseManager } from '../../test/db-utils';
import type { Product } from '../../types/product';

describe('Product Store Integration', () => {
  let testDbManager: ReturnType<typeof createTestDatabaseManager>;
  let productDB: PouchDB.Database<Product>;

  beforeEach(async () => {
    testDbManager = createTestDatabaseManager();
    productDB = await testDbManager.setupProductDB();
  });

  afterEach(async () => {
    await testDbManager.cleanup();
  });

  describe('Product Database Operations', () => {
    it('should create and find products by barcode', async () => {
      // Arrange
      const testProduct = createMockProduct({
        barcode: '1234567890123',
        name: 'Test Product'
      });
      await productDB.put(testProduct);

      // Act
      const result = await productDB.find({
        selector: { barcode: '1234567890123' },
        limit: 1,
      });

      // Assert
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].name).toBe('Test Product');
      expect(result.docs[0].barcode).toBe('1234567890123');
    });

    it('should return empty results when product is not found', async () => {
      // Act
      const result = await productDB.find({
        selector: { barcode: 'nonexistent' },
        limit: 1,
      });

      // Assert
      expect(result.docs).toHaveLength(0);
    });

    it('should update product stock', async () => {
      // Arrange
      const testProduct = createMockProduct({
        stock: 100
      });
      const response = await productDB.put(testProduct);

      // Act
      const updatedProduct = { ...testProduct, _rev: response.rev, stock: 150 };
      await productDB.put(updatedProduct);

      // Assert
      const result = await productDB.get(testProduct._id);
      expect(result.stock).toBe(150);
    });

    it('should handle bulk operations', async () => {
      // Arrange
      await testDbManager.seedProducts(productDB, 3);

      // Act
      const allProducts = await productDB.allDocs({ include_docs: true });

      // Assert
      expect(allProducts.rows).toHaveLength(3);
      expect(allProducts.rows.every(row => row.doc)).toBe(true);
    });
  });
});
