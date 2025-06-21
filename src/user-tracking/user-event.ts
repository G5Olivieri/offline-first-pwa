export type UserEvent = {
  id: string;
  type: string;
  timestamp: Date;
  url: string;
  userAgent: string;
  context?: Record<string, unknown>;
};
