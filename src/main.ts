import App from "@/app.vue";
import { router } from "@/router";
import { createPinia } from "pinia";
import { createApp } from "vue";
import "./style.css";

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

app.use(pinia).use(router).mount("#app");
