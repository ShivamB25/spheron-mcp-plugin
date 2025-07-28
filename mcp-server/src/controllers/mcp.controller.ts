/**
 * MCP Controller for handling Spheron operations
 * Following NestJS controller patterns with dependency injection
 */

import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema, 
  ErrorCode, 
  McpError 
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  McpApiResponse
} from '../types/mcp.types.js';
import {
  IDeploymentResult,
  ITokenBalance,
  ILeaseDetails,
  IDeploymentDetails
} from '../types/spheron.types.js';
import { SpheroNService } from '../services/spheron.service.js';
import { ValidationService } from '../services/validation.service.js';
import { 
  toMcpError, 
  createErrorResponse, 
  isBaseError 
} from '../core/errors.js';
import { getLogger } from '../core/logger.js';

/**
 * MCP Controller class
 */
export class McpController {
  private readonly logger = getLogger('McpController');

  constructor(
    private readonly spheronService: SpheroNService,
    private readonly validationService: ValidationService
  ) {}

  /**
   * Register handlers with MCP server
   */
  public registerHandlers(server: Server): void {
    this.logger.info('Registering MCP handlers');

    // Register list tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return this.listTools();
    });

    // Register call tool handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return this.callTool(request);
    });

    this.logger.info('MCP handlers registered successfully');
  }

  /**
   * List available tools
   */
  private async listTools() {
    this.logger.debug('Listing available tools');

    const tools = [
      {
        name: 'spheron_operation',
        description: 'Perform operations with Spheron Protocol including deployment, balance checking, and lease management',
        inputSchema: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              enum: ['deploy_compute', 'fetch_balance', 'fetch_deployment_urls', 'fetch_lease_id'],
              description: 'The operation to perform'
            },
            request: {
              type: 'string',
              description: 'Natural language request for deployment (deploy_compute only)'
            },
            yaml_content: {
              type: 'string',
              description: 'Direct YAML content for deployment (deploy_compute only)'
            },
            yaml_path: {
              type: 'string',
              description: 'Path to YAML file for deployment (deploy_compute only)'
            },
            token: {
              type: 'string',
              description: 'Token symbol (e.g., CST, USDC) for balance operations (fetch_balance only)'
            },
            wallet_address: {
              type: 'string',
              description: 'Wallet address to check (optional for fetch_balance)'
            },
            lease_id: {
              type: 'string',
              description: 'Lease/deployment ID (fetch_deployment_urls and fetch_lease_id only)'
            },
            provider_proxy_url: {
              type: 'string',
              description: 'Custom provider proxy URL (optional, defaults to configured value)'
            }
          },
          required: ['operation'],
          oneOf: [
            {
              properties: { operation: { const: 'deploy_compute' } },
              anyOf: [
                { required: ['request'] },
                { required: ['yaml_content'] },
                { required: ['yaml_path'] }
              ]
            },
            {
              properties: { operation: { const: 'fetch_balance' } },
              required: ['token']
            },
            {
              properties: { operation: { const: 'fetch_deployment_urls' } },
              required: ['lease_id']
            },
            {
              properties: { operation: { const: 'fetch_lease_id' } },
              required: ['lease_id']
            }
          ]
        }
      }
    ];

    this.logger.debug('Tools listed successfully', { toolCount: tools.length });
    return { tools };
  }

  /**
   * Handle tool call requests
   * @param request - MCP SDK request object (must be `any` to match SDK's CallToolRequestSchema handler signature)
   */
  private async callTool(request: any) {
    const toolName = request.params.name;
    this.logger.info('Processing tool call', { toolName });

    try {
      // Validate tool name
      if (toolName !== 'spheron_operation') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${toolName}`
        );
      }

      const args = request.params.arguments || {};
      
      // Validate and transform arguments
      const validatedDto = await this.validationService.validateOperationArgs(args);
      
      // Execute operation based on type - use union type for result
      let result: IDeploymentResult | ITokenBalance | IDeploymentDetails | ILeaseDetails;
      
      switch (validatedDto.operation) {
        case 'deploy_compute':
          result = await this.spheronService.deployCompute(validatedDto);
          break;
          
        case 'fetch_balance':
          result = await this.spheronService.fetchBalance(validatedDto);
          break;
          
        case 'fetch_deployment_urls':
          result = await this.spheronService.fetchDeploymentUrls(validatedDto);
          break;
          
        case 'fetch_lease_id':
          result = await this.spheronService.fetchLeaseDetails(validatedDto);
          break;
          
        default:
          // This should never happen due to validation, but TypeScript requires it
          const exhaustiveCheck: never = validatedDto;
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown operation: ${(exhaustiveCheck as { operation: string }).operation}`
          );
      }

      // Create success response
      const response: McpApiResponse = {
        success: true,
        data: result
      };

      this.logger.info('Tool call completed successfully', {
        toolName,
        operation: validatedDto.operation
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('Tool call failed', error, { toolName });

      // Handle MCP errors
      if (error instanceof McpError) {
        throw error;
      }

      // Handle custom application errors
      if (isBaseError(error)) {
        const mcpError = toMcpError(error);
        throw new McpError(mcpError.code, mcpError.message);
      }

      // Handle unknown errors
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Create MCP controller instance
 */
export function createMcpController(
  spheronService: SpheroNService,
  validationService: ValidationService
): McpController {
  return new McpController(spheronService, validationService);
}