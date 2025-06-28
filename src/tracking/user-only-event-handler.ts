import { EventType } from "./tracking";
import type { EventHandler, TrackingEvent } from "./tracking";

export class UserOnlyEventHandler implements EventHandler {
  public supportedEventTypes: EventType[] = [EventType.USER];

  constructor(private readonly baseHandler: EventHandler) {}

  public handle(event: TrackingEvent): void | Promise<void> {
    if (event.type === EventType.USER) {
      return this.baseHandler.handle(event);
    }
  }
}
