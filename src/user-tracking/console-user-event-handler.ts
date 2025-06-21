import type { UserEventHandler } from "./user-event-handler";

export class ConsoleUserEventHandler implements UserEventHandler {
  public handle(event: Record<string, unknown>): void {
    console.log("User Event:", event.type, event);
  }
}
