export interface ErrorLog {
  id: string;
  type: "network" | "validation" | "application" | "system";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack?: string;
  timestamp: Date;
  context: Record<string, unknown>;
}
