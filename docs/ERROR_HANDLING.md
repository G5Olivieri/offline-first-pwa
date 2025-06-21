# Error Handling Guide for POS System

This document outlines comprehensive error handling strategies, patterns, and best practices for the Vue.js PWA POS system.

## Error

**Error** in the context of this POS system refers to any unexpected condition, failure, or exception that prevents the application from completing an intended operation successfully. Errors can occur at multiple layers of the application stack and require appropriate handling to maintain system stability and user experience.

## Types of Errors in POS Context

### 1. **Database Errors**

- PouchDB read/write failures
- Document conflicts during sync operations
- Missing or corrupted local data
- Index creation failures
- Replication errors with remote CouchDB

### 2. **Network Errors**

- Failed API requests to remote services
- Sync failures when transitioning online/offline
- Payment gateway connection issues
- Timeout errors during data transmission
- DNS resolution failures

### 3. **Validation Errors**

- Invalid product barcodes or prices
- Incomplete customer information
- Missing required order fields
- Invalid operator credentials
- Data format mismatches (Zod schema violations)

### 4. **Business Logic Errors**

- Insufficient inventory for sale
- Invalid discount applications
- Unauthorized operator actions
- Transaction calculation errors
- Duplicate order processing

### 5. **System Errors**

- Service Worker registration failures
- PWA installation issues
- Browser storage quota exceeded
- Memory allocation failures
- Unhandled promise rejections

### 6. **User Interface Errors**

- Component rendering failures
- Navigation routing errors
- Form submission failures
- State management inconsistencies
- Reactive data binding issues

### 7. **Configuration Errors**

- Invalid environment variables
- Missing required settings
- Malformed configuration files
- Incompatible feature flag combinations

## Error Characteristics

An error in this system is characterized by:

- **Disruption**: Prevents normal application flow
- **Impact**: Affects user experience or data integrity
- **Recoverability**: May be recoverable through retry or fallback mechanisms
- **Scope**: Can be local (single operation) or global (system-wide)
- **Criticality**: Ranges from minor UI glitches to complete system failures

## Error Context Information

Each error should capture:

- **Timestamp**: When the error occurred
- **Location**: Which component, store, or service
- **User Context**: Current operator, customer, or order
- **Operation**: What action was being performed
- **Environment**: Online/offline status, device info
- **Stack Trace**: Technical details for debugging

Error handling is the process of responding to and managing errors that occur during the execution of a program. In the context of a POS (Point of Sale) system, effective error handling is essential to ensure smooth operation, maintain data integrity, and provide a good user experience.

Error handling is crucial for maintaining a robust and user-friendly POS system. Our approach focuses on:

- Graceful degradation
- User experience preservation
- Data integrity protection
- Comprehensive logging and monitoring
- Recovery mechanisms

## Core Error Handling Principles

1. **Fail Fast, Recover Gracefully**: Detect errors early but provide smooth recovery paths
2. **User-Centric Messaging**: Show meaningful messages to users, not technical details
3. **Data Protection**: Prevent data loss during error scenarios
4. **Monitoring & Alerting**: Track errors for proactive maintenance
5. **Offline Resilience**: Handle network failures in PWA context

## Error Handling Approaches

### 1. Event Pub/Sub System

A decoupled event-driven approach for handling errors across the application.

#### Implementation Example

```typescript
// error-event-bus.ts
import { EventEmitter } from 'events';

export interface ErrorEvent {
  type: 'network' | 'validation' | 'application' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context?: any;
  timestamp: Date;
  source: string;
}

class ErrorEventBus extends EventEmitter {
  private static instance: ErrorEventBus;

  static getInstance(): ErrorEventBus {
    if (!ErrorEventBus.instance) {
      ErrorEventBus.instance = new ErrorEventBus();
    }
    return ErrorEventBus.instance;
  }

  emitError(error: ErrorEvent) {
    this.emit('error', error);
  }

  subscribeToErrors(handler: (error: ErrorEvent) => void) {
    this.on('error', handler);
  }
}

export const errorBus = ErrorEventBus.getInstance();

// Usage in components
// product-service.ts
import { errorBus } from './error-event-bus';

export class ProductService {
  async createProduct(product: Product) {
    try {
      return await this.db.put(product);
    } catch (error) {
      errorBus.emitError({
        type: 'application',
        severity: 'high',
        message: 'Failed to create product',
        context: { product, error: error.message },
        timestamp: new Date(),
        source: 'ProductService.createProduct'
      });
      throw error;
    }
  }
}

// Error handler component
// error-handler.vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { errorBus, type ErrorEvent } from './error-event-bus';
import { useNotificationStore } from '@/stores/notification-store';

const notificationStore = useNotificationStore();

const handleError = (error: ErrorEvent) => {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error Event:', error);
  }

  // Send to monitoring service
  sendToMonitoring(error);

  // Show user notification based on severity
  if (error.severity === 'critical') {
    notificationStore.showError('System Error', 'A critical error occurred. Please contact support.');
  } else if (error.severity === 'high') {
    notificationStore.showError('Error', error.message);
  } else if (error.severity === 'medium') {
    notificationStore.showWarning('Warning', error.message);
  }
};

onMounted(() => {
  errorBus.subscribeToErrors(handleError);
});

onUnmounted(() => {
  errorBus.removeListener('error', handleError);
});
</script>
```

#### Pros

