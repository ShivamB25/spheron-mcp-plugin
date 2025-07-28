/**
 * Model Context Protocol (MCP) related types and interfaces
 */

import { SpheroNOperation } from './spheron.types.js';

/**
 * MCP Tool response content
 */
export interface IMcpContent {
  readonly type: 'text';
  readonly text: string;
}

/**
 * MCP Tool response
 */
export interface IMcpResponse {
  readonly content: IMcpContent[];
  readonly isError?: boolean;
}

/**
 * MCP Tool success response
 */
export interface IMcpSuccessResponse<T = unknown> {
  readonly success: true;
  readonly data: T;
  readonly message?: string;
}

/**
 * MCP Tool error response
 */
export interface IMcpErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly code?: string;
}

/**
 * Generic MCP API response
 */
export type McpApiResponse<T = unknown> = IMcpSuccessResponse<T> | IMcpErrorResponse;

/**
 * MCP Tool input schema properties
 */
export interface IMcpToolInputSchema {
  readonly type: 'object';
  readonly properties: Record<string, unknown>;
  readonly required: string[];
  readonly oneOf?: unknown[];
}

/**
 * MCP Tool definition
 */
export interface IMcpTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: IMcpToolInputSchema;
}

/**
 * MCP Server capabilities
 */
export interface IMcpCapabilities {
  readonly tools: Record<string, unknown>;
}

/**
 * MCP Server info
 */
export interface IMcpServerInfo {
  readonly name: string;
  readonly version: string;
}

/**
 * MCP Server configuration
 */
export interface IMcpServerConfig {
  readonly info: IMcpServerInfo;
  readonly capabilities: IMcpCapabilities;
}

/**
 * Base arguments for all Spheron operations
 */
export interface IBaseOperationArgs {
  readonly operation: SpheroNOperation;
  readonly provider_proxy_url?: string;
}

/**
 * Deploy compute operation arguments
 */
export interface IDeployComputeArgs extends IBaseOperationArgs {
  readonly operation: 'deploy_compute';
  readonly request?: string;
  readonly yaml_content?: string;
  readonly yaml_path?: string;
}

/**
 * Fetch balance operation arguments
 */
export interface IFetchBalanceArgs extends IBaseOperationArgs {
  readonly operation: 'fetch_balance';
  readonly token: string;
  readonly wallet_address?: string;
}

/**
 * Fetch deployment URLs operation arguments
 */
export interface IFetchDeploymentUrlsArgs extends IBaseOperationArgs {
  readonly operation: 'fetch_deployment_urls';
  readonly lease_id: string;
}

/**
 * Fetch lease ID operation arguments
 */
export interface IFetchLeaseIdArgs extends IBaseOperationArgs {
  readonly operation: 'fetch_lease_id';
  readonly lease_id: string;
}

/**
 * Union type for all operation arguments
 */
export type OperationArgs = 
  | IDeployComputeArgs 
  | IFetchBalanceArgs 
  | IFetchDeploymentUrlsArgs 
  | IFetchLeaseIdArgs;