import PouchDB from 'pouchdb-browser';
import PouchDBMemoryAdapter from 'pouchdb-adapter-memory';
import PouchDBFind from 'pouchdb-find';
import type { Product } from '../types/product';
import type { Order } from '../types/order';
import { OrderStatus } from '../types/order';
import type { Operator } from '../types/operator';

// Ensure plugins are loaded
PouchDB.plugin(PouchDBMemoryAdapter);
PouchDB.plugin(PouchDBFind);

export class TestDatabaseManager {
  private databases: Map<string, PouchDB.Database<Record<string, unknown>>> = new Map();

  createTestDB<T extends Record<string, unknown> = Record<string, unknown>>(name: string): PouchDB.Database<T> {
    const dbName = `test-${name}-${Date.now()}-${Math.random()}`;
    const db = new PouchDB<T>(dbName, { adapter: 'memory' });
    this.databases.set(dbName, db);
    return db;
  }

  async setupProductDB(): Promise<PouchDB.Database<Product>> {
    const db = this.createTestDB<Product>('products');
    await db.createIndex({
      index: { fields: ['barcode'] },
    });
    await db.createIndex({
      index: { fields: ['name'] },
    });
    return db;
  }

  async setupOrderDB(): Promise<PouchDB.Database<Order>> {
    const db = this.createTestDB<Order>('orders');
    await db.createIndex({
      index: { fields: ['status'] },
    });
    await db.createIndex({
      index: { fields: ['operator_id'] },
    });
    return db;
  }

  async setupOperatorDB(): Promise<PouchDB.Database<Operator>> {
    const db = this.createTestDB<Operator>('operators');
    await db.createIndex({
      index: { fields: ['name'] },
    });
    return db;
  }

  async seedProducts(db: PouchDB.Database<Product>, count = 5): Promise<Product[]> {
    const products: Product[] = [];
    for (let i = 1; i <= count; i++) {
      const product = createMockProduct({
        _id: `product-${i}`,
        name: `Test Product ${i}`,
        barcode: `123456789012${i}`,
        price: 10.99 + i,
        stock: 100 - i * 10,
      });
      products.push(product);
    }
    await db.bulkDocs(products);
    return products;
  }

  async seedOrders(db: PouchDB.Database<Order>, products: Product[], count = 3): Promise<Order[]> {
    const orders: Order[] = [];
    for (let i = 1; i <= count; i++) {
      const order = createMockOrder({
        _id: `order-${i}`,
        items: [
          {
            quantity: i,
            product: products[0],
          },
        ],
        total: products[0].price * i,
        status: i % 2 === 0 ? OrderStatus.COMPLETED : OrderStatus.PENDING,
        terminal_id: `TEST-TERMINAL-${String(i).padStart(3, '0')}`,
      });
      orders.push(order);
    }
    await db.bulkDocs(orders);
    return orders;
  }

  async seedOperators(db: PouchDB.Database<Operator>, count = 2): Promise<Operator[]> {
    const operators: Operator[] = [];
    for (let i = 1; i <= count; i++) {
      const operator = createMockOperator({
        _id: `operator-${i}`,
        name: `Test Operator ${i}`,
      });
      operators.push(operator);
    }
    await db.bulkDocs(operators);
    return operators;
  }

  async cleanup(): Promise<void> {
    const destroyPromises = Array.from(this.databases.values()).map(db => db.destroy());
    await Promise.all(destroyPromises);
    this.databases.clear();
  }
}

export const createTestDatabaseManager = () => new TestDatabaseManager();