- **Decoupled Architecture**: Components don't need to know about error handling implementation
- **Flexible Strategies**: Different handlers can be registered for different error types
- **Extensible**: Easy to add new error types and handlers
- **Asynchronous Handling**: Errors don't block the main application flow
- **Centralized Monitoring**: All errors flow through a single point for logging
- **Testing Friendly**: Easy to mock and test error scenarios

#### Cons

- **Complexity**: Requires additional setup and event management
- **Memory Leaks Risk**: Must properly unsubscribe event listeners
- **Debugging Difficulty**: Error flow can be harder to trace
- **Performance Overhead**: Event emission and handling adds processing time
- **Event Order**: No guarantee of handler execution order

### 2. Error Handling Middleware

Centralized error handling using middleware pattern for consistent error processing.

#### Implementation Example

```typescript
// error-middleware.ts
export interface ErrorContext {
  operation: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ErrorHandler {
  canHandle(error: Error, context: ErrorContext): boolean;
  handle(error: Error, context: ErrorContext): Promise<void>;
}

// Network error handler
export class NetworkErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.name === "TypeError" && error.message.includes("fetch");
  }

  async handle(error: Error, context: ErrorContext): Promise<void> {
    // Queue operation for retry when online
    await this.queueForRetry(context);

    // Show offline message
    this.showOfflineMessage();

    // Log for monitoring
    this.logError(error, context);
  }

  private async queueForRetry(context: ErrorContext) {
    // Implementation for queuing failed operations
  }

  private showOfflineMessage() {
    // Show user-friendly offline message
  }

  private logError(error: Error, context: ErrorContext) {
    // Log to monitoring service
  }
}

// Validation error handler
export class ValidationErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.name === "ValidationError";
  }

  async handle(error: Error, context: ErrorContext): Promise<void> {
    // Extract validation details
    const validationError = error as any;

    // Show field-specific errors
    this.displayFieldErrors(validationError.details);

    // Focus first invalid field
    this.focusInvalidField(validationError.details[0]?.field);
  }

  private displayFieldErrors(details: any[]) {
    // Show validation errors in form
  }

  private focusInvalidField(fieldName: string) {
    // Focus the invalid input field
  }
}

// Error middleware orchestrator
export class ErrorMiddleware {
  private handlers: ErrorHandler[] = [];

  addHandler(handler: ErrorHandler) {
    this.handlers.push(handler);
  }

  async handleError(error: Error, context: ErrorContext): Promise<void> {
    const handler = this.handlers.find((h) => h.canHandle(error, context));

    if (handler) {
      await handler.handle(error, context);
    } else {
      // Fallback to default error handling
      await this.defaultErrorHandler(error, context);
    }
  }

  private async defaultErrorHandler(error: Error, context: ErrorContext) {
    console.error("Unhandled error:", error, context);
    // Show generic error message
    // Log to monitoring
  }
}

// Usage in services
export const errorMiddleware = new ErrorMiddleware();
errorMiddleware.addHandler(new NetworkErrorHandler());
errorMiddleware.addHandler(new ValidationErrorHandler());

// In service methods
export class OrderService {
  async createOrder(order: Order) {
    try {
      return await this.db.put(order);
    } catch (error) {
      await errorMiddleware.handleError(error as Error, {
        operation: "createOrder",
        userId: this.currentUserId,
        timestamp: new Date(),
        metadata: { orderId: order.id },
      });
      throw error;
    }
  }
}
```

#### Pros

- **Centralized Logic**: All error handling logic in one place
- **Consistent Handling**: Uniform error processing across the application
- **Type-Specific Handlers**: Different strategies for different error types
- **Chain of Responsibility**: Clear handler selection process
- **Testable**: Easy to unit test individual handlers
- **Maintainable**: Changes to error handling don't affect business logic

#### Cons

- **Single Point of Failure**: If middleware fails, all error handling breaks
- **Performance Bottleneck**: All errors go through the same processing pipeline
- **Complexity**: Can become complex with many handler types
- **Tight Coupling**: Services become dependent on middleware
- **Debugging**: Adds another layer to debug through

### 3. Global Error Handler

Application-wide error catching using Vue's global error handler and window error events.

#### Implementation Example

