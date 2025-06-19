export interface AnalyticsEvent {
  name: string;
  category: AnalyticsCategory;
  properties?: Record<string, string | number | boolean | null>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
  context?: AnalyticsContext;
}

export enum AnalyticsCategory {
  USER_ACTION = 'user_action',
  SYSTEM = 'system',
  ERROR = 'error',
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  NAVIGATION = 'navigation',
}

export interface AnalyticsContext {
  page?: string;
  component?: string;
  route?: string;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  connection?: {
    type?: string;
    speed?: string;
  };
  device?: {
    type: 'mobile' | 'tablet' | 'desktop';
    os?: string;
    browser?: string;
  };
}

export interface AnalyticsProvider {
  name: string;
  track(event: AnalyticsEvent): Promise<void> | void;
  identify(userId: string, properties?: Record<string, string | number | boolean>): Promise<void> | void;
  page(name: string, properties?: Record<string, string | number | boolean>): Promise<void> | void;
  flush?(): Promise<void> | void;
  configure?(config: Record<string, string | number | boolean>): void;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  userId?: string;
  sessionTimeout?: number;
  batchSize?: number;
  flushInterval?: number;
  providers: AnalyticsProvider[];
}

export interface UserAction {
  action: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, string | number | boolean>;
}

// Predefined event types for better type safety
export interface ProductEvent {
  productId?: string;
  productName?: string;
  category?: string;
  price?: number;
  quantity?: number;
  barcode?: string;
}

export interface OrderEvent {
  orderId?: string;
  customerId?: string;
  operatorId?: string;
  total?: number;
  itemCount?: number;
  paymentMethod?: string;
}

export interface NavigationEvent {
  from?: string;
  to: string;
  duration?: number;
}

export interface ErrorEvent {
  errorType: string;
  errorMessage?: string;
  stackTrace?: string;
  context?: Record<string, string | number | boolean>;
}

export interface PerformanceEvent {
  metric: string;
  value: number;
  unit: string;
  context?: Record<string, string | number | boolean>;
}
