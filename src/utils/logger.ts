/**
 * Simple logger utility for the application
 * Provides consistent logging across the application
 */
export class Logger {
  private static formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (meta) {
      return `${baseMessage} ${JSON.stringify(meta)}`;
    }
    
    return baseMessage;
  }

  /**
   * Log info level messages
   */
  static info(message: string, meta?: any): void {
    console.log(this.formatMessage('info', message, meta));
  }

  /**
   * Log error level messages
   */
  static error(message: string, error?: Error | any): void {
    const errorMeta = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    
    console.error(this.formatMessage('error', message, errorMeta));
  }

  /**
   * Log warning level messages
   */
  static warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  /**
   * Log debug level messages (only in development)
   */
  static debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

/**
 * Export default logger instance
 */
export const logger = Logger;