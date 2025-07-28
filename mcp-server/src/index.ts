#!/usr/bin/env node

/**
 * Spheron Protocol MCP Server - Modular Architecture Entry Point
 *
 * This MCP server integrates with the Spheron Protocol SDK using a clean,
 * modular architecture with proper separation of concerns, type safety,
 * error handling, and structured logging.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createMcpController } from './controllers/mcp.controller.js';
import { createConfigService } from './core/config.js';
import { ConfigurationError } from './core/errors.js';
import { getLogger, initializeLogger } from './core/logger.js';
import { createSpheroNService } from './services/spheron.service.js';
import { createValidationService } from './services/validation.service.js';

// Initialize logger system at module level
initializeLogger();

/**
 * Main application class
 */
class SpheronMcpApplication {
  private readonly logger = getLogger('SpheronMcpApplication');
  private server?: Server;

  /**
   * Initialize and start the MCP server
   */
  public start = async (): Promise<void> => {
    try {
      this.logger.info('Starting Spheron MCP Server...');

      // Initialize configuration
      const configService = createConfigService();
      const config = configService.getConfig();

      this.logger.info('Configuration loaded successfully', {
        hasPrivateKey: !!config.environment.SPHERON_PRIVATE_KEY,
        hasYamlApiUrl: !!config.environment.YAML_API_URL,
        network: config.environment.SPHERON_NETWORK,
      });

      // Initialize services
      this.logger.info('Initializing services...');

      const spheronService = createSpheroNService({
        network: config.environment.SPHERON_NETWORK,
        privateKey: config.environment.SPHERON_PRIVATE_KEY,
        yamlApiUrl: config.environment.YAML_API_URL,
      });

      const validationService = createValidationService();

      // Initialize controller
      const mcpController = createMcpController(spheronService, validationService);

      // Create MCP server
      this.server = new Server(
        {
          name: config.server.name,
          version: config.server.version,
        },
        {
          capabilities: {
            tools: {},
          },
        },
      );

      // Register handlers
      this.logger.info('Registering MCP handlers...');
      mcpController.registerHandlers(this.server);

      // Start server transport
      this.logger.info('Starting server transport...');
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      this.logger.info('Spheron MCP Server started successfully');
      this.logger.info('Server is running on stdio transport');
    } catch (error) {
      this.logger.error('Failed to start Spheron MCP Server', error as Error);

      if (error instanceof ConfigurationError) {
        this.logger.error('Configuration error detected. Please check your environment variables.');
        throw new Error('Configuration error');
      }

      this.logger.error('Unexpected error during server startup', error as Error);
      throw new Error('Unexpected error during server startup');
    }
  };

  /**
   * Graceful shutdown
   */
  public shutdown = (): void => {
    try {
      this.logger.info('Shutting down Spheron MCP Server...');

      if (this.server) {
        // Note: MCP SDK doesn't have a built-in shutdown method
        // This is a placeholder for any cleanup logic
        this.logger.info('Server cleanup completed');
      }

      this.logger.info('Spheron MCP Server shutdown completed');
    } catch (error) {
      this.logger.error('Error during server shutdown', error as Error);
      throw new Error('Error during server shutdown');
    }
  };
}

/**
 * Application entry point
 */
const main = async (): Promise<void> => {
  const app = new SpheronMcpApplication();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    app.shutdown();
    throw new Error('SIGINT');
  });

  process.on('SIGTERM', () => {
    app.shutdown();
    throw new Error('SIGTERM');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: unknown) => {
    console.error('[Fatal] Uncaught Exception:', error);
    throw new Error('Uncaught Exception');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Fatal] Unhandled Rejection at:', promise, 'reason:', reason);
    throw new Error('Unhandled Rejection');
  });

  // Start the application
  await app.start();
};

// Start the server
main().catch((error: unknown) => {
  console.error('[Fatal] Application startup failed:', error);
  throw new Error('Application startup failed');
});
