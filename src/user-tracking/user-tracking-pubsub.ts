import type { UserTracking } from "./user-tracking";
import type { UserEvent } from "./user-event";
import type { UserEventHandler } from "./user-event-handler";

export class UserTrackingPubSub implements UserTracking {
  private handlers: UserEventHandler[] = [];

  public setHandlers(handlers: UserEventHandler[]) {
    this.handlers = handlers;
  }

  public track(eventType: string, context: Record<string, unknown> = {}) {
    const userEvent: UserEvent = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context,
    };

    this.handlers.map(async (handler) => {
      try {
        await handler.handle(userEvent);
      } catch (error) {
        console.error(
          `Error in user event handler for event type "${eventType}":`,
          error,
        );
      }
    });
  }
}
