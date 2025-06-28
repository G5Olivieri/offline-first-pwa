import { EventEmitter } from "events";
import type {
  EventHandler,
  EventType,
  Tracking,
  TrackingEvent,
} from "./tracking";

export class TrackingService extends EventEmitter implements Tracking {
  private handlers: EventHandler[] = [];

  constructor(
    private readonly source: string,
    private readonly context?: Record<string, unknown>,
  ) {
    super();
  }

  public addHandler(handler: EventHandler): void {
    this.handlers.push(handler);
  }

  public removeHandler(handler: EventHandler): void {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  public track(eventType: EventType, data: Record<string, unknown>): void {
    this.emit(eventType, data);
  }

  public emit(eventType: EventType, data: Record<string, unknown>): boolean {
    const event: TrackingEvent = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date(),
      data: {
        source: this.source,
        context: this.context,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        ...data,
      },
    };

    // Emit to event listeners
    super.emit(eventType, event);

    // Handle with registered handlers
    this.handlersForEventType(eventType).forEach((handler) => {
      try {
        const result = handler.handle(event);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error("Handler error:", error);
          });
        }
      } catch (error) {
        console.error("Handler error:", error);
      }
    });

    return true;
  }

  private handlersForEventType(eventType: EventType): EventHandler[] {
    return this.handlers.filter((handler) =>
      handler.supportedEventTypes.includes(eventType),
    );
  }
}
