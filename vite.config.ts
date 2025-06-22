import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vueDevTools from "vite-plugin-vue-devtools";

// Bundle analysis plugins
import { visualizer } from "rollup-plugin-visualizer";
import analyze from "rollup-plugin-analyzer";

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
        "@": "/src",
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
        // Modular PouchDB packages
        "pouchdb-core",
        "pouchdb-adapter-idb",
        "pouchdb-adapter-http",
        "pouchdb-replication",
        "pouchdb-mapreduce",
        "pouchdb-find",
        "pouchdb-adapter-memory",
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

      // Optimize bundle size for PWA
      cssCodeSplit: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 300, // Warn for chunks larger than 500kb

      rollupOptions: {
        plugins: [
          // Detailed bundle analysis (output to console)
          analyze({
            summaryOnly: false,
            limit: 20,
            showExports: true,
          }),

          // Visual bundle analysis (generates HTML report)
          visualizer({
            filename: "dist/bundle-analysis.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
            template: "treemap", // Options: sunburst, treemap, network
          }),

          // Generate detailed JSON report for programmatic analysis
          visualizer({
            filename: "dist/bundle-stats.json",
            json: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ],
        output: {
          // Enhanced manual chunks for better tree-shaking in PWA
          manualChunks: (id) => {
            // Core Vue ecosystem - keep small and separate
            if (
              id.includes("node_modules/vue/") &&
              !id.includes("vue-router") &&
              !id.includes("vue-demi")
            ) {
              return "vue";
            }

            if (id.includes("node_modules/vue-router/")) {
              return "vue-router";
            }

            if (id.includes("node_modules/pinia/")) {
              return "pinia";
            }

            // PouchDB Ultra-granular chunks - split into tiny pieces for better caching
            // Core PouchDB functionality
            if (id.includes("node_modules/pouchdb-core")) {
              return "pouchdb-core";
            }

            // Browser storage adapters - separate for offline functionality
            if (id.includes("node_modules/pouchdb-adapter-idb")) {
              return "pouchdb-idb";
            }

            // Memory adapter for testing - separate chunk
            if (id.includes("node_modules/pouchdb-adapter-memory")) {
              return "pouchdb-memory";
            }

            // HTTP adapter for remote sync - separate for online functionality
            if (id.includes("node_modules/pouchdb-adapter-http")) {
              return "pouchdb-http";
            }

            // Replication functionality - lazy loaded only when syncing
            if (id.includes("node_modules/pouchdb-replication")) {
              return "pouchdb-replication";
            }

            // Query functionality - lazy loaded only when searching
            if (id.includes("node_modules/pouchdb-find")) {
              return "pouchdb-find";
            }

            // MapReduce functionality - lazy loaded only when using views
            if (id.includes("node_modules/pouchdb-mapreduce")) {
              return "pouchdb-mapreduce";
            }

            // PouchDB utilities and dependencies
            if (
              id.includes("node_modules/pouchdb-") ||
              id.includes("node_modules/leveldown") ||
              id.includes("node_modules/level")
            ) {
              return "pouchdb-utils";
            }

            // Legacy PouchDB full bundle (should not be used with modular setup)
            if (id.includes("node_modules/pouchdb/") && !id.includes("pouchdb-")) {
              return "pouchdb-legacy";
            }

            // VueUse - utility library, separate chunk
            if (id.includes("node_modules/@vueuse/")) {
              return "vueuse";
            }

            // Crypto and polyfills - separate chunk for browser compatibility
            if (
              id.includes("crypto-browserify") ||
              id.includes("stream-browserify") ||
              id.includes("buffer") ||
              id.includes("process")
            ) {
              return "polyfills";
            }

            // Database-specific chunks for lazy loading
            if (
              id.includes("src/db/product-db") ||
              id.includes("src/product/") ||
              id.includes("product-store") ||
              id.includes("product-service")
            ) {
              return "product";
            }

            if (
              id.includes("src/db/customer-db") ||
              id.includes("src/customer/") ||
              id.includes("customer-store") ||
              id.includes("customer-service")
            ) {
              return "customer";
            }

            if (
              id.includes("src/db/order-db") ||
              id.includes("src/types/order") ||
              id.includes("order-")
            ) {
              return "order";
            }

            if (
              id.includes("src/db/operator-db") ||
              id.includes("src/operator/")
            ) {
              return "operator";
            }

            // Database service chunks - lazy loaded for specific functionality
            if (
              id.includes("src/db/sync-service") ||
              id.includes("sync-")
            ) {
              return "db-sync";
            }

            if (
              id.includes("src/db/query-service") ||
              id.includes("find") ||
              id.includes("query")
            ) {
              return "db-query";
            }

            if (
              id.includes("src/db/pouchdb-config") ||
              id.includes("src/db.ts")
            ) {
              return "db-core";
            }

            // Error tracking and utilities
            if (
              id.includes("src/error/") ||
              id.includes("src/user-tracking/")
            ) {
              return "utils";
            }

            // Large vendor libraries
            if (id.includes("node_modules/")) {
              // Group small utilities together
              if (
                id.includes("lodash") ||
                id.includes("ramda") ||
                id.includes("date-fns")
              ) {
                return "vendor-utils";
              }

              // Default vendor chunk for remaining node_modules
              return "vendor";
            }

            // App code that doesn't fit other categories
            return undefined; // Let Vite decide
          },

          // Optimize chunk sizes for PWA
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split("/").pop()
              : "chunk";
            return `js/${facadeModuleId}-[hash].js`;
          },

          // Optimize entry naming
          entryFileNames: "js/[name]-[hash].js",

          // Optimize asset naming
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) {
              return "assets/[name]-[hash][extname]";
            }

            const info = assetInfo.name.split(".");
            const ext = info[info.length - 1];
            if (/\.(css)$/.test(assetInfo.name)) {
              return `css/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
        },

        // Improved tree-shaking configuration for PWA
        treeshake: {
          moduleSideEffects: (id) => {
            // PouchDB and some dependencies have side effects
            if (id.includes("pouchdb") || id.includes("level")) {
              return true;
            }
            // CSS files have side effects
            if (id.includes(".css")) {
              return true;
            }
            // Most other modules don't have side effects
            return false;
          },
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
          // More aggressive tree-shaking
          unknownGlobalSideEffects: false,
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
