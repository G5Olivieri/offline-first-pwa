import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "src/main.ts",
        "src/vite-env.d.ts",
        "vite.config.ts",
        "vitest.config.ts",
        "tailwind.config.js",
        "postcss.config.js",
      ],
    },
    include: [
      "src/**/*.{test,spec}.{js,ts,vue}",
      "src/test/**/*.{test,spec}.{js,ts,vue}",
    ],
    exclude: [
      "node_modules/",
      "dist/",
      "docker/",
      "helm-chart/",
      "monitoring/",
      "scripts/",
    ],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  define: {
    // Mock environment variables for tests
    "import.meta.env.VITE_APP_TITLE": '"POS Test"',
    "import.meta.env.VITE_THEME_PRIMARY_COLOR": '"#3B82F6"',
    "import.meta.env.VITE_COUCHDB_URL": '"http://localhost:5984"',
    "import.meta.env.VITE_COUCHDB_USERNAME": '"test"',
    "import.meta.env.VITE_COUCHDB_PASSWORD": '"test"',
    "import.meta.env.VITE_SYNCING": "false",
  },
});
