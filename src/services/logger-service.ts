/**
 * Logger service for the POS application
 * Provides structured logging with configurable levels
 */

import { config } from '../config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  log(level: LogLevel, message: string, ...args: unknown[]): void;
}

class LoggerService implements Logger {
  private readonly logLevels = ['debug', 'info', 'warn', 'error'];
  private readonly configLogLevel: number;

  constructor() {
    this.configLogLevel = this.logLevels.indexOf(config.logLevel);
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  log(level: LogLevel, message: string, ...args: unknown[]): void {
    // Skip debug messages if not in debug mode
    if (!config.enableDebugMode && level === 'debug') {
      return;
    }

    const messageLogLevel = this.logLevels.indexOf(level);

    if (messageLogLevel >= this.configLogLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

      // Use appropriate console method based on level
      switch (level) {
        case 'debug':
          console.debug(prefix, message, ...args);
          break;
        case 'info':
          console.info(prefix, message, ...args);
          break;
        case 'warn':
          console.warn(prefix, message, ...args);
          break;
        case 'error':
          console.error(prefix, message, ...args);
          break;
      }
    }
  }
}

// Export singleton instance
export const logger: Logger = new LoggerService();

// Export factory function for creating contextual loggers
export function createLogger(context: string): Logger {
  return {
    debug: (message: string, ...args: unknown[]) =>
      logger.debug(`[${context}] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) =>
      logger.info(`[${context}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) =>
      logger.warn(`[${context}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) =>
      logger.error(`[${context}] ${message}`, ...args),
    log: (level: LogLevel, message: string, ...args: unknown[]) =>
      logger.log(level, `[${context}] ${message}`, ...args),
  };
}
