import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./app.vue";
import { router } from "./router";
import { initializeAnalytics } from "./config/analytics";
import "./style.css";

// Initialize analytics before app creation
initializeAnalytics();

createApp(App).use(createPinia()).use(router).mount("#app");
