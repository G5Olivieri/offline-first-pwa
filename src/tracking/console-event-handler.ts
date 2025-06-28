import { EventType } from "./tracking";
import type { EventHandler, TrackingEvent } from "./tracking";

export class ConsoleEventHandler implements EventHandler {
  public supportedEventTypes: EventType[] = [EventType.ERROR, EventType.USER];

  public handle(event: TrackingEvent): void {
    const { type, timestamp, data } = event;

    switch (type) {
      case EventType.ERROR:
        console.error(`[${timestamp.toISOString()}] Error:`, data);
        break;
      case EventType.USER:
        console.log(`[${timestamp.toISOString()}] User Event:`, data);
        break;
      default:
        console.log(`[${timestamp.toISOString()}] ${type}:`, data);
    }
  }
}
