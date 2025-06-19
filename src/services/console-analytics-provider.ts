import type { AnalyticsEvent, AnalyticsProvider } from "../types/analytics";
import { createLogger } from "./logger-service";

const logger = createLogger("ConsoleAnalyticsProvider");

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  public readonly name = "console";
  private debug: boolean;

  constructor(debug = true) {
    this.debug = debug;
    logger.debug("Console Analytics Provider initialized", { debug });
  }

  track(event: AnalyticsEvent): void {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      provider: this.name,
    };

    if (this.debug) {
      logger.info("📊 Analytics Event", enrichedEvent);
    }

    // Format for console output
    console.group(`🎯 ${event.category.toUpperCase()}: ${event.name}`);
    console.log(
      "📅 Timestamp:",
      new Date(enrichedEvent.timestamp).toISOString()
    );

    if (event.userId) {
      console.log("👤 User ID:", event.userId);
    }

    if (event.sessionId) {
      console.log("🔗 Session ID:", event.sessionId);
    }

    if (event.properties && Object.keys(event.properties).length > 0) {
      console.log("📋 Properties:", event.properties);
    }

    if (event.context) {
      console.log("🌐 Context:", event.context);
    }

    console.groupEnd();
  }

  identify(
    userId: string,
    properties?: Record<string, string | number | boolean>
  ): void {
    console.group("🆔 User Identification");
    console.log("👤 User ID:", userId);
    if (properties) {
      console.log("📋 Properties:", properties);
    }
    console.groupEnd();

    if (this.debug) {
      logger.info("User identified", { userId, properties });
    }
  }

  page(
    name: string,
    properties?: Record<string, string | number | boolean>
  ): void {
    console.group("📄 Page View");
    console.log("🏠 Page:", name);
    if (properties) {
      console.log("📋 Properties:", properties);
    }
    console.groupEnd();

    if (this.debug) {
      logger.info("Page view tracked", { page: name, properties });
    }
  }

  configure(config: Record<string, string | number | boolean>): void {
    if ("debug" in config && typeof config.debug === "boolean") {
      this.debug = config.debug;
    }

    logger.info("Console Analytics Provider configured", config);
  }
}
