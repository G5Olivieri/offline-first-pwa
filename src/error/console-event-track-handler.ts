import type { ErrorLog } from "./error-log";
import type { EventTrackHandler } from "./event-track-handler";

export class ConsoleEventTrackHandler implements EventTrackHandler {
  public async handle(event: ErrorLog): Promise<void> {
    console.log("Event tracked:", event);
  }
}
