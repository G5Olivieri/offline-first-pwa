import { EventType } from "./tracking";
import type { EventHandler, TrackingEvent } from "./tracking";

export class ErrorOnlyEventHandler implements EventHandler {
  public supportedEventTypes: EventType[] = [EventType.ERROR];

  constructor(private readonly baseHandler: EventHandler) {}

  public handle(event: TrackingEvent): void | Promise<void> {
    if (event.type === EventType.ERROR) {
      return this.baseHandler.handle(event);
    }
  }
}
