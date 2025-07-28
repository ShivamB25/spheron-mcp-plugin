/**
 * Configuration management service
 * Following NestJS configuration patterns
 */

import { plainToClass, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
  ValidationError,
} from 'class-validator';
import dotenv from 'dotenv';

import {
  IAppConfig,
  IConfigValidationResult,
  IDefaultConfig,
  IEnvironmentConfig,
  ILoggerConfig,
  IServerConfig,
} from '../types/config.types.js';
import { SpheroNNetwork } from '../types/spheron.types.js';
import { ConfigurationError } from './errors.js';

// Load environment variables
dotenv.config();

/**
 * Environment configuration validation class
 */
class EnvironmentConfigValidation {
  @IsString()
  @IsNotEmpty()
  SPHERON_PRIVATE_KEY!: string;

  @IsEnum(['testnet', 'mainnet'])
  @Transform(({ value }) => value ?? 'testnet')
  SPHERON_NETWORK!: SpheroNNetwork;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value ?? 'https://provider-proxy.spheron.network')
  PROVIDER_PROXY_URL!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value ?? 'http://provider.cpu.gpufarm.xyz:32692/generate')
  YAML_API_URL!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value ?? 'info')
  LOG_LEVEL?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value ?? 'development')
  NODE_ENV?: string;
}

/**
 * Server configuration validation class
 */
class ServerConfigValidation {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value ?? 'Spheron-MCP')
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value ?? '0.1.0')
  version!: string;

  @IsNumber()
  @Min(1000)
  @Max(60000)
  @Transform(({ value }) => (value ? Number(value) : 30000))
  timeout!: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => (value ? Number(value) : 3))
  retries!: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: IDefaultConfig = {
  LOG_LEVEL: 'info',
  PROVIDER_PROXY_URL: 'https://provider-proxy.spheron.network',
  SERVER_RETRIES: 3,
  SERVER_TIMEOUT: 30000,
  SPHERON_NETWORK: 'testnet',
  YAML_API_URL: 'http://provider.cpu.gpufarm.xyz:32692/generate',
};

/**
 * Configuration service class
 */
export class ConfigService {
  private static instance: ConfigService | undefined;
  private readonly config: IAppConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Get singleton instance
   */
  public static getInstance = (): ConfigService => {
    ConfigService.instance ??= new ConfigService();
    return ConfigService.instance;
  };

  /**
   * Load and validate configuration
   */
  private readonly loadConfiguration = (): IAppConfig => {
    try {
      // Load environment configuration
      const envConfig = this.loadEnvironmentConfig();

      // Load server configuration
      const serverConfig = this.loadServerConfig();

      // Load logger configuration
      const loggerConfig = this.loadLoggerConfig();

      return {
        environment: envConfig,
        logger: loggerConfig,
        server: serverConfig,
      };
    } catch (error) {
      throw new ConfigurationError(
        `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`,
        { error },
      );
    }
  };

  /**
   * Load and validate environment configuration
   */
  private readonly loadEnvironmentConfig = (): IEnvironmentConfig => {
    const envVars = {
      LOG_LEVEL: process.env.LOG_LEVEL ?? DEFAULT_CONFIG.LOG_LEVEL,
      NODE_ENV: process.env.NODE_ENV,
      PROVIDER_PROXY_URL: process.env.PROVIDER_PROXY_URL ?? DEFAULT_CONFIG.PROVIDER_PROXY_URL,
      SPHERON_NETWORK: process.env.SPHERON_NETWORK ?? DEFAULT_CONFIG.SPHERON_NETWORK,
      SPHERON_PRIVATE_KEY: process.env.SPHERON_PRIVATE_KEY,
      YAML_API_URL: process.env.YAML_API_URL ?? DEFAULT_CONFIG.YAML_API_URL,
    };

    const config = plainToClass(EnvironmentConfigValidation, envVars);
    const errors = validateSync(config);

    if (errors.length > 0) {
      const errorMessages = this.formatValidationErrors(errors);
      throw new ConfigurationError(
        `Environment configuration validation failed: ${errorMessages.join(', ')}`,
        { errors: errorMessages },
      );
    }

    return config as IEnvironmentConfig;
  };

  /**
   * Load server configuration
   */
  private readonly loadServerConfig = (): IServerConfig => {
    const serverVars = {
      name: process.env.SERVER_NAME ?? 'Spheron-MCP',
      retries: process.env.SERVER_RETRIES ?? DEFAULT_CONFIG.SERVER_RETRIES.toString(),
      timeout: process.env.SERVER_TIMEOUT ?? DEFAULT_CONFIG.SERVER_TIMEOUT.toString(),
      version: process.env.SERVER_VERSION ?? '0.1.0',
    };

    const config = plainToClass(ServerConfigValidation, serverVars);
    const errors = validateSync(config);

    if (errors.length > 0) {
      const errorMessages = this.formatValidationErrors(errors);
      throw new ConfigurationError(
        `Server configuration validation failed: ${errorMessages.join(', ')}`,
        { errors: errorMessages },
      );
    }

    return config as IServerConfig;
  };

  /**
   * Load logger configuration
   */
  private readonly loadLoggerConfig = (): ILoggerConfig => {
    return {
      enableConsole: true,
      enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
      filename: process.env.LOG_FILE_PATH,
      format: 'combined',
      level: this.config.environment.LOG_LEVEL ?? DEFAULT_CONFIG.LOG_LEVEL,
    };
  };

  /**
   * Format validation errors into readable messages
   */
  private readonly formatValidationErrors = (errors: ValidationError[]): string[] => {
    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
  };

  /**
   * Get environment configuration
   */
  public getEnvironmentConfig = (): IEnvironmentConfig => {
    return this.config.environment;
  };

  /**
   * Get server configuration
   */
  public getServerConfig = (): IServerConfig => {
    return this.config.server;
  };

  /**
   * Get logger configuration
   */
  public getLoggerConfig = (): ILoggerConfig => {
    return this.config.logger;
  };

  /**
   * Get full application configuration
   */
  public getConfig = (): IAppConfig => {
    return this.config;
  };

  /**
   * Get specific configuration value by key
   */
  public get = (key: keyof IEnvironmentConfig) => {
    return this.config.environment[key];
  };

  /**
   * Check if configuration is valid
   */
  public validateConfiguration = (): IConfigValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate required environment variables
      if (!this.config.environment.SPHERON_PRIVATE_KEY) {
        errors.push('SPHERON_PRIVATE_KEY is required');
      }

      // Check for development environment warnings
      if (this.config.environment.NODE_ENV === 'development') {
        warnings.push('Running in development mode');
      }

      // Validate network configuration
      if (!['mainnet', 'testnet'].includes(this.config.environment.SPHERON_NETWORK)) {
        errors.push('SPHERON_NETWORK must be either "testnet" or "mainnet"');
      }

      return {
        errors,
        isValid: errors.length === 0,
        warnings,
      };
    } catch (error) {
      return {
        errors: [
          `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
        isValid: false,
        warnings,
      };
    }
  };

  /**
   * Check if running in development mode
   */
  public isDevelopment = (): boolean => {
    return this.config.environment.NODE_ENV === 'development';
  };

  /**
   * Check if running in production mode
   */
  public isProduction = (): boolean => {
    return this.config.environment.NODE_ENV === 'production';
  };
}

/**
 * Create and get configuration service instance
 */
export const createConfigService = (): ConfigService => {
  return ConfigService.getInstance();
};

/**
 * Get configuration service instance
 */
export const getConfig = (): ConfigService => {
  return ConfigService.getInstance();
};
