/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />

interface ImportMetaEnv {
  // Application Settings
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENVIRONMENT: string;

  // Database Configuration
  readonly VITE_COUCHDB_URL: string;
  readonly VITE_COUCHDB_USERNAME?: string;
  readonly VITE_COUCHDB_PASSWORD?: string;
  readonly VITE_ENABLE_SYNC: string;

  // Localization Settings
  readonly VITE_DEFAULT_LOCALE: string;
  readonly VITE_DEFAULT_CURRENCY: string;
  readonly VITE_DEFAULT_TIMEZONE: string;

  // Feature Flags
  readonly VITE_ENABLE_OFFLINE_MODE: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_NOTIFICATIONS: string;
  readonly VITE_ENABLE_DEBUG_MODE: string;

  // UI Configuration
  readonly VITE_THEME_PRIMARY_COLOR: string;
  readonly VITE_THEME_SECONDARY_COLOR: string;
  readonly VITE_PRODUCTS_PER_PAGE: string;
  readonly VITE_MAX_SUGGESTIONS: string;

  // Security Settings
  readonly VITE_SESSION_TIMEOUT: string;
  readonly VITE_MAX_LOGIN_ATTEMPTS: string;
  readonly VITE_ENABLE_CSRF_PROTECTION: string;

  // API Configuration
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_API_RETRY_ATTEMPTS: string;
  readonly VITE_API_BASE_URL?: string;

  // Development Settings
  readonly VITE_MOCK_DATA: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_DEV_PORT: string;
  readonly VITE_DEV_HOST: string;
  readonly VITE_DEV_OPEN: string;

  // Build Settings
  readonly VITE_BUILD_SOURCEMAP: string;
  readonly VITE_BUILD_MINIFY: string;
  readonly VITE_ENABLE_PWA_DEV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global build-time constants
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
