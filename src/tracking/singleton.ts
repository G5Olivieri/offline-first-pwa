import { config } from "@/config/env";
import { ConsoleEventHandler } from "./console-event-handler";
import { ErrorOnlyEventHandler } from "./error-only-event-handler";
import { NullTrackingService } from "./null-tracking-service";
import { RemoteHttpEventHandler } from "./remote-http-event-handler";
import type { EventHandler } from "./tracking";
import { TrackingService } from "./tracking-service";
import { UserOnlyEventHandler } from "./user-only-event-handler";

export const getTrackingService = (source: string) => {
  const handlers: EventHandler[] = [];

  // Add console handlers based on configuration
  if (
    config.tracking.error.console.enabled ||
    config.tracking.user.console.enabled
  ) {
    const consoleHandler = new ConsoleEventHandler();

    if (
      config.tracking.error.console.enabled &&
      config.tracking.user.console.enabled
    ) {
      handlers.push(consoleHandler);
    } else if (config.tracking.error.console.enabled) {
      handlers.push(new ErrorOnlyEventHandler(consoleHandler));
    } else if (config.tracking.user.console.enabled) {
      handlers.push(new UserOnlyEventHandler(consoleHandler));
    }
  }

  // Add remote handlers based on configuration
  if (config.tracking.error.remote.enabled) {
    const remoteHandler = new RemoteHttpEventHandler(
      config.tracking.error.remote.endpoint,
    );
    handlers.push(new ErrorOnlyEventHandler(remoteHandler));
  }

  // Check if any tracking is enabled
  if (config.tracking.error.enabled || config.tracking.user.enabled) {
    const tracking = new TrackingService(source);
    handlers.forEach((handler) => tracking.addHandler(handler));
    return tracking;
  }

  return new NullTrackingService();
};

export const trackingService = getTrackingService("global");
