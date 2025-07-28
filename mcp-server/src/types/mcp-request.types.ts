/**
 * MCP SDK request types
 * Proper typing for MCP SDK interactions
 */

/**
 * MCP tool call request parameters
 */
export interface IMcpToolCallParams {
  readonly _meta?: {
    readonly progressToken?: string | number;
  };
  readonly arguments?: Record<string, unknown>;
  readonly name: string;
}

/**
 * MCP tool call request
 */
export interface IMcpToolCallRequest {
  readonly method: 'tools/call';
  readonly params: IMcpToolCallParams;
}

/**
 * MCP content item
 */
export interface IMcpContentItem {
  readonly text: string;
  readonly type: 'text';
}

/**
 * MCP tool response
 */
export interface IMcpToolResponse {
  readonly content: IMcpContentItem[];
  readonly isError?: boolean;
}

/**
 * SpheronSDK constructor parameters
 */
export type SpheroNSDKNetworkParam = 'testnet' | 'mainnet';

/**
 * Serialized object (BigInt converted to string)
 */
export interface ISerializedObject {
  readonly [key: string]: string | number | boolean | ISerializedObject | ISerializedObject[] | null;
}