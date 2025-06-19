import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { LogLevel } from '../logger-service';

// Mock the config module with static values
vi.mock('../../config/env', () => ({
  config: {
    logLevel: 'debug',
    enableDebugMode: true,
  },
}));

// Import after mocking
import { logger, createLogger } from '../logger-service';

describe('Logger Service', () => {
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

    // Mock Date.now for consistent timestamps in tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-18T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Singleton Logger', () => {
    it('should log debug messages when debug mode is enabled', () => {
      logger.debug('Debug message', { data: 'test' });

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [DEBUG]',
        'Debug message',
        { data: 'test' }
      );
    });

    it('should log info messages', () => {
      logger.info('Info message', 123);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [INFO]',
        'Info message',
        123
      );
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [WARN]',
        'Warning message'
      );
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Error message', error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [ERROR]',
        'Error message',
        error
      );
    });

    it('should log messages using the generic log method', () => {
      logger.log('info', 'Generic log message', 'extra', 'args');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [INFO]',
        'Generic log message',
        'extra',
        'args'
      );
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect the configured log level from environment', () => {
      // Since we set debug level in mockConfig, all levels should log
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Debug Mode Handling', () => {
    it('should log debug messages when debug mode is enabled', () => {
      // Since we set enableDebugMode: true in mockConfig
      logger.debug('Debug message');
      logger.info('Info message');

      expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
    });
  });

  describe('Contextual Logger Factory', () => {
    it('should create a contextual logger with context prefix', () => {
      const contextLogger = createLogger('TestContext');

      contextLogger.info('Test message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [INFO]',
        '[TestContext] Test message'
      );
    });

    it('should support all log levels with context', () => {
      const contextLogger = createLogger('MyModule');

      contextLogger.debug('Debug with context');
      contextLogger.info('Info with context');
      contextLogger.warn('Warn with context');
      contextLogger.error('Error with context');

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [DEBUG]',
        '[MyModule] Debug with context'
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [INFO]',
        '[MyModule] Info with context'
      );
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [WARN]',
        '[MyModule] Warn with context'
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [ERROR]',
        '[MyModule] Error with context'
      );
    });

    it('should support the generic log method with context', () => {
      const contextLogger = createLogger('GenericTest');

      contextLogger.log('warn', 'Generic warning', { extra: 'data' });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [WARN]',
        '[GenericTest] Generic warning',
        { extra: 'data' }
      );
    });

    it('should handle multiple arguments with context', () => {
      const contextLogger = createLogger('MultiArgs');

      contextLogger.error('Error occurred', { errorCode: 500 }, 'additional info');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [ERROR]',
        '[MultiArgs] Error occurred',
        { errorCode: 500 },
        'additional info'
      );
    });
  });

  describe('Timestamp Formatting', () => {
    it('should include ISO timestamp in log messages', () => {
      const testTime = new Date('2025-12-25T15:45:30.123Z');
      vi.setSystemTime(testTime);

      logger.info('Timestamp test');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[2025-12-25T15:45:30.123Z] [INFO]',
        'Timestamp test'
      );
    });

    it('should use current time for each log message', () => {
      const time1 = new Date('2025-01-01T00:00:00.000Z');
      const time2 = new Date('2025-01-01T00:00:01.000Z');

      vi.setSystemTime(time1);
      logger.info('First message');

      vi.setSystemTime(time2);
      logger.info('Second message');

      expect(consoleSpy.info).toHaveBeenNthCalledWith(
        1,
        '[2025-01-01T00:00:00.000Z] [INFO]',
        'First message'
      );
      expect(consoleSpy.info).toHaveBeenNthCalledWith(
        2,
        '[2025-01-01T00:00:01.000Z] [INFO]',
        'Second message'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty messages', () => {
      logger.info('');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [INFO]',
        ''
      );
    });

    it('should handle null and undefined arguments', () => {
      logger.info('Message with null/undefined', null, undefined);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [INFO]',
        'Message with null/undefined',
        null,
        undefined
      );
    });

    it('should handle complex objects', () => {
      const complexObject = {
        nested: { data: 'value' },
        array: [1, 2, 3],
        func: () => 'test'
      };

      logger.info('Complex object', complexObject);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [INFO]',
        'Complex object',
        complexObject
      );
    });

    it('should handle very long context names', () => {
      const longContext = 'A'.repeat(100);
      const contextLogger = createLogger(longContext);

      contextLogger.info('Long context test');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[2025-06-18T10:30:00.000Z] [INFO]',
        `[${longContext}] Long context test`
      );
    });
  });

  describe('Type Safety', () => {
    it('should accept valid log levels', () => {
      const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

      validLevels.forEach(level => {
        expect(() => logger.log(level, 'Test message')).not.toThrow();
      });
    });

    it('should work with logger interface', () => {
      // This test ensures the logger implements the Logger interface correctly
      const testLogger = logger;

      expect(typeof testLogger.debug).toBe('function');
      expect(typeof testLogger.info).toBe('function');
      expect(typeof testLogger.warn).toBe('function');
      expect(typeof testLogger.error).toBe('function');
      expect(typeof testLogger.log).toBe('function');
    });

    it('should work with contextual logger interface', () => {
      const contextLogger = createLogger('TypeTest');

      expect(typeof contextLogger.debug).toBe('function');
      expect(typeof contextLogger.info).toBe('function');
      expect(typeof contextLogger.warn).toBe('function');
      expect(typeof contextLogger.error).toBe('function');
      expect(typeof contextLogger.log).toBe('function');
    });
  });  describe('Performance', () => {
    it('should process all messages when log level is debug', () => {
      // Since we set debug level in mockConfig, all levels should be processed
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid sequential logging', () => {
      const startTime = Date.now();

      // Log many messages rapidly
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(consoleSpy.info).toHaveBeenCalledTimes(100);
      expect(duration).toBeLessThan(100); // Should be fast
    });
  });

  describe('Integration with Environment Configuration', () => {
    it('should work with the mocked configuration', () => {
      // Test that our logger works with the current configuration
      logger.debug('Debug test');
      logger.info('Info test');
      logger.warn('Warn test');
      logger.error('Error test');

      // All should be logged since we're using debug level
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[DEBUG\]/),
        'Debug test'
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\]/),
        'Info test'
      );
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[WARN\]/),
        'Warn test'
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\]/),
        'Error test'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in message formatting gracefully', () => {
      const problematicObject = {
        toJSON: () => {
          throw new Error('JSON serialization error');
        }
      };

      // Should not throw even with problematic objects
      expect(() => {
        logger.info('Test with problematic object', problematicObject);
      }).not.toThrow();

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\]/),
        'Test with problematic object',
        problematicObject
      );
    });

    it('should handle circular references', () => {
      const circularObj: Record<string, unknown> = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => {
        logger.info('Circular reference test', circularObj);
      }).not.toThrow();

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\]/),
        'Circular reference test',
        circularObj
      );
    });
  });

  describe('Message Formatting', () => {
    it('should handle various argument types correctly', () => {
      const testCases = [
        ['string', 'hello'],
        ['number', 42],
        ['boolean', true],
        ['array', [1, 2, 3]],
        ['object', { key: 'value' }],
        ['null', null],
        ['undefined', undefined],
      ];

      testCases.forEach(([type, value]) => {
        logger.info(`Testing ${type}`, value);
      });

      expect(consoleSpy.info).toHaveBeenCalledTimes(testCases.length);
    });

    it('should maintain message order', () => {
      const messages = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

      messages.forEach(message => {
        logger.info(message);
      });

      messages.forEach((message, index) => {
        expect(consoleSpy.info).toHaveBeenNthCalledWith(
          index + 1,
          expect.stringMatching(/\[INFO\]/),
          message
        );
      });
    });
  });
});