```typescript
// global-error-handler.ts
import type { App } from "vue";
import { useNotificationStore } from "@/stores/notification-store";

export interface GlobalErrorConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  enableUserNotification: boolean;
  logEndpoint?: string;
}

export class GlobalErrorHandler {
  private config: GlobalErrorConfig;
  private notificationStore: any;

  constructor(config: GlobalErrorConfig) {
    this.config = config;
  }

  setupVueErrorHandler(app: App) {
    app.config.errorHandler = (error, instance, info) => {
      this.handleVueError(error, instance, info);
    };
  }

  setupWindowErrorHandler() {
    window.addEventListener("error", (event) => {
      this.handleWindowError(event.error, event);
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.handlePromiseRejection(event.reason, event);
    });
  }

  private async handleVueError(error: any, instance: any, info: string) {
    const errorDetails = {
      type: "vue-error",
      message: error.message || "Unknown Vue error",
      stack: error.stack,
      componentName: instance?.$options.name || "Unknown",
      errorInfo: info,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    await this.processError(errorDetails);
  }

  private async handleWindowError(error: Error, event: ErrorEvent) {
    const errorDetails = {
      type: "javascript-error",
      message: error.message || event.message,
      stack: error.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    await this.processError(errorDetails);
  }

  private async handlePromiseRejection(
    reason: any,
    event: PromiseRejectionEvent,
  ) {
    const errorDetails = {
      type: "promise-rejection",
      message: reason?.message || "Unhandled promise rejection",
      stack: reason?.stack,
      reason: JSON.stringify(reason),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    await this.processError(errorDetails);
  }

  private async processError(errorDetails: any) {
    // Console logging
    if (this.config.enableConsoleLogging) {
      console.error("Global Error:", errorDetails);
    }

    // Remote logging
    if (this.config.enableRemoteLogging && this.config.logEndpoint) {
      try {
        await fetch(this.config.logEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(errorDetails),
        });
      } catch (logError) {
        console.error("Failed to send error log:", logError);
      }
    }

    // User notification
    if (this.config.enableUserNotification) {
      this.showUserNotification(errorDetails);
    }
  }

  private showUserNotification(errorDetails: any) {
    if (!this.notificationStore) {
      this.notificationStore = useNotificationStore();
    }

    // Don't overwhelm user with too many error notifications
    if (this.shouldShowNotification(errorDetails)) {
      this.notificationStore.showError(
        "Application Error",
        "An unexpected error occurred. Please try again.",
      );
    }
  }

  private shouldShowNotification(errorDetails: any): boolean {
    // Implement logic to prevent notification spam
    return true;
  }
}

// Setup in main.ts
import { createApp } from "vue";
import { GlobalErrorHandler } from "./global-error-handler";

const app = createApp(App);

const errorHandler = new GlobalErrorHandler({
  enableConsoleLogging: import.meta.env.DEV,
  enableRemoteLogging: import.meta.env.PROD,
  enableUserNotification: true,
  logEndpoint: import.meta.env.VITE_ERROR_LOG_ENDPOINT,
});

errorHandler.setupVueErrorHandler(app);
errorHandler.setupWindowErrorHandler();
```

#### Pros

- **Comprehensive Coverage**: Catches all unhandled errors in the application
- **Easy Setup**: Minimal configuration required
- **Automatic**: No need to wrap code in try-catch blocks
- **Centralized Logging**: All errors go to one place for monitoring
- **User Protection**: Prevents application crashes from unhandled errors
- **Development Aid**: Helpful for debugging in development

#### Cons

- **Generic Handling**: Cannot provide specific context-aware error handling
- **Loss of Context**: May lose important error context
- **Performance Impact**: All errors go through the same processing
- **Recovery Limitation**: Limited ability to recover from errors
- **Debugging Complexity**: Can make debugging more difficult
- **Over-Catching**: May catch errors that should be handled locally

### 4. Try/Catch Blocks with Error Boundaries

Localized error handling with proper error boundaries and recovery mechanisms.

#### Implementation Example

```typescript
// error-boundary.tsx (for critical components)
import { defineComponent, ref, onErrorCaptured } from "vue";

export default defineComponent({
  name: "ErrorBoundary",
  props: {
    fallback: {
      type: [String, Object],
      default: "Something went wrong",
    },
    onError: {
      type: Function,
      default: null,
    },
  },
  setup(props, { slots }) {
    const hasError = ref(false);
    const error = ref<Error | null>(null);

    onErrorCaptured((err, instance, info) => {
      hasError.value = true;
      error.value = err;

      // Call custom error handler if provided
      if (props.onError) {
        props.onError(err, instance, info);
      }

      // Log error
      console.error("Error Boundary caught error:", err, info);

      // Prevent error from propagating
      return false;
    });

    const retry = () => {
      hasError.value = false;
      error.value = null;
    };

    return () => {
      if (hasError.value) {
        // Render error fallback
        if (typeof props.fallback === "string") {
          return h("div", { class: "error-boundary" }, [
            h("h3", "Oops! Something went wrong"),
            h("p", props.fallback),
            h("button", { onClick: retry }, "Try Again"),
          ]);
        } else {
          return h(props.fallback, { error: error.value, retry });
        }
      }

      // Render children normally
      return slots.default?.();
    };
  },
});

// Service-level error handling with recovery
export class ProductService {
  private retryAttempts = 3;
  private retryDelay = 1000;

  async getProduct(id: string): Promise<Product> {
    return this.withRetry(async () => {
      try {
        const product = await this.db.get(id);
        return product;
      } catch (error) {
        if (error.status === 404) {
          throw new ProductNotFoundError(`Product ${id} not found`);
        } else if (error.status >= 500) {
          throw new ServerError("Server error occurred");
        } else {
          throw new ApplicationError("Failed to fetch product", error);
        }
      }
    });
  }

  async createProduct(product: Omit<Product, "_id">): Promise<Product> {
    return this.withValidation(product, async (validatedProduct) => {
      try {
        const newProduct = {
          _id: crypto.randomUUID(),
          ...validatedProduct,
        };

        await this.db.put(newProduct);
        return newProduct;
      } catch (error) {
        if (error.status === 409) {
          throw new ConflictError("Product with same barcode already exists");
        } else {
          throw new ApplicationError("Failed to create product", error);
        }
      }
    });
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on validation or client errors
        if (error.status < 500) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    throw lastError!;
  }

  private async withValidation<T, R>(
    data: T,
    operation: (validatedData: T) => Promise<R>,
  ): Promise<R> {
    try {
      // Validate data using Zod or similar
      const validatedData = this.validateProductData(data);
      return await operation(validatedData);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError("Invalid product data", error.details);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private validateProductData(product: any): any {
    // Validation logic here
    return product;
  }
}

// Custom error classes
export class ApplicationError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: any[],
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ProductNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductNotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class ServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerError";
  }
}
```

