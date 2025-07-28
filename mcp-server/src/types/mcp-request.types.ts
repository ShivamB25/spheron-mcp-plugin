/**
 * MCP SDK request types
 * Proper typing for MCP SDK interactions
 */

/**
 * MCP tool call request parameters
 */
export interface IMcpToolCallParams {
  readonly name: string;
  readonly arguments?: Record<string, unknown>;
  readonly _meta?: {
    readonly progressToken?: string | number;
  };
}

/**
 * MCP tool call request
 */
export interface IMcpToolCallRequest {
  readonly params: IMcpToolCallParams;
  readonly method: 'tools/call';
}

/**
 * MCP content item
 */
export interface IMcpContentItem {
  readonly type: 'text';
  readonly text: string;
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