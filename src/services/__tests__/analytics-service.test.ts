import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnalyticsService } from '../analytics-service';
import { ConsoleAnalyticsProvider } from '../console-analytics-provider';
import { AnalyticsCategory } from '../../types/analytics';
import type { AnalyticsProvider, AnalyticsEvent } from '../../types/analytics';

// Mock logger service
vi.mock('../logger-service', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('AnalyticsService', () => {
  let analytics: AnalyticsService;
  let mockProvider: AnalyticsProvider;

  beforeEach(() => {
    // Create mock provider
    mockProvider = {
      name: 'test-provider',
      track: vi.fn(),
      identify: vi.fn(),
      page: vi.fn(),
      flush: vi.fn(),
      configure: vi.fn(),
    };

    // Create analytics service instance
    analytics = new AnalyticsService({
      enabled: true,
      debug: true,
      batchSize: 5,
      flushInterval: 100,
      providers: [mockProvider],
    });
  });

  afterEach(() => {
    analytics.destroy();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const defaultAnalytics = new AnalyticsService();
      expect(defaultAnalytics.isEnabled).toBe(true);
      expect(defaultAnalytics.queueLength).toBe(0);
      expect(defaultAnalytics.currentSessionId).toBeTruthy();
      defaultAnalytics.destroy();
    });

    it('should generate unique session IDs', () => {
      const analytics1 = new AnalyticsService();
      const analytics2 = new AnalyticsService();

      expect(analytics1.currentSessionId).not.toBe(analytics2.currentSessionId);

      analytics1.destroy();
      analytics2.destroy();
    });
  });

  describe('provider management', () => {
    it('should add providers', () => {
      const newProvider: AnalyticsProvider = {
        name: 'new-provider',
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
      };

      analytics.addProvider(newProvider);

      // Track an event to verify provider was added
      analytics.track({
        name: 'test_event',
        category: AnalyticsCategory.USER_ACTION,
      });

      analytics.flush();

      expect(newProvider.track).toHaveBeenCalled();
    });

    it('should remove providers', () => {
      analytics.removeProvider('test-provider');

      analytics.track({
        name: 'test_event',
        category: AnalyticsCategory.USER_ACTION,
      });

      analytics.flush();

      expect(mockProvider.track).not.toHaveBeenCalled();
    });
  });

  describe('event tracking', () => {
    it('should track basic events', () => {
      const eventData = {
        name: 'test_event',
        category: AnalyticsCategory.USER_ACTION,
        properties: {
          key: 'value',
          number: 123,
          boolean: true,
        },
      };

      analytics.track(eventData);
      expect(analytics.queueLength).toBe(1);
    });

    it('should enrich events with session data', () => {
      analytics.track({
        name: 'test_event',
        category: AnalyticsCategory.USER_ACTION,
      });

      analytics.flush();

      expect(mockProvider.track).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test_event',
          category: AnalyticsCategory.USER_ACTION,
          timestamp: expect.any(Number),
          sessionId: expect.any(String),
          context: expect.any(Object),
        })
      );
    });

    it('should not track when disabled', () => {
      const disabledAnalytics = new AnalyticsService({ enabled: false });

      disabledAnalytics.track({
        name: 'test_event',
        category: AnalyticsCategory.USER_ACTION,
      });

      expect(disabledAnalytics.queueLength).toBe(0);
      disabledAnalytics.destroy();
    });
  });

  describe('specialized tracking methods', () => {
    it('should track user actions', () => {
      analytics.trackUserAction({
        action: 'button_click',
        category: 'ui',
        label: 'submit_button',
        value: 1,
        metadata: {
          page: 'checkout',
        },
      });

      expect(analytics.queueLength).toBe(1);
    });

    it('should track product events', () => {
      analytics.trackProduct('product_viewed', {
        productId: 'prod-123',
        productName: 'Test Product',
        category: 'electronics',
        price: 99.99,
        barcode: '1234567890',
      });

      expect(analytics.queueLength).toBe(1);
    });

    it('should track order events', () => {
      analytics.trackOrder('order_completed', {
        orderId: 'order-123',
        customerId: 'customer-456',
        operatorId: 'operator-789',
        total: 199.99,
        itemCount: 3,
        paymentMethod: 'card',
      });

      expect(analytics.queueLength).toBe(1);
    });

    it('should track navigation events', () => {
      analytics.trackNavigation({
        from: 'home',
        to: 'products',
        duration: 1500,
      });

      expect(analytics.queueLength).toBe(1);
    });

    it('should track errors', () => {
      analytics.trackError({
        errorType: 'validation_error',
        errorMessage: 'Invalid input',
        stackTrace: 'Error stack trace',
        context: {
          component: 'product-form',
        },
      });

      expect(analytics.queueLength).toBe(1);
    });

    it('should track performance metrics', () => {
      analytics.trackPerformance({
        metric: 'page_load_time',
        value: 1250,
        unit: 'ms',
        context: {
          page: 'products',
        },
      });

      expect(analytics.queueLength).toBe(1);
    });
  });

  describe('batch processing', () => {
    it('should auto-flush on batch size', () => {
      // Track more events than batch size
      for (let i = 0; i < 6; i++) {
        analytics.track({
          name: `event_${i}`,
          category: AnalyticsCategory.USER_ACTION,
        });
      }

      // Should have auto-flushed after 5 events
      expect(mockProvider.track).toHaveBeenCalledTimes(5);
      expect(analytics.queueLength).toBe(1);
    });

    it('should immediately flush error events', () => {
      analytics.track({
        name: 'critical_error',
        category: AnalyticsCategory.ERROR,
      });

      expect(mockProvider.track).toHaveBeenCalledTimes(1);
      expect(analytics.queueLength).toBe(0);
    });

    it('should handle provider errors gracefully', () => {
      const errorProvider: AnalyticsProvider = {
        name: 'error-provider',
        track: vi.fn().mockRejectedValue(new Error('Provider error')),
        identify: vi.fn(),
        page: vi.fn(),
      };

      analytics.addProvider(errorProvider);

      analytics.track({
        name: 'test_event',
        category: AnalyticsCategory.USER_ACTION,
      });

      analytics.flush();

      // Should not throw, both providers should be called
      expect(mockProvider.track).toHaveBeenCalled();
      expect(errorProvider.track).toHaveBeenCalled();
    });
  });

  describe('user identification', () => {
    it('should identify users', () => {
      analytics.identify('user-123', {
        name: 'John Doe',
        role: 'admin',
      });

      expect(mockProvider.identify).toHaveBeenCalledWith('user-123', {
        name: 'John Doe',
        role: 'admin',
      });
    });

    it('should track identification events', () => {
      analytics.identify('user-123');
      expect(analytics.queueLength).toBe(1);
    });
  });

  describe('page tracking', () => {
    it('should track page views', () => {
      analytics.page('products', {
        category: 'catalog',
        items: 25,
      });

      expect(mockProvider.page).toHaveBeenCalledWith('products', {
        category: 'catalog',
        items: 25,
      });
    });

    it('should track page view events', () => {
      analytics.page('checkout');
      expect(analytics.queueLength).toBe(1);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      analytics.configure({
        debug: false,
        batchSize: 10,
      });

      expect(mockProvider.configure).toHaveBeenCalledWith({
        debug: false,
        batchSize: 10,
      });
    });
  });

  describe('session management', () => {
    it('should start new sessions', () => {
      const oldSessionId = analytics.currentSessionId;

      analytics.startNewSession();

      expect(analytics.currentSessionId).not.toBe(oldSessionId);
      expect(analytics.queueLength).toBe(1); // session_started event
    });
  });
});

