import type { Tracking } from "./tracking";

export class NullTrackingService implements Tracking {
  track(): void {
    // Do nothing
  }

  on(): void {
    // Do nothing
  }

  off(): void {
    // Do nothing
  }

  emit(): void {
    // Do nothing
  }

  addHandler(): void {
    // Do nothing
  }

  removeHandler(): void {
    // Do nothing
  }
}
