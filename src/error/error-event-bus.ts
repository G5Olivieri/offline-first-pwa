import { EventEmitter } from 'events';

export interface ErrorEvent {
  type: 'network' | 'validation' | 'application' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context?: Record<string, unknown>;
  timestamp: Date;
  source: string;
  stack?: string;
  metadata?: Record<string, unknown>;
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

  unsubscribeFromErrors(handler: (error: ErrorEvent) => void) {
    this.removeListener('error', handler);
  }

  clearAllErrorListeners() {
    this.removeAllListeners('error');
  }
}

export const errorBus = ErrorEventBus.getInstance();