```vue
// Usage in components // product-form.vue
<template>
  <ErrorBoundary :onError="handleFormError">
    <form @submit.prevent="submitForm">
      <!-- form fields -->
    </form>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ProductService } from "@/services/product-service";
import ErrorBoundary from "@/components/error-boundary";

const productService = new ProductService();
const isSubmitting = ref(false);
const errors = ref<Record<string, string>>({});

const submitForm = async () => {
  try {
    isSubmitting.value = true;
    errors.value = {};

    await productService.createProduct(formData.value);

    // Success handling
    router.push("/products");
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle validation errors
      error.details?.forEach((detail) => {
        errors.value[detail.field] = detail.message;
      });
    } else if (error instanceof ConflictError) {
      // Handle conflict errors
      errors.value.barcode = "Product with this barcode already exists";
    } else {
      // Handle other errors
      console.error("Form submission error:", error);
      // Show generic error message
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleFormError = (error: Error) => {
  console.error("Form error boundary caught:", error);
  // Additional error handling specific to form
};
</script>
```

#### Pros

- **Precise Control**: Exact control over error handling for specific operations
- **Context Preservation**: Maintains full context of where error occurred
- **Recovery Options**: Can implement specific recovery strategies
- **Performance**: No overhead when no errors occur
- **Debugging**: Easy to debug and trace error sources
- **Flexibility**: Different handling strategies for different operations

#### Cons

- **Code Duplication**: Similar error handling code may be repeated
- **Maintenance Overhead**: Must remember to add error handling to new code
- **Verbosity**: Can make code longer and harder to read
- **Inconsistency**: Risk of inconsistent error handling across the application
- **Missing Coverage**: Easy to forget error handling in some places
- **Nested Complexity**: Deeply nested try-catch blocks can be hard to follow

## Comprehensive Comparison

| Aspect                   | Event Pub/Sub | Error Middleware | Global Handler | Try/Catch Blocks |
| ------------------------ | ------------- | ---------------- | -------------- | ---------------- |
| **Setup Complexity**     | Medium        | Medium           | Low            | Low              |
| **Runtime Performance**  | Medium        | Medium           | Low            | High             |
| **Error Context**        | Good          | Good             | Poor           | Excellent        |
| **Recovery Capability**  | Good          | Excellent        | Poor           | Excellent        |
| **Code Maintainability** | Good          | Excellent        | Good           | Poor             |
| **Testing Ease**         | Excellent     | Excellent        | Medium         | Excellent        |
| **Debugging Difficulty** | Medium        | Medium           | High           | Low              |
| **Memory Usage**         | Medium        | Low              | Low            | Low              |
| **Flexibility**          | Excellent     | Good             | Poor           | Excellent        |
| **Consistency**          | Good          | Excellent        | Excellent      | Poor             |

## Recommended Hybrid Approach

For a robust POS system, combine multiple approaches:

```typescript
// hybrid-error-strategy.ts
export class HybridErrorStrategy {
  private errorMiddleware: ErrorMiddleware;
  private globalHandler: GlobalErrorHandler;
  private errorBus: ErrorEventBus;

  constructor() {
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    // 1. Global handler for uncaught errors
    this.globalHandler = new GlobalErrorHandler({
      enableConsoleLogging: import.meta.env.DEV,
      enableRemoteLogging: import.meta.env.PROD,
      enableUserNotification: true,
    });

    // 2. Middleware for service-level errors
    this.errorMiddleware = new ErrorMiddleware();
    this.errorMiddleware.addHandler(new NetworkErrorHandler());
    this.errorMiddleware.addHandler(new ValidationErrorHandler());
    this.errorMiddleware.addHandler(new BusinessLogicErrorHandler());

    // 3. Event bus for cross-component error communication
    this.errorBus = ErrorEventBus.getInstance();
    this.setupErrorBusHandlers();
  }

  private setupErrorBusHandlers() {
    this.errorBus.subscribeToErrors((error) => {
      // Route to appropriate handler
      if (error.severity === "critical") {
        this.handleCriticalError(error);
      } else {
        this.handleNormalError(error);
      }
    });
  }

  // Service method wrapper
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Let middleware handle first
      await this.errorMiddleware.handleError(error as Error, context);

      // Emit event for additional handling
      this.errorBus.emitError({
        type: this.classifyError(error),
        severity: this.getSeverity(error),
        message: error.message,
        context,
        timestamp: new Date(),
        source: context.operation,
      });

      throw error; // Re-throw for local handling
    }
  }

  private classifyError(
    error: any,
  ): "network" | "validation" | "application" | "system" {
    // Error classification logic
    return "application";
  }

  private getSeverity(error: any): "low" | "medium" | "high" | "critical" {
    // Severity assessment logic
    return "medium";
  }
}
```

## Best Practices

### 1. Error Classification

```typescript
export enum ErrorType {
  VALIDATION = "validation",
  NETWORK = "network",
  PERMISSION = "permission",
  BUSINESS_LOGIC = "business_logic",
  SYSTEM = "system",
}

export enum ErrorSeverity {
  LOW = "low", // Log only
  MEDIUM = "medium", // Log + user notification
  HIGH = "high", // Log + user notification + retry
  CRITICAL = "critical", // Log + user notification + retry + alert admin
}
```

