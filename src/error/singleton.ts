import { config } from "@/config/env";
import { ConsoleEventTrackHandler } from "./console-event-track-handler";
import { ErrorTrackingPubSub } from "./error-tracking-service";
import type { EventTrackHandler } from "./event-track-handler";
import { NullTrackingService } from "./null-tracking-service";
import { RemoteHttpEventTrackHandler } from "./remote-http-event-track-handler";

const getTrackingService = () => {
  if (config.tracking.error.enabled) {
    const handlers: EventTrackHandler[] = [];
    if (config.tracking.error.console.enabled) {
      handlers.push(new ConsoleEventTrackHandler());
    }
    if (config.tracking.error.remote.enabled) {
      handlers.push(
        new RemoteHttpEventTrackHandler(config.tracking.error.remote.endpoint),
      );
    }
    const tracking = new ErrorTrackingPubSub("global");
    tracking.setHandlers(handlers);
    return tracking;
  }
  return new NullTrackingService();
};

export const errorTrackingService = getTrackingService();
