/**
 * Spheron Protocol SDK service
 * Following NestJS service patterns with single responsibility principle
 */

import { SpheronSDK } from '@spheron/protocol-sdk';
import axios from 'axios';
import { readFile } from 'fs/promises';

import { 
  FileSystemError, 
  NetworkError, 
  SpheroNError, 
  YamlProcessingError} from '../core/errors.js';
import { getLogger } from '../core/logger.js';
import type { ISerializedObject } from '../types/mcp-request.types.js';
import type {
  IDeploymentDetails,
  IDeploymentResult,
  IEnvironmentVariables,
  ILeaseDetails,
  ISpheroNSDKConfig,
  ITokenBalance} from '../types/spheron.types.js';
import type { 
  DeployComputeDto, 
  FetchBalanceDto, 
  FetchDeploymentUrlsDto, 
  FetchLeaseIdDto 
} from '../types/validation.types.js';

/**
 * Spheron SDK service class
 */
export class SpheroNService {
  private readonly logger = getLogger('SpheroNService');
  private readonly sdk: SpheronSDK;
  private readonly yamlApiUrl: string;

  constructor(config: ISpheroNSDKConfig) {
    try {
      this.logger.info('Initializing Spheron SDK', {
        hasPrivateKey: !!config.privateKey,
        network: config.network
      });

      this.sdk = new SpheronSDK(config.network, config.privateKey);
      this.yamlApiUrl = config.yamlApiUrl ?? '';

      this.logger.info('Spheron SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Spheron SDK', error as Error);
      throw new SpheroNError(
        `Failed to initialize Spheron SDK: ${error instanceof Error ? error.message : String(error)}`,
        { config: { network: config.network }, error }
      );
    }
  }

  /**
   * Deploy compute resources using various input methods
   */
  public deployCompute = async (dto: DeployComputeDto): Promise<IDeploymentResult> => {
    this.logger.info('Starting compute deployment', { operation: dto.operation });

    try {
      // Get YAML content based on input method
      const yamlContent = await this.getYamlContent(dto);
      
      // Extract environment variables from YAML
      const environment = this.parseYamlEnvironmentVariables(yamlContent);

      // Create deployment using Spheron SDK
      this.logger.debug('Creating deployment with Spheron SDK');
      const deploymentResult = await this.sdk.deployment.createDeployment(
        yamlContent,
        dto.provider_proxy_url ?? ''
      );

      // Handle BigInt serialization safely
      const safeResult = this.serializeBigIntValues(deploymentResult);

      const leaseId = this.getStringValue(safeResult, 'leaseId') ?? '';
      const result: IDeploymentResult = {
        environment,
        leaseId,
        message: `Deployment created successfully with lease ID: ${leaseId}`,
        success: true
      };

      this.logger.info('Compute deployment completed successfully', { 
        leaseId: result.leaseId 
      });

      return result;
    } catch (error) {
      this.logger.error('Compute deployment failed', error as Error);
      
      if (error instanceof SpheroNError || error instanceof NetworkError || 
          error instanceof YamlProcessingError || error instanceof FileSystemError) {
        throw error;
      }

      throw new SpheroNError(
        `Deployment failed: ${error instanceof Error ? error.message : String(error)}`,
        { dto, error }
      );
    }
  }

  /**
   * Fetch user wallet balance for specified token
   */
  public fetchBalance = async (dto: FetchBalanceDto): Promise<ITokenBalance> => {
    this.logger.info('Fetching wallet balance', { 
      hasWalletAddress: !!dto.wallet_address,
      token: dto.token 
    });

    try {
      const balance = await this.sdk.escrow.getUserBalance(dto.token, dto.wallet_address);

      // Convert from base units (assuming 6 decimals for most tokens)
      const decimals = 6;
      const result: ITokenBalance = {
        lockedBalance: this.convertTokenUnits(balance.lockedBalance.toString(), decimals),
        token: balance.token,
        unlockedBalance: this.convertTokenUnits(balance.unlockedBalance.toString(), decimals)
      };

      this.logger.info('Balance fetched successfully', { 
        lockedBalance: result.lockedBalance,
        token: result.token,
        unlockedBalance: result.unlockedBalance
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch balance', error as Error, {
        token: dto.token,
      });
      
      throw new SpheroNError(
        `Failed to fetch balance for token ${dto.token}: ${error instanceof Error ? error.message : String(error)}`,
        { dto, error }
      );
    }
  }

