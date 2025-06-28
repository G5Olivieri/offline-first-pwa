import { EventType } from "./tracking";
import type { EventHandler, TrackingEvent } from "./tracking";

export class RemoteHttpEventHandler implements EventHandler {
  public supportedEventTypes: EventType[] = [EventType.ERROR, EventType.USER];

  constructor(private readonly endpoint: string) {}

  public async handle(event: TrackingEvent): Promise<void> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          eventType: event.type,
          timestamp: event.timestamp.toISOString(),
          ...event.data,
        }),
      });

      if (!response.ok) {
        console.error(
          `Failed to send ${event.type} event to remote endpoint:`,
          response.statusText,
        );
      }
    } catch (error) {
      console.error(
        `Error sending ${event.type} event to remote endpoint:`,
        error,
      );
    }
  }
}
