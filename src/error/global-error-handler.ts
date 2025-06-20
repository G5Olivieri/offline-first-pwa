import { errorTrackingService } from "@/error/singleton";
import type { App } from "vue";
export class GlobalErrorHandler {
  setupVueErrorHandler(app: App) {
    app.config.errorHandler = (error, instance, info) => {
      this.handleVueError(error, instance, info);
    };
  }

  setupWindowErrorHandler() {
    window.addEventListener("error", (event) => {
      this.handleWindowError(event.error, event as unknown as ErrorEvent);
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.handlePromiseRejection(event.reason, event);
    });
  }

  private async handleVueError(
    error: unknown,
    instance: unknown,
    info: string,
  ) {
    await this.processError(error as Error, {
      type: "vue-error",
      instance: this.getComponentName(instance),
      info,
    });
  }

  private async handleWindowError(error: Error, event: ErrorEvent) {
    await this.processError(error, {
      type: "javascript-error",
      filename: (event as unknown as { filename: string }).filename,
      lineno: (event as unknown as { lineno: number }).lineno,
      colno: (event as unknown as { colno: number }).colno,
    });
  }

  private async handlePromiseRejection(
    reason: unknown,
    event: PromiseRejectionEvent,
  ) {
    await this.processError(reason as Error, {
      type: "promise-rejection",
      promise: event.promise,
    });
    event.preventDefault();
  }

  private async processError(
    error: Error,
    context: Record<string, unknown> = {},
  ) {
    errorTrackingService.track(error, context);
  }

  private getComponentName(instance: unknown): string {
    try {
      // Try to extract component name from Vue instance
      const vueInstance = instance as {
        $options?: { name?: string; __name?: string };
        type?: { name?: string };
      };

      return (
        vueInstance?.$options?.name ||
        vueInstance?.$options?.__name ||
        vueInstance?.type?.name ||
        "Unknown"
      );
    } catch {
      return "Unknown";
    }
  }
}

// Factory function to create and configure global error handler
export function createGlobalErrorHandler(app: App) {
  const errorHandler = new GlobalErrorHandler();

  errorHandler.setupVueErrorHandler(app);
  errorHandler.setupWindowErrorHandler();

  return errorHandler;
}
