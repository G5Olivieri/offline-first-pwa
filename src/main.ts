import App from "@/app.vue";
import { router } from "@/router";
import { createPinia } from "pinia";
import { createApp } from "vue";
import "./style.css";

// Import error handling infrastructure
import { errorBus } from "@/error/error-event-bus";
import { createGlobalErrorHandler } from "@/error/global-error-handler";

// Create the Vue app
const app = createApp(App);

// Create Pinia store
const pinia = createPinia();

// Setup error handling
createGlobalErrorHandler(app, {
  enableConsoleLogging: import.meta.env.DEV,
  enableRemoteLogging: import.meta.env.PROD,
  enableUserNotification: true,
  logEndpoint: import.meta.env.VITE_ERROR_LOG_ENDPOINT,
  maxErrorsPerMinute: 5,
});

// Global error bus listener for additional error handling
errorBus.subscribeToErrors((error) => {
  // Additional global error handling logic
  if (import.meta.env.DEV) {
    console.log("Error Bus Event:", error);
  }

  // Could trigger analytics, monitoring, etc.
});

// Use plugins and mount
app.use(pinia).use(router).mount("#app");
