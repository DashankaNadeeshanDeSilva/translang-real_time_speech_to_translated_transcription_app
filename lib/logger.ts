/**
 * Structured Logging Utility
 * 
 * Provides consistent logging across the application.
 * In production, logs can be sent to external service (CloudWatch, Datadog, etc.)
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private minLevel: LogLevel;

  constructor() {
    // Set minimum log level based on environment
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatEntry(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formatted += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    
    if (error) {
      formatted += `\nError: ${error.message}`;
      if (error.stack) {
        formatted += `\nStack: ${error.stack}`;
      }
    }
    
    return formatted;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    // Console output
    const formatted = this.formatEntry(entry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }

    // In production, send to external logging service
    if (!this.isDevelopment) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // TODO: Implement external logging service integration
    // Examples:
    // - AWS CloudWatch
    // - Datadog
    // - LogRocket
    // - Sentry (for errors)
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, context?: Record<string, any>) {
    this.info(`API Request: ${method} ${path}`, context);
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, status: number, duration: number) {
    this.info(`API Response: ${method} ${path}`, { status, duration });
  }

  /**
   * Log API error
   */
  apiError(method: string, path: string, error: Error, context?: Record<string, any>) {
    this.error(`API Error: ${method} ${path}`, error, context);
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create scoped logger for specific module
 */
export function createLogger(scope: string) {
  return {
    debug: (message: string, context?: Record<string, any>) =>
      logger.debug(`[${scope}] ${message}`, context),
    info: (message: string, context?: Record<string, any>) =>
      logger.info(`[${scope}] ${message}`, context),
    warn: (message: string, context?: Record<string, any>) =>
      logger.warn(`[${scope}] ${message}`, context),
    error: (message: string, error?: Error, context?: Record<string, any>) =>
      logger.error(`[${scope}] ${message}`, error, context),
  };
}

