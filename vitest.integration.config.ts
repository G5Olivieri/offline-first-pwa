import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: "node", // Use Node.js environment for LevelDB
    setupFiles: ["./src/test/setup-integration.ts"],
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
      "src/test/sync-*.test.ts",
    ],
    exclude: [
      "node_modules/",
      "dist/",
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
    "import.meta.env.VITE_SYNCING": "true",
  },
});
