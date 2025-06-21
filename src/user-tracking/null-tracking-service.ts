import type { UserTracking } from "./user-tracking";

export class NullTrackingService implements UserTracking {
  public track(): string {
    return "";
  }
}
