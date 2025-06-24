import type { ErrorTracking } from "@/error/error-tracking";

export class NullTrackingService implements ErrorTracking {
  public track(): string {
    return "";
  }
}