  /**
   * Fetch deployment details and URLs
   */
  public fetchDeploymentUrls = async (dto: FetchDeploymentUrlsDto): Promise<IDeploymentDetails> => {
    this.logger.info('Fetching deployment URLs', { leaseId: dto.lease_id });

    try {
      const deploymentDetails = await this.sdk.deployment.getDeployment(
        dto.lease_id,
        dto.provider_proxy_url ?? ''
      );

      // Handle BigInt serialization safely
      const safeDetails = this.serializeBigIntValues(deploymentDetails);

      const result: IDeploymentDetails = {
        leaseId: dto.lease_id,
        logs: this.getArrayValue(safeDetails, 'logs'),
        services: this.getObjectValue(safeDetails, 'services'),
        status: this.getStringValue(safeDetails, 'status') ?? 'unknown',
        urls: this.getArrayValue(safeDetails, 'urls')
      };

      this.logger.info('Deployment URLs fetched successfully', {
        leaseId: result.leaseId,
        urlCount: result.urls?.length ?? 0
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch deployment URLs', error as Error, {
        leaseId: dto.lease_id,
      });
      
      throw new SpheroNError(
        `Failed to fetch deployment URLs for lease ${dto.lease_id}: ${error instanceof Error ? error.message : String(error)}`,
        { dto, error }
      );
    }
  }

  /**
   * Fetch detailed lease information
   */
  public fetchLeaseDetails = async (dto: FetchLeaseIdDto): Promise<ILeaseDetails> => {
    this.logger.info('Fetching lease details', { leaseId: dto.lease_id });

    try {
      const leaseDetails = await this.sdk.leases.getLeaseDetails(dto.lease_id);

      // Handle BigInt serialization safely
      const safeDetails = this.serializeBigIntValues(leaseDetails);

      const result: ILeaseDetails = {
        createdAt: this.getStringValue(safeDetails, 'createdAt') ?? new Date().toISOString(),
        expiresAt: this.getStringValue(safeDetails, 'expiresAt'),
        leaseId: dto.lease_id,
        provider: this.getStringValue(safeDetails, 'provider') ?? '',
        specifications: this.getObjectValue(safeDetails, 'specifications'),
        status: this.getStringValue(safeDetails, 'status') ?? 'unknown',
        tenant: this.getStringValue(safeDetails, 'tenant') ?? ''
      };

      this.logger.info('Lease details fetched successfully', { 
        leaseId: result.leaseId,
        status: result.status
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch lease details', error as Error, {
        leaseId: dto.lease_id,
      });
      
      throw new SpheroNError(
        `Failed to fetch lease details for ${dto.lease_id}: ${error instanceof Error ? error.message : String(error)}`,
        { dto, error }
      );
    }
  }

  /**
   * Get YAML content based on input method (natural language, direct content, or file)
   */
  private readonly getYamlContent = async (dto: DeployComputeDto): Promise<string> => {
    if (dto.request) {
      return this.generateYamlFromRequest(dto.request);
    }
    
    if (dto.yaml_content) {
      this.logger.debug('Using provided YAML content');
      return dto.yaml_content;
    }
    
    if (dto.yaml_path) {
      return this.loadYamlFromFile(dto.yaml_path);
    }

    throw new YamlProcessingError('No YAML input method provided');
  };