describe('ConsoleAnalyticsProvider', () => {
  let provider: ConsoleAnalyticsProvider;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let groupSpy: ReturnType<typeof vi.spyOn>;
  let groupEndSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    provider = new ConsoleAnalyticsProvider(true);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    groupSpy.mockRestore();
    groupEndSpy.mockRestore();
  });

  it('should track events to console', () => {
    const event: AnalyticsEvent = {
      name: 'test_event',
      category: AnalyticsCategory.USER_ACTION,
      properties: {
        key: 'value',
      },
      timestamp: Date.now(),
      sessionId: 'session-123',
    };

    provider.track(event);

    expect(groupSpy).toHaveBeenCalledWith('🎯 USER_ACTION: test_event');
    expect(consoleSpy).toHaveBeenCalledWith('📅 Timestamp:', expect.any(String));
    expect(consoleSpy).toHaveBeenCalledWith('🔗 Session ID:', 'session-123');
    expect(consoleSpy).toHaveBeenCalledWith('📋 Properties:', { key: 'value' });
    expect(groupEndSpy).toHaveBeenCalled();
  });

  it('should identify users', () => {
    provider.identify('user-123', { role: 'admin' });

    expect(groupSpy).toHaveBeenCalledWith('🆔 User Identification');
    expect(consoleSpy).toHaveBeenCalledWith('👤 User ID:', 'user-123');
    expect(consoleSpy).toHaveBeenCalledWith('📋 Properties:', { role: 'admin' });
    expect(groupEndSpy).toHaveBeenCalled();
  });

  it('should track page views', () => {
    provider.page('products', { category: 'catalog' });

    expect(groupSpy).toHaveBeenCalledWith('📄 Page View');
    expect(consoleSpy).toHaveBeenCalledWith('🏠 Page:', 'products');
    expect(consoleSpy).toHaveBeenCalledWith('📋 Properties:', { category: 'catalog' });
    expect(groupEndSpy).toHaveBeenCalled();
  });

  it('should configure debug mode', () => {
    provider.configure({ debug: false });

    // Provider should still work but with different debug behavior
    const event: AnalyticsEvent = {
      name: 'test_event',
      category: AnalyticsCategory.USER_ACTION,
      timestamp: Date.now(),
      sessionId: 'session-123',
    };

    provider.track(event);
    expect(groupSpy).toHaveBeenCalled();
  });
});
