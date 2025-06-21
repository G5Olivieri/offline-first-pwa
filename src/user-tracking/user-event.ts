export type UserEvent = {
  id: string;
  type: string;
  timestamp: Date;
  url: string;
  userAgent: string;
  terminalId: string;
  context?: Record<string, unknown>;
};