### 2. User-Friendly Messages

```typescript
const ERROR_MESSAGES = {
  [ErrorType.NETWORK]: {
    title: "Connection Issue",
    message: "Please check your internet connection and try again.",
    action: "Retry",
  },
  [ErrorType.VALIDATION]: {
    title: "Invalid Information",
    message: "Please check the highlighted fields and try again.",
    action: "Fix",
  },
  [ErrorType.PERMISSION]: {
    title: "Access Denied",
    message: "You don't have permission to perform this action.",
    action: "Contact Support",
  },
};
```

### 3. Error Recovery Strategies

```typescript
export interface RecoveryStrategy {
  canRecover(error: Error): boolean;
  recover(error: Error, context: any): Promise<void>;
}

export class NetworkRecoveryStrategy implements RecoveryStrategy {
  canRecover(error: Error): boolean {
    return error.name === "NetworkError";
  }

  async recover(error: Error, context: any): Promise<void> {
    // Queue for retry when online
    await this.queueOperation(context);

    // Show offline indicator
    this.showOfflineMode();
  }
}
```

## Vue-Specific Error Handling with Composables and Pinia

This section demonstrates how to integrate error handling seamlessly with Vue.js ecosystem using composables, Pinia stores, and the notification system.

### Error Handling Composables

#### 1. Core Error Handling Composable

```typescript
// composables/use-error-handler.ts
import { ref, computed } from "vue";
import { useNotificationStore } from "@/stores/notification-store";
import { useOnlineStatus } from "@/composables/use-online-status";

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  isLoading: boolean;
  canRetry: boolean;
}

export interface ErrorHandlerOptions {
  showNotification?: boolean;
  logError?: boolean;
  enableRetry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  customMessage?: string;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const notificationStore = useNotificationStore();
  const { online } = useOnlineStatus();

  const state = ref<ErrorState>({
    hasError: false,
    error: null,
    isLoading: false,
    canRetry: false,
  });

  const errorType = computed(() => {
    if (!state.value.error) return null;

    if (state.value.error.message.includes("fetch")) {
      return "network";
    } else if (state.value.error.name === "ValidationError") {
      return "validation";
    } else if (state.value.error.message.includes("permission")) {
      return "permission";
    }
    return "application";
  });

  const canRetryOperation = computed(() => {
    return (
      state.value.canRetry &&
      errorType.value === "network" &&
      online.value &&
      options.enableRetry !== false
    );
  });

  const execute = async <T>(
    operation: () => Promise<T>,
    customOptions?: Partial<ErrorHandlerOptions>,
  ): Promise<T | null> => {
    const mergedOptions = { ...options, ...customOptions };
    let attempts = 0;
    const maxAttempts = mergedOptions.retryAttempts || 3;

    state.value.isLoading = true;
    state.value.hasError = false;
    state.value.error = null;

    while (attempts < maxAttempts) {
      try {
        const result = await operation();

        // Success - reset error state
        state.value.hasError = false;
        state.value.error = null;
        state.value.canRetry = false;

        return result;
      } catch (error) {
        attempts++;
        state.value.error = error as Error;
        state.value.hasError = true;
        state.value.canRetry = attempts < maxAttempts;

        // Log error if enabled
        if (mergedOptions.logError !== false) {
          console.error(
            `Operation failed (attempt ${attempts}/${maxAttempts}):`,
            error,
          );
        }

        // Show notification for final attempt or non-retryable errors
        if (attempts >= maxAttempts || !shouldRetry(error as Error)) {
          if (mergedOptions.showNotification !== false) {
            showErrorNotification(error as Error, mergedOptions.customMessage);
          }
          break;
        }

        // Wait before retry
        if (attempts < maxAttempts) {
          await delay(mergedOptions.retryDelay || 1000 * attempts);
        }
      }
    }

    return null;
  };

  const retry = async <T>(operation: () => Promise<T>): Promise<T | null> => {
    if (!canRetryOperation.value) return null;
    return execute(operation);
  };

  const clearError = () => {
    state.value.hasError = false;
    state.value.error = null;
    state.value.canRetry = false;
  };

  const showErrorNotification = (error: Error, customMessage?: string) => {
    const type = errorType.value;

    switch (type) {
      case "network":
        notificationStore.showError(
          "Connection Error",
          customMessage ||
            "Please check your internet connection and try again.",
        );
        break;
      case "validation":
        notificationStore.showWarning(
          "Invalid Data",
          customMessage || "Please check your input and try again.",
        );
        break;
      case "permission":
        notificationStore.showError(
          "Access Denied",
          customMessage || "You don't have permission to perform this action.",
        );
        break;
      default:
        notificationStore.showError(
          "Error",
          customMessage || "An unexpected error occurred. Please try again.",
        );
    }
  };

  const shouldRetry = (error: Error): boolean => {
    // Don't retry validation or permission errors
    if (
      error.name === "ValidationError" ||
      error.message.includes("permission")
    ) {
      return false;
    }

    // Only retry network errors when online
    if (error.message.includes("fetch") && !online.value) {
      return false;
    }

    return true;
  };

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  return {
    // State
    ...state.value,
    errorType: errorType.value,
    canRetryOperation: canRetryOperation.value,

    // Methods
    execute,
    retry,
    clearError,
  };
}
```

