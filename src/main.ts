import App from "@/app.vue";
import { router } from "@/router";
import { createPinia } from "pinia";
import { createApp } from "vue";
import "./style.css";

import { createGlobalErrorHandler } from "@/error/global-error-handler";

const app = createApp(App);
const pinia = createPinia();

createGlobalErrorHandler(app);

app.use(pinia).use(router).mount("#app");
