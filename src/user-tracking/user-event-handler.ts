export interface UserEventHandler {
  handle(event: Record<string, unknown>): void;
}
