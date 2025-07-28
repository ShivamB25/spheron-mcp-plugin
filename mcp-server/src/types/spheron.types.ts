/**
 * Spheron Protocol SDK related types and interfaces
 */

/**
 * Supported Spheron network types
 */
export type SpheroNNetwork = 'testnet' | 'mainnet';

/**
 * Available operations for Spheron MCP tool
 */
export type SpheroNOperation = 
  | 'deploy_compute' 
  | 'fetch_balance' 
  | 'fetch_deployment_urls' 
  | 'fetch_lease_id';

/**
 * Token information for balance operations
 */
export interface ITokenBalance {
  readonly lockedBalance: string;
  readonly unlockedBalance: string;
  readonly token: string;
}

/**
 * Deployment result from Spheron SDK
 */
export interface IDeploymentResult {
  readonly leaseId: string;
  readonly success: boolean;
  readonly message?: string;
  readonly environment?: Record<string, string>;
}

/**
 * Lease details from Spheron SDK
 */
export interface ILeaseDetails {
  readonly leaseId: string;
  readonly status: string;
  readonly provider: string;
  readonly tenant: string;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly specifications?: unknown;
}

/**
 * Deployment details with URLs and status
 */
export interface IDeploymentDetails {
  readonly leaseId: string;
  readonly status: string;
  readonly urls?: string[];
  readonly services?: Record<string, unknown>;
  readonly logs?: string[];
}

/**
 * YAML deployment configuration
 */
export interface IYamlConfig {
  readonly version: string;
  readonly services: Record<string, unknown>;
  readonly profiles?: Record<string, unknown>;
  readonly deployment?: Record<string, unknown>;
}

/**
 * Environment variables parsed from YAML
 */
export interface IEnvironmentVariables {
  readonly [key: string]: string;
}

/**
 * Provider proxy configuration
 */
export interface IProviderProxy {
  readonly baseUrl: string;
  readonly timeout?: number;
  readonly retries?: number;
}

/**
 * Spheron SDK configuration
 */
export interface ISpheroNSDKConfig {
  readonly network: SpheroNNetwork;
  readonly privateKey: string;
  readonly providerProxyUrl?: string;
  readonly yamlApiUrl?: string;
}