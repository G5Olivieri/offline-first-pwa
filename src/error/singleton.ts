import { config } from "@/config/env";
import { ErrorTrackingPubSub } from "./error-tracking-service";
import { NullTrackingService } from "./null-tracking-service";

export const errorTrackingService = config.tracking.enabled
  ? new ErrorTrackingPubSub("global")
  : new NullTrackingService();
