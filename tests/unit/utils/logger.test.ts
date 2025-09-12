import { Logger } from '../../../src/utils/logger';

describe('Logger', () => {
  let originalConsoleLog: jest.SpyInstance;
  let originalConsoleWarn: jest.SpyInstance;
  let originalConsoleError: jest.SpyInstance;

  beforeEach(() => {
    // Mock console methods to capture output
    originalConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    originalConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    originalConsoleError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore original console methods
    originalConsoleLog.mockRestore();
    originalConsoleWarn.mockRestore();
    originalConsoleError.mockRestore();
  });

  describe('info', () => {
    it('should log info messages', () => {
      // Act
      Logger.info('Test info message');

      // Assert - Logger uses "INFO:" format, not "[INFO]"
      expect(originalConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('INFO:')
      );
      expect(originalConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      );
    });

    it('should log info messages with metadata', () => {
      // Arrange
      const metadata = { key: 'value', number: 42 };

      // Act
      Logger.info('Test info with meta', metadata);

      // Assert
      expect(originalConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('INFO:')
      );
      expect(originalConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Test info with meta')
      );
      expect(originalConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"key":"value"')
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      // Act
      Logger.warn('Test warning message');

      // Assert
      expect(originalConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('WARN:')
      );
      expect(originalConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Test warning message')
      );
    });

    it('should log warning messages with metadata', () => {
      // Arrange
      const metadata = { warning: true, level: 'high' };

      // Act
      Logger.warn('Test warning with meta', metadata);

      // Assert
      expect(originalConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('WARN:')
      );
      expect(originalConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Test warning with meta')
      );
      expect(originalConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('"warning":true')
      );
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      // Act
      Logger.error('Test error message');

      // Assert
      expect(originalConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('ERROR:')
      );
      expect(originalConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    it('should log error messages with Error objects', () => {
      // Arrange
      const testError = new Error('Test error object');

      // Act
      Logger.error('Test error with Error object', testError);

      // Assert
      expect(originalConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('ERROR:')
      );
      expect(originalConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Test error with Error object')
      );
      expect(originalConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test error object"')
      );
    });

    it('should log error messages with metadata objects', () => {
      // Arrange
      const metadata = { code: 500, details: 'Internal server error' };

      // Act
      Logger.error('Test error with metadata', metadata);

      // Assert
      expect(originalConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('ERROR:')
      );
      expect(originalConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Test error with metadata')
      );
      expect(originalConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('"code":500')
      );
    });

    it('should handle non-Error objects in error logging', () => {
      // Arrange
      const nonErrorObject = { notAnError: true, value: 'test' };

      // Act
      Logger.error('Test with non-Error object', nonErrorObject);

      // Assert
      expect(originalConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('ERROR:')
      );
      expect(originalConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Test with non-Error object')
      );
      expect(originalConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('"notAnError":true')
      );
    });
  });

  describe('formatMessage', () => {
    it('should format messages correctly with timestamp', () => {
      // Act
      Logger.info('Test message');

      // Assert - Logger uses "INFO:" format with timestamps
      const logCall = originalConsoleLog.mock.calls[0][0];
      expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message/);
    });

    it('should format messages with metadata', () => {
      // Act
      Logger.info('Test message', { test: true });

      // Assert
      const logCall = originalConsoleLog.mock.calls[0][0];
      expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message {"test":true}/);
    });

    it('should handle undefined metadata', () => {
      // Act
      Logger.info('Test message', undefined);

      // Assert
      const logCall = originalConsoleLog.mock.calls[0][0];
      expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message$/);
      expect(logCall).not.toContain('undefined');
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      // Act
      Logger.info('');

      // Assert
      expect(originalConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/INFO: $/)
      );
    });

    it('should handle null metadata', () => {
      // Act
      Logger.info('Test message', null);

      // Assert
      const logCall = originalConsoleLog.mock.calls[0][0];
      expect(logCall).not.toContain('null');
    });

    it('should handle circular reference in metadata', () => {
      // Arrange
      const circular: any = { name: 'test' };
      circular.self = circular;

      // Act & Assert - Should not throw and handle circular references gracefully
      expect(() => Logger.info('Test with circular', circular)).not.toThrow();
      
      // Should log placeholder for circular reference
      const logCall = originalConsoleLog.mock.calls[0][0];
      expect(logCall).toContain('[Circular Reference Object]');
    });
  });
});