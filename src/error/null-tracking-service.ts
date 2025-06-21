import type { ErrorTracking } from "./error-tracking";

export class NullTrackingService implements ErrorTracking {
  public track(): string {
    return "";
  }
}
