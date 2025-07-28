/**
 * Configuration types for the Spheron MCP Plugin
 */

import type { SpheroNNetwork } from './spheron.types.js';

/**
 * Environment variable configuration
 */
export interface IEnvironmentConfig {
  readonly LOG_LEVEL?: string;
  readonly NODE_ENV?: string;
  readonly PROVIDER_PROXY_URL: string;
  readonly SPHERON_NETWORK: SpheroNNetwork;
  readonly SPHERON_PRIVATE_KEY: string;
  readonly YAML_API_URL: string;
}

/**
 * Logger configuration
 */
export interface ILoggerConfig {
  readonly enableConsole: boolean;
  readonly enableFile: boolean;
  readonly filename?: string;
  readonly format: string;
  readonly level: string;
}

/**
 * Server configuration
 */
export interface IServerConfig {
  readonly name: string;
  readonly retries: number;
  readonly timeout: number;
  readonly version: string;
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
  readonly errors: string[];
  readonly isValid: boolean;
  readonly warnings: string[];
}

/**
 * Default configuration values
 */
export interface IDefaultConfig {
  readonly LOG_LEVEL: string;
  readonly PROVIDER_PROXY_URL: string;
  readonly SERVER_RETRIES: number;
  readonly SERVER_TIMEOUT: number;
  readonly SPHERON_NETWORK: SpheroNNetwork;
  readonly YAML_API_URL: string;
}