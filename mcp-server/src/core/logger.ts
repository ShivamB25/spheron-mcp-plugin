/**
 * Structured logging service using Winston
 * Following NestJS logging patterns
 */

import winston from 'winston';
import { ILoggerConfig } from '../types/config.types.js';

/**
 * Log levels enum
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Logger service class
 */
export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;
  private context: string;

  private constructor(config: ILoggerConfig, context: string = 'Application') {
    this.context = context;
    this.logger = this.createLogger(config);
  }

  /**
   * Get or create singleton logger instance
   */
  public static getInstance(
    config?: ILoggerConfig,
    context?: string
  ): Logger {
    if (!Logger.instance) {
      if (!config) {
        throw new Error('Logger config is required for first initialization');
      }
      Logger.instance = new Logger(config, context);
    }
    return Logger.instance;
  }

  /**
   * Create a new logger instance with specific context
   */
  public static createContextLogger(context: string): Logger {
    if (!Logger.instance) {
      throw new Error('Logger must be initialized first');
    }
    const newLogger = Object.create(Logger.instance);
    newLogger.context = context;
    return newLogger;
  }

  /**
   * Create winston logger with configuration
   */
  private createLogger(config: ILoggerConfig): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    if (config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const contextStr = context ? `[${context}]` : '';
              const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level.toUpperCase()}] ${contextStr} ${message}${metaStr}`;
            })
          ),
        })
      );
    }

    // File transport
    if (config.enableFile && config.filename) {
      transports.push(
        new winston.transports.File({
          filename: config.filename,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
        })
      );
    }

    return winston.createLogger({
      level: config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true })
      ),
      transports,
      exitOnError: false,
    });
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error | unknown, context?: string): void {
    const logContext = context || this.context;
    const errorMeta = error instanceof Error ? { 
      stack: error.stack,
      name: error.name 
    } : { error };

    this.logger.error(message, { 
      context: logContext,
      ...errorMeta 
    });
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: string): void {
    const logContext = context || this.context;
    this.logger.warn(message, { context: logContext });
  }

  /**
   * Log info message
   */
  public info(message: string, context?: string): void {
    const logContext = context || this.context;
    this.logger.info(message, { context: logContext });
  }

  /**
   * Log debug message
   */
  public debug(message: string, meta?: Record<string, unknown> | string): void {
    const logContext = typeof meta === 'string' ? meta : this.context;
    const metadata = typeof meta === 'object' ? meta : {};
    this.logger.debug(message, {
      context: logContext,
      ...metadata
    });
  }

  /**
   * Log with custom level and metadata
   */
  public log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
    context?: string
  ): void {
    const logContext = context || this.context;
    this.logger.log(level, message, { 
      context: logContext,
      ...meta 
    });
  }

  /**
   * Create a child logger with additional metadata
   */
  public child(meta: Record<string, unknown>): winston.Logger {
    return this.logger.child(meta);
  }

  /**
   * Set log level dynamically
   */
  public setLevel(level: LogLevel): void {
    this.logger.level = level;
  }

  /**
   * Check if level is enabled
   */
  public isLevelEnabled(level: LogLevel): boolean {
    return this.logger.isLevelEnabled(level);
  }
}

/**
 * Create default logger configuration
 */
export function createDefaultLoggerConfig(): ILoggerConfig {
  return {
    level: process.env.LOG_LEVEL || LogLevel.INFO,
    format: 'combined',
    enableConsole: true,
    enableFile: false,
  };
}

/**
 * Initialize logger with configuration
 */
export function initializeLogger(config?: ILoggerConfig): Logger {
  const loggerConfig = config || createDefaultLoggerConfig();
  return Logger.getInstance(loggerConfig, 'SpheroNMCP');
}

/**
 * Get logger instance (must be initialized first)
 */
export function getLogger(context?: string): Logger {
  if (context) {
    return Logger.createContextLogger(context);
  }
  return Logger.getInstance();
}