  /**
   * Generate YAML from natural language request using external API
   */
  private readonly generateYamlFromRequest = async (request: string): Promise<string> => {
    this.logger.debug('Generating YAML from natural language request');

    try {
      const response = await axios.post(
        this.yamlApiUrl,
        { request },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30 second timeout
        }
      );

      if (!response.data?.yaml) {
        this.logger.error('Invalid YAML API response', undefined, {
        responseData: response.data,
      });
        throw new Error('Invalid YAML response structure from generator API');
      }

      this.logger.debug('YAML generated successfully from natural language request');
      return response.data.yaml;
    } catch (error) {
      this.logger.error(
        'Failed to generate YAML from request',
        error as Error,
      );
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new NetworkError('YAML generation request timed out', { error, request });
        }
        if (error.response) {
          throw new NetworkError(
            `YAML API returned ${String(error.response.status)}: ${error.response.statusText}`,
            { error, request, response: String(error.response.data) }
          );
        }
      }

      throw new NetworkError(
        `YAML generation failed: ${error instanceof Error ? error.message : String(error)}`,
        { error, request }
      );
    }
  };

  /**
   * Load YAML content from file
   */
  private readonly loadYamlFromFile = async (yamlPath: string): Promise<string> => {
    this.logger.debug('Loading YAML from file', { path: yamlPath });

    try {
      const content = await readFile(yamlPath, 'utf8');
      this.logger.debug('YAML loaded successfully from file');
      return content;
    } catch (error) {
      this.logger.error('Failed to read YAML file', error as Error, {
        path: yamlPath,
      });
      
      throw new FileSystemError(
        `Failed to read YAML file: ${error instanceof Error ? error.message : String(error)}`,
        { error, path: yamlPath }
      );
    }
  };

  /**
   * Parse environment variables from YAML content
   */
  private readonly parseYamlEnvironmentVariables = (yamlContent: string): IEnvironmentVariables => {
    try {
      const envMatch = /env:\n([\s\S]*?)(?=\n\S|$)/.exec(yamlContent);
      if (!envMatch) {
        return {};
      }

      const envLines = envMatch[1].split('\n');
      const envVars: IEnvironmentVariables = {};

      envLines.forEach(line => {
        const match = /-\s*(.*?)\s*=\s*(.*)/.exec(line.trim());
        if (match) {
          envVars[match[1]] = match[2];
        }
      });

      this.logger.debug('Parsed environment variables from YAML', {
        count: Object.keys(envVars).length
      });

      return envVars;
    } catch (error) {
      this.logger.warn('Failed to parse YAML environment variables', {
        error,
      });
      return {};
    }
  };

  /**
   * Convert token units from base units to human-readable format
   */
  private readonly convertTokenUnits = (value: string, decimals: number): string => {
    try {
      const bigIntValue = BigInt(value);
      const divisor = BigInt(10 ** decimals);
      
      const wholePart = bigIntValue / divisor;
      const fractionalPart = bigIntValue % divisor;
      
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '');
      
      return fractionalStr ? `${String(wholePart)}.${fractionalStr}` : wholePart.toString();
    } catch (error) {
      this.logger.warn('Failed to convert token units', {
        decimals,
        error,
        value,
      });
      return value; // Return original value if conversion fails
    }
  };

  /**
   * Safely serialize objects containing BigInt values
   */
  private readonly serializeBigIntValues = (obj: unknown): ISerializedObject => {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
  };

  /**
   * Safely extract string value from serialized object
   */
  private readonly getStringValue = (obj: ISerializedObject, key: string): string | undefined => {
    const value = obj[key];
    return typeof value === 'string' ? value : undefined;
  };

  /**
   * Safely extract array value from serialized object
   */
  private readonly getArrayValue = (
    obj: ISerializedObject,
    key: string
  ): string[] | undefined => {
    const value = obj[key];
    return Array.isArray(value) ? value.map(String) : undefined;
  };

  /**
   * Safely extract object value from serialized object
   */
  private readonly getObjectValue = (obj: ISerializedObject, key: string): Record<string, unknown> | undefined => {
    const value = obj[key];
    return (typeof value === 'object' && value !== null && !Array.isArray(value))
      ? value as Record<string, unknown>
      : undefined;
  };
}

/**
 * Create Spheron service instance
 */
export const createSpheroNService = (config: ISpheroNSDKConfig): SpheroNService => {
  return new SpheroNService(config);
};