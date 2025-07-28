/**
 * Custom error classes for Spheron MCP Plugin
 * Following NestJS exception handling patterns
 */

import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Base application error class
 */
export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize error for JSON responses
   */
  public toJSON = (): Record<string, unknown> => {
    return {
      code: this.code,
      context: this.context,
      message: this.message,
      name: this.name,
      statusCode: this.statusCode,
    };
  };
}

/**
 * Configuration related errors
 */
export class ConfigurationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 500, context);
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, context);
  }
}

/**
 * Spheron SDK related errors
 */
export class SpheroNError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'SPHERON_ERROR', 500, context);
  }
}

/**
 * YAML processing errors
 */
export class YamlProcessingError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'YAML_PROCESSING_ERROR', 400, context);
  }
}

/**
 * File system related errors
 */
export class FileSystemError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FILESYSTEM_ERROR', 400, context);
  }
}

/**
 * Network/API related errors
 */
export class NetworkError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 500, context);
  }
}

/**
 * Convert application errors to MCP errors
 */
export const toMcpError = (error: BaseError): { code: ErrorCode; message: string } => {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return {
        code: ErrorCode.InvalidParams,
        message: error.message,
      };
    case 'CONFIGURATION_ERROR':
      return {
        code: ErrorCode.InternalError,
        message: error.message,
      };
    case 'SPHERON_ERROR':
    case 'NETWORK_ERROR':
      return {
        code: ErrorCode.InternalError,
        message: error.message,
      };
    case 'YAML_PROCESSING_ERROR':
    case 'FILESYSTEM_ERROR':
      return {
        code: ErrorCode.InvalidParams,
        message: error.message,
      };
    default:
      return {
        code: ErrorCode.InternalError,
        message: 'An unexpected error occurred',
      };
  }
};

/**
 * Type guard to check if error is a BaseError
 */
export const isBaseError = (error: unknown): error is BaseError => {
  return error instanceof BaseError;
};

/**
 * Extract error message from unknown error type
 */
export const getErrorMessage = (error: unknown): string => {
  if (isBaseError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

/**
 * Create a standardized error response
 */
export const createErrorResponse = (
  error: unknown,
): {
  code?: string;
  context?: Record<string, unknown>;
  error: string;
  success: false;
} => {
  if (isBaseError(error)) {
    return {
      code: error.code,
      context: error.context,
      error: error.message,
      success: false,
    };
  }

  return {
    error: getErrorMessage(error),
    success: false,
  };
};
