import type { ErrorLog } from "./error-log";
import type { EventTrackHandler } from "./event-track-handler";

export class RemoteHttpErrorTrackHandler implements EventTrackHandler {
  public async handle(error: ErrorLog) {
    try {
      // TODO: config/env
      const logEndpoint = import.meta.env.VITE_ERROR_LOG_ENDPOINT;
      if (!logEndpoint) {
        return;
      }

      await fetch(logEndpoint, {
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
