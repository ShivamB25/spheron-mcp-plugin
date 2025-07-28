/**
 * Structured logging service using Winston
 * Following NestJS logging patterns
 */

import winston from 'winston';

import type { ILoggerConfig } from '../types/config.types.js';

/**
 * Log levels enum
 */
export enum LogLevel {
  DEBUG = 'debug',
  ERROR = 'error',
  INFO = 'info',
  WARN = 'warn',
}

/**
 * Logger service class
 */
export class Logger {
  private static instance: Logger | undefined;
  private readonly logger: winston.Logger;
  private readonly context: string;

  private constructor(config: ILoggerConfig, context = 'Application') {
    this.context = context;
    this.logger = this.createLogger(config);
  }

  /**
   * Get or create singleton logger instance
   */
  public static getInstance = (config: ILoggerConfig, context?: string): Logger => {
    Logger.instance ??= new Logger(config, context);
    return Logger.instance;
  };

  /**
   * Create a new logger instance with specific context
   */
  public static createContextLogger = (context: string): Logger => {
    if (!Logger.instance) {
      throw new Error('Logger must be initialized first');
    }
    const newLogger = Object.create(Logger.instance);
    newLogger.context = context;
    return newLogger;
  };

  /**
   * Create winston logger with configuration
   */
  private readonly createLogger = (config: ILoggerConfig): winston.Logger => {
    const transports: winston.transport[] = [];

    // Console transport
    if (config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.printf(({ context: logContext, level, message, timestamp, ...meta }) => {
              const contextStr = logContext
                ? `[${typeof logContext === 'string' ? logContext : JSON.stringify(logContext)}]`
                : '';
              const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `${String(timestamp)} [${String(level).toUpperCase()}] ${contextStr} ${String(message)}${metaStr}`;
            }),
          ),
        }),
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
            winston.format.json(),
          ),
        }),
      );
    }

    return winston.createLogger({
      exitOnError: false,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
      ),
      level: config.level,
      transports,
    });
  };

  /**
   * Log error message
   */
  public error = (
    message: string,
    error?: unknown,
    meta?: Record<string, unknown> | string,
  ): void => {
    const logContext = typeof meta === 'string' ? meta : this.context;
    const metadata = typeof meta === 'object' ? meta : {};

    let errorMeta: Record<string, unknown> = {};
    if (error) {
      if (error instanceof Error) {
        errorMeta = { message: error.message, name: error.name, stack: error.stack };
      } else {
        errorMeta = { error: JSON.stringify(error) };
      }
    }

    this.logger.error(message, {
      context: logContext,
      ...errorMeta,
      ...metadata,
    });
  };

  /**
   * Log warning message
   */
  public warn = (message: string, meta?: Record<string, unknown> | string): void => {
    const logContext = typeof meta === 'string' ? meta : this.context;
    const metadata = typeof meta === 'object' ? meta : {};
    this.logger.warn(message, {
      context: logContext,
      ...metadata,
    });
  };

  /**
   * Log info message
   */
  public info = (message: string, meta?: Record<string, unknown> | string): void => {
    const logContext = typeof meta === 'string' ? meta : this.context;
    const metadata = typeof meta === 'object' ? meta : {};
    this.logger.info(message, {
      context: logContext,
      ...metadata,
    });
  };

  /**
   * Log debug message
   */
  public debug = (message: string, meta?: Record<string, unknown> | string): void => {
    const logContext = typeof meta === 'string' ? meta : this.context;
    const metadata = typeof meta === 'object' ? meta : {};
    this.logger.debug(message, {
      context: logContext,
      ...metadata,
    });
  };

  /**
   * Log with custom level and metadata
   */
  public log = (
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
    context?: string,
  ): void => {
    const logContext = context ?? this.context;
    this.logger.log(level, message, {
      context: logContext,
      ...meta,
    });
  };

  /**
   * Create a child logger with additional metadata
   */
  public child = (meta: Record<string, unknown>): winston.Logger => {
    return this.logger.child(meta);
  };

  /**
   * Set log level dynamically
   */
  public setLevel = (level: LogLevel): void => {
    this.logger.level = level;
  };

  /**
   * Check if level is enabled
   */
  public isLevelEnabled = (level: LogLevel): boolean => {
    return this.logger.isLevelEnabled(level);
  };
}

/**
 * Create default logger configuration
 */
export const createDefaultLoggerConfig = (): ILoggerConfig => {
  return {
    enableConsole: true,
    enableFile: false,
    format: 'combined',
    level: process.env.LOG_LEVEL ?? LogLevel.INFO,
  };
};

/**
 * Initialize logger with configuration
 */
export const initializeLogger = (config?: ILoggerConfig): Logger => {
  const loggerConfig = config ?? createDefaultLoggerConfig();
  return Logger.getInstance(loggerConfig, 'SpheroNMCP');
};

/**
 * Get logger instance (must be initialized first)
 */
export const getLogger = (context?: string): Logger => {
  if (context) {
    return Logger.createContextLogger(context);
  }
  return Logger.getInstance(createDefaultLoggerConfig());
};
