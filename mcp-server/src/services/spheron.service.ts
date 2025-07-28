/**
 * Spheron Protocol SDK service
 * Following NestJS service patterns with single responsibility principle
 */

import { SpheronSDK } from '@spheron/protocol-sdk';
import { readFile } from 'fs/promises';
import axios from 'axios';
import {
  IDeploymentResult,
  ITokenBalance,
  ILeaseDetails,
  IDeploymentDetails,
  IEnvironmentVariables,
  ISpheroNSDKConfig
} from '../types/spheron.types.js';
import { ISerializedObject } from '../types/mcp-request.types.js';
import { 
  DeployComputeDto, 
  FetchBalanceDto, 
  FetchDeploymentUrlsDto, 
  FetchLeaseIdDto 
} from '../types/validation.types.js';
import { 
  SpheroNError, 
  NetworkError, 
  YamlProcessingError, 
  FileSystemError 
} from '../core/errors.js';
import { getLogger } from '../core/logger.js';

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
        network: config.network,
        hasPrivateKey: !!config.privateKey 
      });

      this.sdk = new SpheronSDK(config.network, config.privateKey);
      this.yamlApiUrl = config.yamlApiUrl || '';

      this.logger.info('Spheron SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Spheron SDK', error);
      throw new SpheroNError(
        `Failed to initialize Spheron SDK: ${error instanceof Error ? error.message : String(error)}`,
        { config: { network: config.network }, error }
      );
    }
  }

  /**
   * Deploy compute resources using various input methods
   */
  public async deployCompute(dto: DeployComputeDto): Promise<IDeploymentResult> {
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
        dto.provider_proxy_url || ''
      );

      // Handle BigInt serialization safely
      const safeResult = this.serializeBigIntValues(deploymentResult);

      const leaseId = this.getStringValue(safeResult, 'leaseId') || '';
      const result: IDeploymentResult = {
        leaseId,
        success: true,
        message: `Deployment created successfully with lease ID: ${leaseId}`,
        environment
      };

      this.logger.info('Compute deployment completed successfully', { 
        leaseId: result.leaseId 
      });

      return result;
    } catch (error) {
      this.logger.error('Compute deployment failed', error);
      
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
  public async fetchBalance(dto: FetchBalanceDto): Promise<ITokenBalance> {
    this.logger.info('Fetching wallet balance', { 
      token: dto.token,
      hasWalletAddress: !!dto.wallet_address 
    });

    try {
      const balance = await this.sdk.escrow.getUserBalance(dto.token, dto.wallet_address);

      // Convert from base units (assuming 6 decimals for most tokens)
      const decimals = 6;
      const result: ITokenBalance = {
        lockedBalance: this.convertTokenUnits(balance.lockedBalance.toString(), decimals),
        unlockedBalance: this.convertTokenUnits(balance.unlockedBalance.toString(), decimals),
        token: balance.token
      };

      this.logger.info('Balance fetched successfully', { 
        token: result.token,
        lockedBalance: result.lockedBalance,
        unlockedBalance: result.unlockedBalance
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch balance', error, { token: dto.token });
      
      throw new SpheroNError(
        `Failed to fetch balance for token ${dto.token}: ${error instanceof Error ? error.message : String(error)}`,
        { dto, error }
      );
    }
  }

  /**
   * Fetch deployment details and URLs
   */
  public async fetchDeploymentUrls(dto: FetchDeploymentUrlsDto): Promise<IDeploymentDetails> {
    this.logger.info('Fetching deployment URLs', { leaseId: dto.lease_id });

    try {
      const deploymentDetails = await this.sdk.deployment.getDeployment(
        dto.lease_id, 
        dto.provider_proxy_url || ''
      );

      // Handle BigInt serialization safely
      const safeDetails = this.serializeBigIntValues(deploymentDetails);

      const result: IDeploymentDetails = {
        leaseId: dto.lease_id,
        status: this.getStringValue(safeDetails, 'status') || 'unknown',
        urls: this.getArrayValue<string>(safeDetails, 'urls'),
        services: this.getObjectValue(safeDetails, 'services'),
        logs: this.getArrayValue<string>(safeDetails, 'logs')
      };

      this.logger.info('Deployment URLs fetched successfully', { 
        leaseId: result.leaseId,
        urlCount: result.urls?.length || 0
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch deployment URLs', error, { leaseId: dto.lease_id });
      
      throw new SpheroNError(
        `Failed to fetch deployment URLs for lease ${dto.lease_id}: ${error instanceof Error ? error.message : String(error)}`,
        { dto, error }
      );
    }
  }

  /**
   * Fetch detailed lease information
   */
  public async fetchLeaseDetails(dto: FetchLeaseIdDto): Promise<ILeaseDetails> {
    this.logger.info('Fetching lease details', { leaseId: dto.lease_id });

    try {
      const leaseDetails = await this.sdk.leases.getLeaseDetails(dto.lease_id);

      // Handle BigInt serialization safely
      const safeDetails = this.serializeBigIntValues(leaseDetails);

      const result: ILeaseDetails = {
        leaseId: dto.lease_id,
        status: this.getStringValue(safeDetails, 'status') || 'unknown',
        provider: this.getStringValue(safeDetails, 'provider') || '',
        tenant: this.getStringValue(safeDetails, 'tenant') || '',
        createdAt: this.getStringValue(safeDetails, 'createdAt') || new Date().toISOString(),
        expiresAt: this.getStringValue(safeDetails, 'expiresAt'),
        specifications: this.getObjectValue(safeDetails, 'specifications')
      };

      this.logger.info('Lease details fetched successfully', { 
        leaseId: result.leaseId,
        status: result.status
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch lease details', error, { leaseId: dto.lease_id });
      
      throw new SpheroNError(
        `Failed to fetch lease details for ${dto.lease_id}: ${error instanceof Error ? error.message : String(error)}`,
        { dto, error }
      );
    }
  }

  /**
   * Get YAML content based on input method (natural language, direct content, or file)
   */
  private async getYamlContent(dto: DeployComputeDto): Promise<string> {
    if (dto.request) {
      return await this.generateYamlFromRequest(dto.request);
    }
    
    if (dto.yaml_content) {
      this.logger.debug('Using provided YAML content');
      return dto.yaml_content;
    }
    
    if (dto.yaml_path) {
      return await this.loadYamlFromFile(dto.yaml_path);
    }

    throw new YamlProcessingError('No YAML input method provided');
  }

  /**
   * Generate YAML from natural language request using external API
   */
  private async generateYamlFromRequest(request: string): Promise<string> {
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
        this.logger.error('Invalid YAML API response', { responseData: response.data });
        throw new Error('Invalid YAML response structure from generator API');
      }

      this.logger.debug('YAML generated successfully from natural language request');
      return response.data.yaml;
    } catch (error) {
      this.logger.error('Failed to generate YAML from request', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new NetworkError('YAML generation request timed out', { request, error });
        }
        if (error.response) {
          throw new NetworkError(
            `YAML API returned ${error.response.status}: ${error.response.statusText}`,
            { request, response: error.response.data, error }
          );
        }
      }

      throw new NetworkError(
        `YAML generation failed: ${error instanceof Error ? error.message : String(error)}`,
        { request, error }
      );
    }
  }

  /**
   * Load YAML content from file
   */
  private async loadYamlFromFile(yamlPath: string): Promise<string> {
    this.logger.debug('Loading YAML from file', { path: yamlPath });

    try {
      const content = await readFile(yamlPath, 'utf8');
      this.logger.debug('YAML loaded successfully from file');
      return content;
    } catch (error) {
      this.logger.error('Failed to read YAML file', error, { path: yamlPath });
      
      throw new FileSystemError(
        `Failed to read YAML file: ${error instanceof Error ? error.message : String(error)}`,
        { path: yamlPath, error }
      );
    }
  }

  /**
   * Parse environment variables from YAML content
   */
  private parseYamlEnvironmentVariables(yamlContent: string): IEnvironmentVariables {
    try {
      const envMatch = yamlContent.match(/env:\n([\s\S]*?)(?=\n\S|$)/);
      if (!envMatch) {
        return {};
      }

      const envLines = envMatch[1].split('\n');
      const envVars: IEnvironmentVariables = {};

      envLines.forEach(line => {
        const match = line.trim().match(/-\s*(.*?)\s*=\s*(.*)/);
        if (match) {
          envVars[match[1]] = match[2];
        }
      });

      this.logger.debug('Parsed environment variables from YAML', {
        count: Object.keys(envVars).length
      });

      return envVars;
    } catch (error) {
      this.logger.warn('Failed to parse YAML environment variables', { error });
      return {};
    }
  }

  /**
   * Convert token units from base units to human-readable format
   */
  private convertTokenUnits(value: string, decimals: number): string {
    try {
      const bigIntValue = BigInt(value);
      const divisor = BigInt(10 ** decimals);
      
      const wholePart = bigIntValue / divisor;
      const fractionalPart = bigIntValue % divisor;
      
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '');
      
      return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString();
    } catch (error) {
      this.logger.warn('Failed to convert token units', { error, value, decimals });
      return value; // Return original value if conversion fails
    }
  }

  /**
   * Safely serialize objects containing BigInt values
   */
  private serializeBigIntValues(obj: unknown): ISerializedObject {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
  }

  /**
   * Safely extract string value from serialized object
   */
  private getStringValue(obj: ISerializedObject, key: string): string | undefined {
    const value = obj[key];
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Safely extract array value from serialized object
   */
  private getArrayValue<T>(obj: ISerializedObject, key: string): T[] | undefined {
    const value = obj[key];
    return Array.isArray(value) ? value as T[] : undefined;
  }

  /**
   * Safely extract object value from serialized object
   */
  private getObjectValue(obj: ISerializedObject, key: string): Record<string, unknown> | undefined {
    const value = obj[key];
    return (typeof value === 'object' && value !== null && !Array.isArray(value))
      ? value as Record<string, unknown>
      : undefined;
  }
}

/**
 * Create Spheron service instance
 */
export function createSpheroNService(config: ISpheroNSDKConfig): SpheroNService {
  return new SpheroNService(config);
}