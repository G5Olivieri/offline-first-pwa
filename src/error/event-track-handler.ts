import type { ErrorLog } from "./error-log";

export interface EventTrackHandler {
  handle(event: ErrorLog): void | Promise<void>;
}
