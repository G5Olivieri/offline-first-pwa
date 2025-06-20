export interface ErrorTracking {
  track(error: Error, context?: Record<string, unknown>): string;
}
