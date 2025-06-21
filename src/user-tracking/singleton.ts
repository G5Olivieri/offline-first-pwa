import { config } from "@/config/env";
import { ConsoleUserEventHandler } from "./console-user-event-handler";
import { NullTrackingService } from "./null-tracking-service";
import type { UserEventHandler } from "./user-event-handler";
import { UserTrackingPubSub } from "./user-tracking-pubsub";

const getUserTrackingSingleton = () => {
  if (config.tracking.user.enabled) {
    const tracking = new UserTrackingPubSub();
    const handlers: UserEventHandler[] = [];
    if (config.tracking.user.console.enabled) {
      handlers.push(new ConsoleUserEventHandler());
    }
    tracking.setHandlers(handlers);
    return tracking;
  }
  return new NullTrackingService();
};

export const userTrackingService = getUserTrackingSingleton();
