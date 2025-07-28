/**
 * Validation service using class-validator
 * Following NestJS validation patterns
 */

import 'reflect-metadata';

import type { ClassConstructor} from 'class-transformer';
import {plainToClass } from 'class-transformer';
import type { ValidationError } from 'class-validator';
import { validate } from 'class-validator';

import { ValidationError as CustomValidationError } from '../core/errors.js';
import { getLogger } from '../core/logger.js';
import type { SpheroNOperation } from '../types/spheron.types.js';
import type {
  IValidationError,
  IValidationResult,
  OperationDto} from '../types/validation.types.js';
import { 
  DeployComputeDto,
  EnvironmentConfigDto,
  FetchBalanceDto,
  FetchDeploymentUrlsDto,
  FetchLeaseIdDto} from '../types/validation.types.js';

/**
 * Validation service class
 */
export class ValidationService {
  private readonly logger = getLogger('ValidationService');

  /**
   * Validate operation arguments based on operation type
   */
  public validateOperationArgs = async (args: Record<string, unknown>): Promise<OperationDto> => {
    this.logger.debug('Validating operation arguments', { operation: args.operation });

    if (!args.operation) {
      throw new CustomValidationError('Operation is required');
    }

    const operation = args.operation as SpheroNOperation;
    let DtoClass: ClassConstructor<OperationDto>;

    // Select appropriate DTO class based on operation
    switch (operation) {
      case 'deploy_compute':
        DtoClass = DeployComputeDto;
        break;
      case 'fetch_balance':
        DtoClass = FetchBalanceDto;
        break;
      case 'fetch_deployment_urls':
        DtoClass = FetchDeploymentUrlsDto;
        break;
      case 'fetch_lease_id':
        DtoClass = FetchLeaseIdDto;
        break;
      default:
        throw new CustomValidationError(`Unknown operation: ${String(operation)}`);
    }

    // Transform and validate
    const dto = plainToClass(DtoClass, args);
    const validationResult = await this.validateDto(dto);

    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(error =>
        `${error.property}: ${Object.values(error.constraints).join(', ')}`
      );
      
      this.logger.error(
        'Validation failed',
        new CustomValidationError(errorMessages.join('; ')),
        { operation },
      );

      throw new CustomValidationError(
        `Validation failed: ${errorMessages.join('; ')}`,
        { errors: validationResult.errors, operation }
      );
    }

    this.logger.debug('Validation successful', { operation });
    return dto;
  };

  /**
   * Validate environment configuration
   */
  public validateEnvironmentConfig = async (env: Record<string, unknown>): Promise<EnvironmentConfigDto> => {
    this.logger.debug('Validating environment configuration');

    const dto = plainToClass(EnvironmentConfigDto, env);
    const validationResult = await this.validateDto(dto);

    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(error =>
        `${error.property}: ${Object.values(error.constraints).join(', ')}`
      );

      this.logger.error(
        'Environment validation failed',
        new CustomValidationError(errorMessages.join('; ')),
      );
      
      throw new CustomValidationError(
        `Environment validation failed: ${errorMessages.join('; ')}`,
        { errors: validationResult.errors }
      );
    }

    this.logger.debug('Environment validation successful');
    return dto;
  };

  /**
   * Generic DTO validation method
   */
  private readonly validateDto = async (dto: object): Promise<IValidationResult> => {
    try {
      const errors = await validate(dto);
      
      if (errors.length === 0) {
        return { errors: [], isValid: true };
      }

      const validationErrors: IValidationError[] = errors.map(this.mapValidationError);
      
      return {
        errors: validationErrors,
        isValid: false
      };
    } catch (error) {
      this.logger.error('Validation process failed', error as Error);
      throw new CustomValidationError(
        `Validation process failed: ${error instanceof Error ? error.message : String(error)}`,
        { originalError: error }
      );
    }
  };

  /**
   * Map class-validator ValidationError to our custom format
   */
  private readonly mapValidationError = (error: ValidationError): IValidationError => {
    return {
      constraints: error.constraints ?? {},
      property: error.property,
      value: error.value
    };
  };

  /**
   * Validate specific deploy compute arguments
   */
  public validateDeployComputeArgs = (args: Record<string, unknown>): void => {
    const { request, yaml_content, yaml_path } = args;
    
    // Ensure exactly one of the three input methods is provided
    const inputs = [request, yaml_content, yaml_path].filter(Boolean);
    
    if (inputs.length === 0) {
      throw new CustomValidationError(
        'Must provide exactly one of: request, yaml_content, or yaml_path'
      );
    }
    
    if (inputs.length > 1) {
      throw new CustomValidationError(
        'Cannot provide multiple input methods. Choose one of: request, yaml_content, or yaml_path'
      );
    }
  };

  /**
   * Validate string is not empty after trimming
   */
  public validateNonEmptyString = (value: unknown, fieldName: string): string => {
    if (typeof value !== 'string') {
      throw new CustomValidationError(`${fieldName} must be a string`);
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new CustomValidationError(`${fieldName} cannot be empty`);
    }

    return trimmed;
  };

  /**
   * Validate lease ID format (basic validation)
   */
  public validateLeaseId = (leaseId: unknown): string => {
    const validatedId = this.validateNonEmptyString(leaseId, 'lease_id');
    
    // Basic format validation - you might want to add more specific rules
    if (validatedId.length < 10) {
      throw new CustomValidationError('lease_id appears to be too short');
    }

    return validatedId;
  };

  /**
   * Validate token symbol
   */
  public validateTokenSymbol = (token: unknown): string => {
    const validatedToken = this.validateNonEmptyString(token, 'token');
    
    // Basic token validation
    if (!/^[A-Z]{2,10}$/.test(validatedToken)) {
      throw new CustomValidationError(
        'token must be 2-10 uppercase letters (e.g., CST, USDC)'
      );
    }

    return validatedToken;
  };

  /**
   * Validate wallet address (basic validation)
   */
  public validateWalletAddress = (address: unknown): string | undefined => {
    if (address === undefined || address === null) {
      return undefined;
    }

    const validatedAddress = this.validateNonEmptyString(address, 'wallet_address');
    
    // Basic wallet address validation - you might want to add more specific rules
    if (validatedAddress.length < 20) {
      throw new CustomValidationError('wallet_address appears to be too short');
    }

    return validatedAddress;
  };
}

/**
 * Create validation service instance
 */
export const createValidationService = (): ValidationService => {
  return new ValidationService();
};