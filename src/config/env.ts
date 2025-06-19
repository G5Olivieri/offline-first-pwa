interface SearchConfig {
  dbName: string;
  dbVersion: number;
  storeName: string;
  indexKey: string;
}

interface AppConfig {
  appTitle: string;
  appVersion: string;
  environment: string;

  terminalId: string;
  terminalName: string;

  couchdbUrl: string;
  couchdbUsername?: string;
  couchdbPassword?: string;
  enableSync: boolean;

  defaultLocale: string;
  defaultCurrency: string;
  defaultTimezone: string;

  enableOfflineMode: boolean;
  enableNotifications: boolean;
  enableDebugMode: boolean;

  themePrimaryColor: string;
  themeSecondaryColor: string;
  productsPerPage: number;
  maxSuggestions: number;

  sessionTimeout: number;
  maxLoginAttempts: number;
  enableCsrfProtection: boolean;

  apiTimeout: number;
  apiRetryAttempts: number;
  apiBaseUrl?: string;

  mockData: boolean;
  logLevel: string;

  search: SearchConfig;
}

/**
 * Get environment variable with type conversion and default value
 */
function getEnvVar<T>(
  key: string,
  defaultValue: T,
  converter?: (value: string) => T
): T {
  const value = import.meta.env[key];

  if (value === undefined || value === "") {
    return defaultValue;
  }

  if (converter) {
    try {
      return converter(value);
    } catch (error) {
      console.warn(`Failed to convert env var ${key}: ${error}`);
      return defaultValue;
    }
  }

  return value as T;
}

/**
 * Convert string to boolean
 */
function toBool(value: string): boolean {
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Convert string to number
 */
function toNumber(value: string): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return num;
}

function generateTerminalId(): string {
  const storedTerminalId = localStorage.getItem("terminalId");
  if (storedTerminalId) {
    return storedTerminalId;
  }

  const terminalId = crypto.randomUUID();

  localStorage.setItem("terminalId", terminalId);

  return terminalId;
}

export const config: AppConfig = {
  // Application Settings
  appTitle: getEnvVar("VITE_APP_TITLE", "Modern POS System"),
  appVersion: getEnvVar("VITE_APP_VERSION", "1.0.0"),
  environment: getEnvVar("VITE_APP_ENVIRONMENT", "development"),

  // Terminal Configuration
  terminalId: getEnvVar("VITE_TERMINAL_ID", generateTerminalId()),
  terminalName: getEnvVar("VITE_TERMINAL_NAME", "POS Terminal"),

  // Database Configuration
  couchdbUrl: getEnvVar("VITE_COUCHDB_URL", "http://localhost:5984"),
  couchdbUsername: getEnvVar("VITE_COUCHDB_USERNAME", undefined),
  couchdbPassword: getEnvVar("VITE_COUCHDB_PASSWORD", undefined),
  enableSync: getEnvVar("VITE_ENABLE_SYNC", true, toBool),

  // Localization Settings
  defaultLocale: getEnvVar("VITE_DEFAULT_LOCALE", "en-US"),
  defaultCurrency: getEnvVar("VITE_DEFAULT_CURRENCY", "USD"),
  defaultTimezone: getEnvVar("VITE_DEFAULT_TIMEZONE", "America/New_York"),

  // Feature Flags
  enableOfflineMode: getEnvVar("VITE_ENABLE_OFFLINE_MODE", true, toBool),
  enableNotifications: getEnvVar("VITE_ENABLE_NOTIFICATIONS", true, toBool),
  enableDebugMode: getEnvVar("VITE_ENABLE_DEBUG_MODE", false, toBool),

  // UI Configuration
  themePrimaryColor: getEnvVar("VITE_THEME_PRIMARY_COLOR", "#3B82F6"),
  themeSecondaryColor: getEnvVar("VITE_THEME_SECONDARY_COLOR", "#10B981"),
  productsPerPage: getEnvVar("VITE_PRODUCTS_PER_PAGE", 20, toNumber),
  maxSuggestions: getEnvVar("VITE_MAX_SUGGESTIONS", 4, toNumber),

  // Security Settings
  sessionTimeout: getEnvVar("VITE_SESSION_TIMEOUT", 1800000, toNumber), // 30 minutes
  maxLoginAttempts: getEnvVar("VITE_MAX_LOGIN_ATTEMPTS", 5, toNumber),
  enableCsrfProtection: getEnvVar("VITE_ENABLE_CSRF_PROTECTION", true, toBool),

  // API Configuration
  apiTimeout: getEnvVar("VITE_API_TIMEOUT", 30000, toNumber),
  apiRetryAttempts: getEnvVar("VITE_API_RETRY_ATTEMPTS", 3, toNumber),
  apiBaseUrl: getEnvVar("VITE_API_BASE_URL", undefined),

  // Development Settings
  mockData: getEnvVar("VITE_MOCK_DATA", false, toBool),
  logLevel: getEnvVar("VITE_LOG_LEVEL", "info"),

  search: {
    dbName: getEnvVar("VITE_SEARCH_DB_NAME", "search_index"),
    dbVersion: getEnvVar("VITE_SEARCH_DB_VERSION", 1, toNumber),
    storeName: getEnvVar("VITE_SEARCH_STORE_NAME", "products"),
    indexKey: getEnvVar("VITE_SEARCH_INDEX_KEY", "id"),
  },
};

/**
 * Check if running in development mode
 */
export const isDevelopment = config.environment === "development";

/**
 * Check if running in production mode
 */
export const isProduction = config.environment === "production";

/**
 * Check if debug mode is enabled
 */
export const isDebugMode = config.enableDebugMode || isDevelopment;

/**
 * Format currency according to configuration
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(config.defaultLocale, {
    style: "currency",
    currency: config.defaultCurrency,
  }).format(amount);
}

/**
 * Format date according to configuration
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(config.defaultLocale, {
    timeZone: config.defaultTimezone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
