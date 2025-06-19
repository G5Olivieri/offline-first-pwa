# Analytics System Documentation

## Overview

The POS Frontend application includes a comprehensive, abstract analytics system designed to track user actions, system events, and business metrics. The system is provider-agnostic and currently implements console-based logging for development and debugging purposes.

## Architecture

### Core Components

1. **Analytics Types** (`src/types/analytics.ts`)
   - Defines TypeScript interfaces for events, providers, and configuration
   - Provides type safety for all analytics operations

2. **Analytics Service** (`src/services/analytics-service.ts`)
   - Main service class that manages event collection and processing
   - Handles batching, queuing, and provider management
   - Provides specialized tracking methods for different event types

3. **Console Analytics Provider** (`src/services/console-analytics-provider.ts`)
   - Development-friendly provider that outputs formatted analytics to console
   - Provides rich, colored console output with event details

4. **Analytics Composable** (`src/composables/use-analytics.ts`)
   - Vue 3 composable for easy integration with components
   - Includes POS-specific tracking methods
   - Handles automatic page view tracking

5. **Analytics Configuration** (`src/config/analytics.ts`)
   - Centralized configuration and initialization
   - Sets up providers and global settings

## Event Categories

The system tracks events across several categories:

- **USER_ACTION**: User interactions (clicks, form submissions, navigation)
- **SYSTEM**: System events (app initialization, sessions, authentication)
- **ERROR**: Error tracking and debugging information
- **PERFORMANCE**: Performance metrics and timing data
- **BUSINESS**: Business-specific events (orders, products, sales)
- **NAVIGATION**: Page views and navigation tracking

## Usage Examples

### Basic Event Tracking

```typescript
import { useAnalytics } from '@/composables/use-analytics';

const analytics = useAnalytics();

// Track a user action
analytics.trackAction({
  action: 'button_click',
  category: 'ui_interaction',
  label: 'checkout_button',
  value: 1,
  metadata: {
    page: 'cart',
    orderTotal: 99.99,
  },
});
```

### Product Tracking

```typescript
// Track product scanning
analytics.trackProductScan('1234567890', 'Product Name');

// Track product addition to cart
analytics.trackProductAdd({
  productId: 'prod-123',
  productName: 'Sample Product',
  price: 29.99,
  category: 'electronics',
  barcode: '1234567890',
});
```

### Order Tracking

```typescript
// Track order completion
analytics.trackOrderComplete({
  orderId: 'order-456',
  customerId: 'customer-789',
  operatorId: 'operator-123',
  total: 199.99,
  itemCount: 3,
  paymentMethod: 'card',
});

// Track order abandonment
analytics.trackOrderAbandon({
  orderId: 'order-456',
  total: 199.99,
  itemCount: 3,
});
```

### Error Tracking

```typescript
// Track errors with context
analytics.trackError({
  errorType: 'validation_error',
  errorMessage: 'Invalid barcode format',
  stackTrace: error.stack,
  context: {
    component: 'product-scanner',
    barcode: userInput,
  },
});
```

### Form Tracking

```typescript
// Track form submissions
analytics.trackFormSubmit('product_creation_form', true);

// Track form submission with errors
analytics.trackFormSubmit('product_creation_form', false, [
  'Name is required',
  'Invalid price format',
]);
```

### UI Interaction Tracking

```typescript
// Track button clicks
analytics.trackButtonClick('save_product', {
  section: 'product_form',
  productCategory: 'medications',
});

// Track dialog interactions
analytics.trackDialogOpen('help_dialog');
analytics.trackDialogClose('help_dialog', 'confirmed');
```

## Configuration

### Environment-based Setup

The analytics system is initialized in `src/main.ts` and configured based on environment variables:

```typescript
// Development: Verbose console logging enabled
// Production: Console logging disabled, ready for other providers

initializeAnalytics();
```

### Provider Configuration

```typescript
// Add custom providers
analytics.addProvider(new CustomAnalyticsProvider());

// Configure service settings
analytics.configure({
  enabled: true,
  debug: false,
  batchSize: 50,
  flushInterval: 10000, // 10 seconds
});
```

## Console Output Examples

When running in development mode, you'll see formatted console output like:

```
🎯 USER_ACTION: button_click
📅 Timestamp: 2025-06-18T10:30:45.123Z
🔗 Session ID: session_1718708245123_abc123def
📋 Properties: {
  category: "ui_interaction",
  label: "checkout_button",
  page: "cart"
}
🌐 Context: {
  device: { type: "desktop" },
  viewport: { width: 1920, height: 1080 }
}
```

```
🎯 BUSINESS: product_added_to_cart
📅 Timestamp: 2025-06-18T10:31:02.456Z
👤 User ID: operator-123
📋 Properties: {
  productId: "prod-456",
  productName: "Acetaminophen 500mg",
  category: "medications",
  price: 12.99,
  barcode: "1234567890123"
}
```

## Extending the System

### Adding New Providers

To add support for external analytics services (Google Analytics, Mixpanel, etc.):

1. Implement the `AnalyticsProvider` interface:

```typescript
export class CustomAnalyticsProvider implements AnalyticsProvider {
  public readonly name = 'custom-provider';

  track(event: AnalyticsEvent): void {
    // Send event to external service
  }

  identify(userId: string, properties?: Record<string, any>): void {
    // Identify user in external service
  }

  page(name: string, properties?: Record<string, any>): void {
    // Track page view in external service
  }
}
```

2. Add the provider during initialization:

```typescript
import { CustomAnalyticsProvider } from './custom-analytics-provider';

const customProvider = new CustomAnalyticsProvider();
analytics.addProvider(customProvider);
```

### Custom Event Types

Add specialized event types by extending the existing interfaces:

```typescript
// Define custom event interface
interface InventoryEvent {
  productId: string;
  previousStock: number;
  newStock: number;
  reason: 'sale' | 'restock' | 'adjustment';
}

// Create tracking method
const trackInventoryChange = (inventory: InventoryEvent) => {
  analytics.track({
    name: 'inventory_changed',
    category: AnalyticsCategory.BUSINESS,
    properties: {
      productId: inventory.productId,
      previousStock: inventory.previousStock,
      newStock: inventory.newStock,
      reason: inventory.reason,
    },
  });
};
```

## Performance Considerations

- **Batching**: Events are queued and sent in batches to reduce performance impact
- **Async Processing**: All analytics operations are non-blocking
- **Error Isolation**: Provider failures don't affect app functionality
- **Memory Management**: Automatic queue management prevents memory leaks

## Privacy and Data

- **No Personal Data**: System tracks actions and metrics, not personal information
- **Configurable**: Can be completely disabled via configuration
- **Local Storage**: Console provider keeps all data local
- **GDPR Ready**: Designed with privacy regulations in mind

## Testing

The analytics system includes comprehensive unit tests covering:

- Event tracking and enrichment
- Provider management
- Batch processing
- Error handling
- Configuration management

Run tests with:
```bash
npm test -- src/services/__tests__/analytics-service.test.ts
```

## Current Implementation Status

✅ **Implemented:**
- Abstract analytics architecture
- Console analytics provider
- Vue 3 composable integration
- Comprehensive event types
- Batch processing and queuing
- Error handling and isolation
- Unit test coverage
- Integration with main POS components

🔄 **Ready for Extension:**
- Google Analytics 4 provider
- Mixpanel provider
- Custom dashboard provider
- Real-time analytics streaming
- Data export capabilities

This analytics system provides a solid foundation for understanding user behavior and system performance while maintaining flexibility for future analytics platform integrations.
