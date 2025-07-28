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
import { createConfigService } from './core/config.js';
import { getLogger, initializeLogger } from './core/logger.js';
import { createSpheroNService } from './services/spheron.service.js';
import { createValidationService } from './services/validation.service.js';
import { createMcpController } from './controllers/mcp.controller.js';
import { ConfigurationError } from './core/errors.js';

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
  public async start(): Promise<void> {
    try {
      this.logger.info('Starting Spheron MCP Server...');

      // Initialize configuration
      const configService = createConfigService();
      const config = configService.getConfig();
      
      this.logger.info('Configuration loaded successfully', {
        network: config.environment.SPHERON_NETWORK,
        hasPrivateKey: !!config.environment.SPHERON_PRIVATE_KEY,
        hasYamlApiUrl: !!config.environment.YAML_API_URL
      });

      // Initialize services
      this.logger.info('Initializing services...');
      
      const spheronService = createSpheroNService({
        network: config.environment.SPHERON_NETWORK,
        privateKey: config.environment.SPHERON_PRIVATE_KEY,
        yamlApiUrl: config.environment.YAML_API_URL
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
        }
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
      this.logger.error('Failed to start Spheron MCP Server', error);
      
      if (error instanceof ConfigurationError) {
        this.logger.error('Configuration error detected. Please check your environment variables.');
        process.exit(1);
      }

      this.logger.error('Unexpected error during server startup', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down Spheron MCP Server...');
      
      if (this.server) {
        // Note: MCP SDK doesn't have a built-in shutdown method
        // This is a placeholder for any cleanup logic
        this.logger.info('Server cleanup completed');
      }

      this.logger.info('Spheron MCP Server shutdown completed');
    } catch (error) {
      this.logger.error('Error during server shutdown', error);
      process.exit(1);
    }
  }
}

/**
 * Application entry point
 */
async function main(): Promise<void> {
  const app = new SpheronMcpApplication();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await app.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await app.shutdown();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[Fatal] Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Fatal] Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Start the application
  await app.start();
}

// Start the server
main().catch((error) => {
  console.error('[Fatal] Application startup failed:', error);
  process.exit(1);
});