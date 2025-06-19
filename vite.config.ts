import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      vue(),
      vueDevTools(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",

        // Disable pwa assets generation for now to avoid build errors
        pwaAssets: {
          disabled: true,
        },

        manifest: {
          name: env.VITE_APP_TITLE || "Modern POS System",
          short_name: "POS",
          description: env.VITE_APP_TITLE || "Modern Point of Sale System",
          theme_color: env.VITE_THEME_PRIMARY_COLOR || "#3B82F6",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "landscape-primary",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "/favicon.svg",
              sizes: "any",
              type: "image/svg+xml",
            },
          ],
        },

        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          // Simplified runtime caching without the problematic cacheKeyWillBeUsed
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                },
              },
            },
          ],
        },

        devOptions: {
          enabled: env.VITE_ENABLE_PWA_DEV === "true",
          navigateFallback: "index.html",
          suppressWarnings: true,
          type: "module",
        },
      }),
    ],

    // Define global variables
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || "1.0.0"),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      global: "globalThis",
    },

    // Resolve configuration
    resolve: {
      alias: {
        // Provide browser-compatible alternatives
        crypto: "crypto-browserify",
        stream: "stream-browserify",
        assert: "assert",
        http: "stream-http",
        https: "https-browserify",
        os: "os-browserify/browser",
        url: "url",
        zlib: "browserify-zlib",
        util: "util",
        buffer: "buffer",
        process: "process/browser",
        path: "path-browserify",
        events: "events",
        constants: "constants-browserify",
      },
    },

    // Optimize dependencies
    optimizeDeps: {
      include: [
        "buffer",
        "process",
        "util",
        "events",
        "crypto-browserify",
        "stream-browserify",
        "assert",
        "url",
        "pouchdb-browser",
        "pouchdb-find",
      ],
      exclude: ["@vite-pwa/assets-generator"],
    },

    // Development server configuration
    server: {
      port: parseInt(env.VITE_DEV_PORT || "5173"),
      host: env.VITE_DEV_HOST || "localhost",
      open: env.VITE_DEV_OPEN === "true",
    },

    // Build configuration
    build: {
      sourcemap: env.VITE_BUILD_SOURCEMAP === "true",
      minify: env.VITE_BUILD_MINIFY !== "false",
      target: "es2015",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["vue", "vue-router", "pinia"],
            pouchdb: ["pouchdb-browser"],
          },
        },
        // Suppress external module warnings by explicitly externalizing problematic Node modules
        external: (id) => {
          if (
            id.includes("node:") ||
            [
              "fs",
              "child_process",
              "module",
              "v8",
              "tty",
              "perf_hooks",
              "vm",
            ].includes(id)
          ) {
            return true;
          }
          return false;
        },
      },
    },
  };
});