#### 2. Form Error Handling Composable

```typescript
// composables/use-form-errors.ts
import { ref, computed } from "vue";
import { useNotificationStore } from "@/stores/notification-store";

export interface FormError {
  field: string;
  message: string;
}

export interface FormErrorState {
  errors: Record<string, string>;
  hasErrors: boolean;
  isSubmitting: boolean;
}

export function useFormErrors() {
  const notificationStore = useNotificationStore();

  const state = ref<FormErrorState>({
    errors: {},
    hasErrors: false,
    isSubmitting: false,
  });

  const hasFieldError = (field: string) => {
    return field in state.value.errors;
  };

  const getFieldError = (field: string) => {
    return state.value.errors[field] || "";
  };

  const setFieldError = (field: string, message: string) => {
    state.value.errors[field] = message;
    state.value.hasErrors = true;
  };

  const clearFieldError = (field: string) => {
    delete state.value.errors[field];
    state.value.hasErrors = Object.keys(state.value.errors).length > 0;
  };

  const clearAllErrors = () => {
    state.value.errors = {};
    state.value.hasErrors = false;
  };

  const setErrors = (errors: FormError[] | Record<string, string>) => {
    if (Array.isArray(errors)) {
      state.value.errors = errors.reduce(
        (acc, error) => {
          acc[error.field] = error.message;
          return acc;
        },
        {} as Record<string, string>,
      );
    } else {
      state.value.errors = { ...errors };
    }
    state.value.hasErrors = Object.keys(state.value.errors).length > 0;
  };

  const handleSubmissionError = (error: any) => {
    if (error.name === "ValidationError" && error.details) {
      // Handle validation errors
      setErrors(error.details);
      notificationStore.showWarning(
        "Validation Error",
        "Please check the highlighted fields and try again.",
      );
    } else if (error.message.includes("duplicate") || error.status === 409) {
      // Handle conflict errors
      notificationStore.showError(
        "Duplicate Entry",
        "A record with this information already exists.",
      );
    } else {
      // Handle generic errors
      notificationStore.showError(
        "Submission Error",
        "Failed to save changes. Please try again.",
      );
    }
  };

  const withSubmission = async <T>(
    operation: () => Promise<T>,
  ): Promise<T | null> => {
    try {
      state.value.isSubmitting = true;
      clearAllErrors();

      const result = await operation();

      notificationStore.showSuccess("Success", "Changes saved successfully.");

      return result;
    } catch (error) {
      handleSubmissionError(error);
      return null;
    } finally {
      state.value.isSubmitting = false;
    }
  };

  return {
    // State
    errors: computed(() => state.value.errors),
    hasErrors: computed(() => state.value.hasErrors),
    isSubmitting: computed(() => state.value.isSubmitting),

    // Methods
    hasFieldError,
    getFieldError,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setErrors,
    handleSubmissionError,
    withSubmission,
  };
}
```

#### 3. Async Operation Composable

```typescript
// composables/use-async-operation.ts
import { ref, computed } from "vue";
import { useErrorHandler } from "./use-error-handler";
import { useNotificationStore } from "@/stores/notification-store";

export interface AsyncOperationState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  hasError: boolean;
}

export function useAsyncOperation<T>() {
  const errorHandler = useErrorHandler();
  const notificationStore = useNotificationStore();

  const state = ref<AsyncOperationState<T>>({
    data: null,
    isLoading: false,
    error: null,
    hasError: false,
  });

  const execute = async (
    operation: () => Promise<T>,
    options?: {
      showSuccessMessage?: boolean;
      successMessage?: string;
      showErrorMessage?: boolean;
      errorMessage?: string;
    },
  ): Promise<T | null> => {
    state.value.isLoading = true;
    state.value.error = null;
    state.value.hasError = false;

    try {
      const result = await operation();
      state.value.data = result;

      if (options?.showSuccessMessage) {
        notificationStore.showSuccess(
          "Success",
          options.successMessage || "Operation completed successfully.",
        );
      }

      return result;
    } catch (error) {
      state.value.error = error as Error;
      state.value.hasError = true;

      if (options?.showErrorMessage !== false) {
        notificationStore.showError(
          "Error",
          options?.errorMessage || "Operation failed. Please try again.",
        );
      }

      return null;
    } finally {
      state.value.isLoading = false;
    }
  };

  const retry = async (): Promise<T | null> => {
    if (!state.value.hasError) return state.value.data;

    // Reset error state and retry
    state.value.error = null;
    state.value.hasError = false;

    // Note: This requires storing the original operation
    // In practice, you'd need to pass the operation to retry
    return null;
  };

  const reset = () => {
    state.value.data = null;
    state.value.isLoading = false;
    state.value.error = null;
    state.value.hasError = false;
  };

  return {
    // State
    data: computed(() => state.value.data),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    hasError: computed(() => state.value.hasError),

    // Methods
    execute,
    retry,
    reset,
  };
}
```

### Pinia Store Integration

#### Enhanced Notification Store with Error Handling

