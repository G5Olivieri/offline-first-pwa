export interface ErrorContext {
  operation: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ErrorHandler {
  canHandle(error: Error, context: ErrorContext): boolean;
  handle(error: Error, context: ErrorContext): Promise<void>;
}

// Network error handler
export class NetworkErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.name === 'TypeError' &&
           (error.message.includes('fetch') ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError'));
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
    // Store failed operation in local storage for retry
    const queuedOperations = this.getQueuedOperations();
    queuedOperations.push({
      ...context,
      retryCount: 0,
      maxRetries: 3
    });
    localStorage.setItem('queuedOperations', JSON.stringify(queuedOperations));
  }

  private getQueuedOperations(): Array<ErrorContext & { retryCount: number; maxRetries: number }> {
    try {
      const stored = localStorage.getItem('queuedOperations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private showOfflineMessage() {
    // This will be handled by the notification store in the actual implementation
    console.warn('Network error: Operation will be retried when connection is restored');
  }

  private logError(error: Error, context: ErrorContext) {
    console.error('Network Error:', {
      message: error.message,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

// Validation error handler
export class ValidationErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.name === 'ValidationError' ||
           error.message.includes('validation') ||
           error.message.includes('required field');
  }

  async handle(error: Error, context: ErrorContext): Promise<void> {
    // Extract validation details
    const validationError = error as ValidationError;

    // Log validation error
    this.logValidationError(validationError, context);

    // The actual field error display will be handled by the form composables
  }

  private logValidationError(error: ValidationError, context: ErrorContext) {
    console.warn('Validation Error:', {
      message: error.message,
      details: error.details,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

// Business logic error handler
export class BusinessLogicErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.name === 'ConflictError' ||
           error.name === 'PermissionError' ||
           error.name === 'BusinessRuleError' ||
           error.message.includes('duplicate') ||
           error.message.includes('permission denied');
  }

  async handle(error: Error, context: ErrorContext): Promise<void> {
    this.logBusinessError(error, context);

    // Business errors are usually user-facing and handled by UI
    // The notification will be shown by the calling component
  }

  private logBusinessError(error: Error, context: ErrorContext) {
    console.info('Business Logic Error:', {
      message: error.message,
      name: error.name,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

// System error handler
export class SystemErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.message.includes('quota') ||
           error.message.includes('storage') ||
           error.message.includes('memory') ||
           error.name === 'QuotaExceededError';
  }

  async handle(error: Error, context: ErrorContext): Promise<void> {
    // System errors are critical and need immediate attention
    this.logCriticalError(error, context);

    // Try to free up resources
    await this.attemptRecovery();
  }

  private logCriticalError(error: Error, context: ErrorContext) {
    console.error('CRITICAL System Error:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });

    // In production, this would send to monitoring service
  }

  private async attemptRecovery() {
    // Attempt to clean up local storage or other recovery actions
    try {
      // Clear old cached data
      const keys = Object.keys(localStorage);
      const oldKeys = keys.filter(key =>
        key.startsWith('cache_') &&
        this.isOldCacheKey(key)
      );

      oldKeys.forEach(key => localStorage.removeItem(key));
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
    }
  }

  private isOldCacheKey(key: string): boolean {
    // Check if cache key is older than 24 hours
    try {
      const data = localStorage.getItem(key);
      if (!data) return true;

      const parsed = JSON.parse(data);
      const timestamp = parsed.timestamp;

      if (!timestamp) return true;

      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return timestamp < dayAgo;
    } catch {
      return true; // Remove invalid cache entries
    }
  }
}

// Error middleware orchestrator
export class ErrorMiddleware {
  private handlers: ErrorHandler[] = [];

  addHandler(handler: ErrorHandler) {
    this.handlers.push(handler);
  }

  async handleError(error: Error, context: ErrorContext): Promise<void> {
    const handler = this.handlers.find(h => h.canHandle(error, context));

    if (handler) {
      await handler.handle(error, context);
    } else {
      // Fallback to default error handling
      await this.defaultErrorHandler(error, context);
    }
  }

  private async defaultErrorHandler(error: Error, context: ErrorContext) {
    console.error('Unhandled error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });

    // In production, send to monitoring service
    // For now, just log to console
  }
}

// Pre-configured error middleware instance
export const errorMiddleware = new ErrorMiddleware();
errorMiddleware.addHandler(new NetworkErrorHandler());
errorMiddleware.addHandler(new ValidationErrorHandler());
errorMiddleware.addHandler(new BusinessLogicErrorHandler());
errorMiddleware.addHandler(new SystemErrorHandler());

// Custom error classes
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}
