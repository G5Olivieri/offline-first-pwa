import App from "@/app.vue";
import { router } from "@/router";
import { createPinia } from "pinia";
import { createApp } from "vue";
import "./style.css";

// Import error handling infrastructure
import { errorBus } from "@/error/error-event-bus";
import { createGlobalErrorHandler } from "@/error/global-error-handler";

const app = createApp(App);
const pinia = createPinia();

createGlobalErrorHandler(app, {
  enableConsoleLogging: import.meta.env.DEV,
  enableRemoteLogging: import.meta.env.PROD,
  enableUserNotification: true,
  logEndpoint: import.meta.env.VITE_ERROR_LOG_ENDPOINT,
  maxErrorsPerMinute: 5,
});

errorBus.subscribeToErrors((error) => {
  if (import.meta.env.DEV) {
    console.log("Error Bus Event:", error);
  }
});

app.use(pinia).use(router).mount("#app");