```typescript
// stores/notification-store.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: "primary" | "secondary" | "danger";
}

export const useNotificationStore = defineStore("notification", () => {
  const notifications = ref<Notification[]>([]);
  const maxNotifications = ref(5);

  const activeNotifications = computed(() => notifications.value);
  const hasErrors = computed(() =>
    notifications.value.some((n) => n.type === "error"),
  );
  const errorCount = computed(
    () => notifications.value.filter((n) => n.type === "error").length,
  );

  const show = (notification: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      duration: 5000,
      ...notification,
    };

    notifications.value.unshift(newNotification);

    // Limit number of notifications
    if (notifications.value.length > maxNotifications.value) {
      notifications.value = notifications.value.slice(
        0,
        maxNotifications.value,
      );
    }

    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        remove(newNotification.id);
      }, newNotification.duration);
    }
  };

  const showSuccess = (
    title: string,
    message: string,
    actions?: NotificationAction[],
  ) => {
    show({ type: "success", title, message, actions });
  };

  const showError = (
    title: string,
    message: string,
    options?: {
      actions?: NotificationAction[];
      metadata?: Record<string, any>;
      duration?: number;
    },
  ) => {
    show({
      type: "error",
      title,
      message,
      duration: options?.duration || 0, // Errors persist until dismissed
      actions: options?.actions,
      metadata: options?.metadata,
    });
  };

  const showWarning = (
    title: string,
    message: string,
    actions?: NotificationAction[],
  ) => {
    show({ type: "warning", title, message, actions });
  };

  const showInfo = (
    title: string,
    message: string,
    actions?: NotificationAction[],
  ) => {
    show({ type: "info", title, message, actions });
  };

  const showErrorWithRetry = (
    title: string,
    message: string,
    retryFn: () => void,
    metadata?: Record<string, any>,
  ) => {
    showError(title, message, {
      actions: [
        {
          label: "Retry",
          action: () => {
            retryFn();
            remove(); // Remove current error after retry
          },
          style: "primary",
        },
        {
          label: "Dismiss",
          action: () => remove(),
          style: "secondary",
        },
      ],
      metadata,
    });
  };

  const showConfirm = async (
    title: string,
    message: string,
    options?: {
      type?: "info" | "warning" | "error";
      confirmText?: string;
      cancelText?: string;
    },
  ): Promise<{ confirmed: boolean }> => {
    return new Promise((resolve) => {
      show({
        type: options?.type || "info",
        title,
        message,
        duration: 0, // Don't auto-dismiss
        actions: [
          {
            label: options?.confirmText || "Confirm",
            action: () => {
              resolve({ confirmed: true });
              remove();
            },
            style: "primary",
          },
          {
            label: options?.cancelText || "Cancel",
            action: () => {
              resolve({ confirmed: false });
              remove();
            },
            style: "secondary",
          },
        ],
      });
    });
  };

  const remove = (id?: string) => {
    if (id) {
      notifications.value = notifications.value.filter((n) => n.id !== id);
    } else {
      // Remove the most recent notification
      notifications.value.shift();
    }
  };

  const removeAll = () => {
    notifications.value = [];
  };

  const removeByType = (type: Notification["type"]) => {
    notifications.value = notifications.value.filter((n) => n.type !== type);
  };

  return {
    // State
    notifications: activeNotifications,
    hasErrors,
    errorCount,

    // Methods
    show,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showErrorWithRetry,
    showConfirm,
    remove,
    removeAll,
    removeByType,
  };
});
```

#### Error Tracking Store

```typescript
// stores/error-tracking-store.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface ErrorLog {
  id: string;
  type: "network" | "validation" | "application" | "system";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack?: string;
  context: {
    component?: string;
    operation?: string;
    userId?: string;
    timestamp: Date;
    url: string;
    userAgent: string;
  };
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export const useErrorTrackingStore = defineStore("errorTracking", () => {
  const errors = ref<ErrorLog[]>([]);
  const maxErrors = ref(100);

  const unresolvedErrors = computed(() =>
    errors.value.filter((e) => !e.resolved),
  );

  const criticalErrors = computed(() =>
    errors.value.filter((e) => e.severity === "critical" && !e.resolved),
  );

  const errorsByType = computed(() => {
    return errors.value.reduce(
      (acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  });

  const logError = (
    error: Error,
    context: Partial<ErrorLog["context"]> = {},
  ) => {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      type: classifyError(error),
      severity: getSeverity(error),
      message: error.message,
      stack: error.stack,
      context: {
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context,
      },
      resolved: false,
      metadata: {},
    };

    errors.value.unshift(errorLog);

    // Limit error storage
    if (errors.value.length > maxErrors.value) {
      errors.value = errors.value.slice(0, maxErrors.value);
    }

    // Send to remote logging service if critical
    if (errorLog.severity === "critical") {
      sendToRemoteLogging(errorLog);
    }

    return errorLog.id;
  };

  const resolveError = (id: string) => {
    const error = errors.value.find((e) => e.id === id);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date();
    }
  };

  const clearResolvedErrors = () => {
    errors.value = errors.value.filter((e) => !e.resolved);
  };

  const clearAllErrors = () => {
    errors.value = [];
  };

  const classifyError = (error: Error): ErrorLog["type"] => {
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return "network";
    } else if (error.name === "ValidationError") {
      return "validation";
    } else if (
      error.message.includes("system") ||
      error.message.includes("quota")
    ) {
      return "system";
    }
    return "application";
  };

  const getSeverity = (error: Error): ErrorLog["severity"] => {
    if (error.message.includes("critical") || error.name === "SecurityError") {
      return "critical";
    } else if (
      error.message.includes("network") ||
      error.name === "TypeError"
    ) {
      return "high";
    } else if (error.name === "ValidationError") {
      return "medium";
    }
    return "low";
  };

  const sendToRemoteLogging = async (errorLog: ErrorLog) => {
    try {
      await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorLog),
      });
    } catch (logError) {
      console.error("Failed to send error log:", logError);
    }
  };

  return {
    // State
    errors: computed(() => errors.value),
    unresolvedErrors,
    criticalErrors,
    errorsByType,

    // Methods
    logError,
    resolveError,
    clearResolvedErrors,
    clearAllErrors,
  };
});
```

