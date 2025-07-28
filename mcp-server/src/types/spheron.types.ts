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
  readonly token: string;
  readonly unlockedBalance: string;
}

/**
 * Deployment result from Spheron SDK
 */
export interface IDeploymentResult {
  readonly environment?: Record<string, string>;
  readonly leaseId: string;
  readonly message?: string;
  readonly success: boolean;
}

/**
 * Lease details from Spheron SDK
 */
export interface ILeaseDetails {
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly leaseId: string;
  readonly provider: string;
  readonly specifications?: unknown;
  readonly status: string;
  readonly tenant: string;
}

/**
 * Deployment details with URLs and status
 */
export interface IDeploymentDetails {
  readonly leaseId: string;
  readonly logs?: string[];
  readonly services?: Record<string, unknown>;
  readonly status: string;
  readonly urls?: string[];
}

/**
 * YAML deployment configuration
 */
export interface IYamlConfig {
  readonly deployment?: Record<string, unknown>;
  readonly profiles?: Record<string, unknown>;
  readonly services: Record<string, unknown>;
  readonly version: string;
}

/**
 * Environment variables parsed from YAML
 */
export type IEnvironmentVariables = Record<string, string>;

/**
 * Provider proxy configuration
 */
export interface IProviderProxy {
  readonly baseUrl: string;
  readonly retries?: number;
  readonly timeout?: number;
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