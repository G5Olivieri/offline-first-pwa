import { vi } from 'vitest';
import PouchDB from 'pouchdb-browser';
import PouchDBMemoryAdapter from 'pouchdb-adapter-memory';
import type { Product } from '../types/product';
import type { Order } from '../types/order';
import { OrderStatus } from '../types/order';
import type { Operator } from '../types/operator';

// Add memory adapter for testing
PouchDB.plugin(PouchDBMemoryAdapter);

// Mock navigator.onLine for offline/online tests
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock service worker registration
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn(() => Promise.resolve({})),
    ready: Promise.resolve({}),
  },
  writable: true,
});

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock performance.now() for timing tests
Object.defineProperty(performance, 'now', {
  value: vi.fn(() => Date.now()),
  writable: true,
});

// Global test utilities
(globalThis as any).createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  _id: 'test-product-1',
  name: 'Test Product',
  barcode: '1234567890123',
  price: 10.99,
  stock: 100,
  category: 'Test Category',
  tags: ['test'],
  description: 'A test product',
  ...overrides
});

(globalThis as any).createMockCustomer = (overrides: Record<string, any> = {}) => ({
  _id: 'test-customer-1',
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '+1234567890',
  address: '123 Test St',
  ...overrides
});

(globalThis as any).createMockOperator = (overrides: Partial<Operator> = {}): Operator => ({
  _id: 'test-operator-1',
  name: 'Test Operator',
  ...overrides
});

(globalThis as any).createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  _id: 'test-order-1',
  items: [
    {
      quantity: 2,
      product: createMockProduct()
    }
  ],
  total: 23.96,
  status: OrderStatus.COMPLETED,
  terminal_id: 'TEST-TERMINAL-001',
  operator_id: 'test-operator-1',
  customer_id: 'test-customer-1',
  payment_method: 'card',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});
