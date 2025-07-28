/**
 * Validation types and DTOs using class-validator approach
 */

import { IsString, IsOptional, IsEnum, IsNotEmpty, ValidateIf } from 'class-validator';
import { SpheroNOperation, SpheroNNetwork } from './spheron.types.js';

/**
 * Base DTO for all Spheron operations
 */
export class BaseOperationDto {
  @IsEnum(['deploy_compute', 'fetch_balance', 'fetch_deployment_urls', 'fetch_lease_id'])
  @IsNotEmpty()
  operation!: SpheroNOperation;

  @IsOptional()
  @IsString()
  provider_proxy_url?: string;
}

/**
 * DTO for deploy compute operation
 */
export class DeployComputeDto extends BaseOperationDto {
  @IsEnum(['deploy_compute'])
  declare operation: 'deploy_compute';

  @ValidateIf(o => !o.yaml_content && !o.yaml_path)
  @IsString()
  @IsNotEmpty()
  request?: string;

  @ValidateIf(o => !o.request && !o.yaml_path)
  @IsString()
  @IsNotEmpty()
  yaml_content?: string;

  @ValidateIf(o => !o.request && !o.yaml_content)
  @IsString()
  @IsNotEmpty()
  yaml_path?: string;
}

/**
 * DTO for fetch balance operation
 */
export class FetchBalanceDto extends BaseOperationDto {
  @IsEnum(['fetch_balance'])
  declare operation: 'fetch_balance';

  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsOptional()
  @IsString()
  wallet_address?: string;
}

/**
 * DTO for fetch deployment URLs operation
 */
export class FetchDeploymentUrlsDto extends BaseOperationDto {
  @IsEnum(['fetch_deployment_urls'])
  declare operation: 'fetch_deployment_urls';

  @IsString()
  @IsNotEmpty()
  lease_id!: string;
}

/**
 * DTO for fetch lease ID operation
 */
export class FetchLeaseIdDto extends BaseOperationDto {
  @IsEnum(['fetch_lease_id'])
  declare operation: 'fetch_lease_id';

  @IsString()
  @IsNotEmpty()
  lease_id!: string;
}

/**
 * Configuration DTO for environment validation
 */
export class EnvironmentConfigDto {
  @IsString()
  @IsNotEmpty()
  SPHERON_PRIVATE_KEY!: string;

  @IsEnum(['testnet', 'mainnet'])
  SPHERON_NETWORK!: SpheroNNetwork;

  @IsString()
  @IsNotEmpty()
  PROVIDER_PROXY_URL!: string;

  @IsString()
  @IsNotEmpty()
  YAML_API_URL!: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;
}

/**
 * Union type for all operation DTOs
 */
export type OperationDto = 
  | DeployComputeDto 
  | FetchBalanceDto 
  | FetchDeploymentUrlsDto 
  | FetchLeaseIdDto;

/**
 * Validation error details
 */
export interface IValidationError {
  readonly property: string;
  readonly value: unknown;
  readonly constraints: Record<string, string>;
}

/**
 * Validation result
 */
export interface IValidationResult {
  readonly isValid: boolean;
  readonly errors: IValidationError[];
}