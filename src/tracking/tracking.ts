export enum EventType {
  ERROR = "error",
  USER = "user",
}

export interface TrackingEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface EventHandler {
  supportedEventTypes: EventType[];
  handle(event: TrackingEvent): void | Promise<void>;
}

export interface Tracking {
  track(eventType: EventType, data: Record<string, unknown>): void;
  on(eventType: EventType, handler: (event: TrackingEvent) => void): void;
  off(eventType: EventType, handler: (event: TrackingEvent) => void): void;
  emit(eventType: EventType, data: Record<string, unknown>): void;
  addHandler(handler: EventHandler): void;
  removeHandler(handler: EventHandler): void;
}
