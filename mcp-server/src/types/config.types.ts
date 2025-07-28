/**
 * Configuration types for the Spheron MCP Plugin
 */

import { SpheroNNetwork } from './spheron.types.js';

/**
 * Environment variable configuration
 */
export interface IEnvironmentConfig {
  readonly SPHERON_PRIVATE_KEY: string;
  readonly SPHERON_NETWORK: SpheroNNetwork;
  readonly PROVIDER_PROXY_URL: string;
  readonly YAML_API_URL: string;
  readonly LOG_LEVEL?: string;
  readonly NODE_ENV?: string;
}

/**
 * Logger configuration
 */
export interface ILoggerConfig {
  readonly level: string;
  readonly format: string;
  readonly enableConsole: boolean;
  readonly enableFile: boolean;
  readonly filename?: string;
}

/**
 * Server configuration
 */
export interface IServerConfig {
  readonly name: string;
  readonly version: string;
  readonly timeout: number;
  readonly retries: number;
}

/**
 * Application configuration
 */
export interface IAppConfig {
  readonly environment: IEnvironmentConfig;
  readonly logger: ILoggerConfig;
  readonly server: IServerConfig;
}

/**
 * Configuration validation result
 */
export interface IConfigValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * Default configuration values
 */
export interface IDefaultConfig {
  readonly SPHERON_NETWORK: SpheroNNetwork;
  readonly PROVIDER_PROXY_URL: string;
  readonly YAML_API_URL: string;
  readonly LOG_LEVEL: string;
  readonly SERVER_TIMEOUT: number;
  readonly SERVER_RETRIES: number;
}