### Usage Examples in Vue Components

#### 1. Product Form Component

```vue
<!-- components/product-form.vue -->
<template>
  <ErrorBoundary :onError="handleFormError">
    <form @submit.prevent="submitForm">
      <!-- form fields -->
    </form>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ProductService } from "@/services/product-service";
import ErrorBoundary from "@/components/error-boundary";

const productService = new ProductService();
const isSubmitting = ref(false);
const errors = ref<Record<string, string>>({});

const submitForm = async () => {
  try {
    isSubmitting.value = true;
    errors.value = {};

    await productService.createProduct(formData.value);

    // Success handling
    router.push("/products");
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle validation errors
      error.details?.forEach((detail) => {
        errors.value[detail.field] = detail.message;
      });
    } else if (error instanceof ConflictError) {
      // Handle conflict errors
      errors.value.barcode = "Product with this barcode already exists";
    } else {
      // Handle other errors
      console.error("Form submission error:", error);
      // Show generic error message
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleFormError = (error: Error) => {
  console.error("Form error boundary caught:", error);
  // Additional error handling specific to form
};
</script>
```

#### 2. Product List Component with Error Handling

```vue
<!-- components/product-list.vue -->
<template>
  <div class="space-y-4">
    <!-- Error State -->
    <div v-if="hasError" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex items-center">
        <svg
          class="h-5 w-5 text-red-400 mr-3"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <h3 class="text-sm font-medium text-red-800">
          Failed to load products
        </h3>
      </div>
      <div class="mt-2">
        <p class="text-sm text-red-700">{{ error?.message }}</p>
        <button
          v-if="canRetryOperation"
          @click="retryLoad"
          class="mt-2 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium py-1 px-3 rounded-md"
        >
          Try Again
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
      </div>
    </div>

    <!-- Products List -->
    <div
      v-else-if="data"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="product in data"
        :key="product._id"
        class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
      >
        <h3 class="font-semibold text-gray-900">{{ product.name }}</h3>
        <p class="text-gray-600">${{ product.price.toFixed(2) }}</p>
        <p class="text-sm text-gray-500">Stock: {{ product.stock }}</p>

        <div class="mt-4 flex space-x-2">
          <button
            @click="editProduct(product)"
            class="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Edit
          </button>
          <button
            @click="deleteProduct(product)"
            class="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <p class="text-gray-500">No products found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAsyncOperation } from "@/composables/use-async-operation";
import { useErrorHandler } from "@/composables/use-error-handler";
import { useNotificationStore } from "@/stores/notification-store";
import { productService } from "@/services/product-service";
import type { Product } from "@/types/product";

const router = useRouter();
const notificationStore = useNotificationStore();
const errorHandler = useErrorHandler({ enableRetry: true });
const { data, isLoading, error, hasError, execute } =
  useAsyncOperation<Product[]>();

const loadProducts = async () => {
  await execute(() => productService.listProducts());
};

const retryLoad = async () => {
  await errorHandler.execute(loadProducts);
};

const editProduct = (product: Product) => {
  router.push(`/products/${product._id}/edit`);
};

const deleteProduct = async (product: Product) => {
  const confirmed = await notificationStore.showConfirm(
    "Delete Product",
    `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
    { type: "warning" },
  );

  if (confirmed.confirmed) {
    await errorHandler.execute(
      async () => {
        await productService.deleteProduct(product._id);
        await loadProducts(); // Refresh list
      },
      {
        customMessage: `Failed to delete ${product.name}. Please try again.`,
      },
    );
  }
};

onMounted(() => {
  loadProducts();
});
</script>
```

This Vue-specific implementation provides:

1. **Composables**: Reusable error handling logic
2. **Pinia Integration**: Enhanced stores with error tracking
3. **Component Examples**: Real-world usage patterns
4. **Reactive State Management**: Vue 3 reactivity for error states
5. **User Experience**: Loading states, error messages, retry functionality
6. **Type Safety**: Full TypeScript support

The approach ensures consistent error handling across the entire Vue.js POS application while maintaining clean, maintainable code.

## Testing Error Handling

```typescript
// error-handling.test.ts
describe("Error Handling", () => {
  it("should handle network errors gracefully", async () => {
    // Mock network failure
    mockNetworkFailure();

    const result = await productService.getProducts();

    expect(result).toEqual([]);
    expect(notificationStore.hasError).toBe(true);
    expect(queueService.hasQueuedOperations).toBe(true);
  });

  it("should recover from validation errors", async () => {
    const invalidProduct = { name: "", price: -1 };

    try {
      await productService.createProduct(invalidProduct);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.details).toHaveLength(2);
    }
  });
});
```

This comprehensive error handling strategy ensures robust, user-friendly, and maintainable error management throughout the POS system.
