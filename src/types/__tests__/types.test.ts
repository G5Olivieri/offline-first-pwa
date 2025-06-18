import { describe, it, expect } from 'vitest';
import type { Product } from '../product';
import type { Order, Item } from '../order';
import { OrderStatus } from '../order';
import type { Operator } from '../operator';

describe('Type Definitions', () => {
  describe('Product Type', () => {
    it('should have correct structure', () => {
      const product: Product = createMockProduct();

      expect(product).toHaveProperty('_id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('barcode');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('stock');

      expect(typeof product._id).toBe('string');
      expect(typeof product.name).toBe('string');
      expect(typeof product.barcode).toBe('string');
      expect(typeof product.price).toBe('number');
      expect(typeof product.stock).toBe('number');
    });

    it('should have optional properties', () => {
      const minimalProduct: Product = {
        _id: 'test-id',
        name: 'Test Product',
        barcode: '123456789',
        price: 10.99,
        stock: 100
      };

      expect(minimalProduct).toBeDefined();
      expect(minimalProduct.category).toBeUndefined();
      expect(minimalProduct.tags).toBeUndefined();
      expect(minimalProduct.description).toBeUndefined();
    });
  });

  describe('Order Type', () => {
    it('should have correct structure', () => {
      const order: Order = createMockOrder();

      expect(order).toHaveProperty('_id');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('total');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('createdAt');
      expect(order).toHaveProperty('updatedAt');

      expect(typeof order._id).toBe('string');
      expect(Array.isArray(order.items)).toBe(true);
      expect(typeof order.total).toBe('number');
      expect(Object.values(OrderStatus)).toContain(order.status);
      expect(typeof order.created_at).toBe('string');
      expect(typeof order.updated_at).toBe('string');
    });

    it('should have valid Item structure', () => {
      const order: Order = createMockOrder();
      const item: Item = order.items[0];

      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('product');
      expect(typeof item.quantity).toBe('number');
      expect(typeof item.product).toBe('object');
      expect(item.product).toHaveProperty('_id');
    });
  });

  describe('Operator Type', () => {
    it('should have correct structure', () => {
      const operator: Operator = createMockOperator();

      expect(operator).toHaveProperty('_id');
      expect(operator).toHaveProperty('name');

      expect(typeof operator._id).toBe('string');
      expect(typeof operator.name).toBe('string');
    });

    it('should have optional revision field', () => {
      const operator: Operator = {
        _id: 'test-operator',
        name: 'Test Operator'
      };

      expect(operator).toBeDefined();
      expect(operator._rev).toBeUndefined();
    });
  });
});
