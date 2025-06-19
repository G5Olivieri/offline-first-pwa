import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Logger Service - Log Level Filtering', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Spy on console methods
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    // Mock Date for consistent timestamps
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-18T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Warn Level Configuration', () => {
    // Mock config with warn log level
    vi.mock('../../config/env', () => ({
      config: {
        logLevel: 'warn',
        enableDebugMode: true,
      },
    }));

    it('should only log warn and error messages', async () => {
      const { logger } = await import('../logger-service');

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Logger Service - Debug Mode Disabled', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-18T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Debug Mode Disabled Configuration', () => {
    // Mock config with debug mode disabled
    vi.mock('../../config/env', () => ({
      config: {
        logLevel: 'debug',
        enableDebugMode: false,
      },
    }));

    it('should skip debug messages when debug mode is disabled', async () => {
      const { logger } = await import('../logger-service');

      logger.debug('Debug message');
      logger.info('Info message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Logger Service - Error Level Only', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-18T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Error Only Configuration', () => {
    // Mock config with error log level only
    vi.mock('../../config/env', () => ({
      config: {
        logLevel: 'error',
        enableDebugMode: true,
      },
    }));

    it('should only log error messages', async () => {
      const { logger } = await import('../logger-service');

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });
});
