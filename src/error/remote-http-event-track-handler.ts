import type { ErrorLog } from "@/error/error-log";
import type { EventTrackHandler } from "@/error/event-track-handler";

export class RemoteHttpEventTrackHandler implements EventTrackHandler {
  constructor(private readonly endpoint: string) {}
  public async handle(error: ErrorLog) {
    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Error-Source": "pos-frontend",
        },
        body: JSON.stringify({
          ...error,
          context: {
            ...error.context,
            userAgent: undefined,
          },
        }),
      });
    } catch (logError) {
      console.error("Failed to send error log to remote service:", logError);
    }
  }
}
