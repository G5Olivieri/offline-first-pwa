import type { ErrorLog } from "@/error/error-log";
import type { ErrorTracking } from "@/error/error-tracking";
import type { EventTrackHandler } from "@/error/event-track-handler";

export class ErrorTrackingPubSub implements ErrorTracking {
  private handlers: EventTrackHandler[] = [];

  constructor(
    private readonly source: string,
    private readonly context?: Record<string, unknown>,
  ) {}

  public addHandler(handler: EventTrackHandler) {
    this.handlers.push(handler);
  }

  public removeHandler(handler: EventTrackHandler) {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  public clearHandlers() {
    this.handlers = [];
  }

  public setHandlers(handlers: EventTrackHandler[]) {
    this.handlers = handlers;
  }

  public track(error: Error, context: Record<string, unknown> = {}) {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      type: this.classifyError(error),
      severity: this.getSeverity(error),
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      context: {
        ...this.context,
        source: this.source,
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context,
      },
    };

    this.handlers.map(async (handler) => {
      try {
        await handler.handle(errorLog);
      } catch (handlerError) {
        console.error(
          `Error in error tracking handler (${handler.constructor.name}):`,
          handlerError,
        );
      }
    });

    return errorLog.id;
  }

  private classifyError(error: Error): ErrorLog["type"] {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("connection")
    ) {
      return "network";
    } else if (name === "validationerror" || message.includes("validation")) {
      return "validation";
    } else if (
      message.includes("quota") ||
      message.includes("storage") ||
      message.includes("memory")
    ) {
      return "system";
    }
    return "application";
  }

  private getSeverity(error: Error): ErrorLog["severity"] {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (
      message.includes("critical") ||
      name === "securityerror" ||
      message.includes("security")
    ) {
      return "critical";
    } else if (
      message.includes("network") ||
      name === "typeerror" ||
      message.includes("failed to fetch")
    ) {
      return "high";
    } else if (name === "validationerror" || message.includes("validation")) {
      return "medium";
    }
    return "low";
  }
}
