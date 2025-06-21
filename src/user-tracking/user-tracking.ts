export interface UserTracking {
  track(eventType: string, context?: Record<string, unknown>): void;
}
