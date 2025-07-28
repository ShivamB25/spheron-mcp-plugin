# Spheron Network MCP Plugin

A production-ready MCP (Model Context Protocol) server that integrates with the Spheron Protocol SDK to provide compute deployment and management capabilities directly through Claude and other MCP-compatible clients.

## 🚀 Architecture Overview

This plugin has been architected using modern TypeScript best practices with a clean, modular design:

- **🏗️ Modular Architecture**: Clean separation of concerns with dedicated controllers, services, and types
- **🔒 Type Safety**: Strict TypeScript implementation with zero `any` usage (except where required by external SDKs)
- **⚡ Performance**: Optimized build process with efficient dependency management
- **📝 Comprehensive Logging**: Structured logging with contextual metadata
- **🛡️ Error Handling**: Robust error handling with custom error classes
- **✅ Input Validation**: Strict validation using class-validator patterns
- **🔧 Configuration Management**: Centralized configuration with environment validation

## 📁 Project Structure

```
spheron-mcp-plugin/
├── mcp-server/
│   ├── src/
│   │   ├── controllers/          # MCP request handlers
│   │   │   └── mcp.controller.ts
│   │   ├── services/             # Business logic layer
│   │   │   ├── spheron.service.ts
│   │   │   └── validation.service.ts
│   │   ├── core/                 # Core infrastructure
│   │   │   ├── config.ts         # Configuration management
│   │   │   ├── errors.ts         # Custom error classes
│   │   │   └── logger.ts         # Structured logging
│   │   ├── types/                # TypeScript type definitions
│   │   │   ├── config.types.ts
│   │   │   ├── mcp.types.ts
│   │   │   ├── spheron.types.ts
│   │   │   └── validation.types.ts
│   │   └── index.ts              # Application entry point
│   ├── build/                    # Compiled JavaScript (git-ignored)
│   ├── package.json              # Dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   └── Dockerfile                # Container configuration
└── README.md
```

## ✨ Features

- **🖥️ Deploy Compute Resources**: Deploy compute resources using YAML configuration or natural language
- **💰 Fetch Wallet Balance**: Check wallet balance for different tokens (CST, USDC, etc.)
- **🌍 Fetch Deployment URLs**: Get URLs and details for active deployments
- **📋 Fetch Lease Details**: Get comprehensive information about lease/deployment status
- **🔄 BigInt Serialization**: Proper handling of BigInt values in API responses
- **📊 Structured Logging**: Comprehensive logging with request tracing and error context

## 🛠️ Installation

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm/bun**: Package manager
- **Docker** (optional): For containerized deployment

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/spheronFdn/spheron-mcp-plugin.git
cd spheron-mcp-plugin/mcp-server

# Install dependencies (using bun for faster installation)
bun install
# or with npm
npm install
```

### 2. Build the Project

```bash
# Clean build
bun run build
# or
npm run build

# Development build with watch mode
bun run build:watch
# or
npm run build:watch
```

### 3. Available Scripts

```bash
# Development
bun run dev              # Build and start in development mode
bun run build:watch      # Watch mode for development

# Production
bun run build           # Clean build for production
bun run start           # Start the built server
bun run clean           # Clean build directory

# Validation
bun run typecheck       # TypeScript type checking

# Docker
bun run docker:build    # Build Docker image
bun run docker:run      # Run with docker-compose
bun run docker:stop     # Stop docker-compose

# MCP Tools
bun run inspector       # Launch MCP inspector for debugging
```

## ⚙️ Configuration

The plugin uses a sophisticated configuration management system with environment validation.

### Environment Variables

Create a `.env` file in the `mcp-server` directory:

```env
# Required
SPHERON_PRIVATE_KEY=your-spheron-private-key-here

# Optional (with defaults)
SPHERON_NETWORK=testnet                                     # testnet | mainnet
PROVIDER_PROXY_URL=https://provider-proxy.spheron.network  # Provider proxy URL
YAML_API_URL=http://provider.cpu.gpufarm.xyz:32692/generate # YAML generation API
LOG_LEVEL=info                                              # Logging level
NODE_ENV=development                                        # Environment mode
```

### MCP Client Configuration

#### VS Code (Cline Extension)

**Path**: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` (Linux)
**Path**: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` (macOS)

```json
{
  "mcpServers": {
    "spheron": {
      "command": "node",
      "args": ["/absolute/path/to/spheron-mcp-plugin/mcp-server/build/index.js"],
      "env": {
        "SPHERON_PRIVATE_KEY": "your-spheron-private-key",
        "SPHERON_NETWORK": "testnet",
        "PROVIDER_PROXY_URL": "https://provider-proxy.spheron.network",
        "YAML_API_URL": "http://provider.cpu.gpufarm.xyz:32692/generate"
      }
    }
  }
}
```

#### Claude Desktop

**Path**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
**Path**: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "spheron": {
      "command": "node",
      "args": ["/absolute/path/to/spheron-mcp-plugin/mcp-server/build/index.js"],
      "env": {
        "SPHERON_PRIVATE_KEY": "your-spheron-private-key",
        "SPHERON_NETWORK": "testnet"
      }
    }
  }
}
```

#### Docker Configuration

```json
{
  "mcpServers": {
    "spheron": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "SPHERON_PRIVATE_KEY",
        "-e", "SPHERON_NETWORK",
        "spheronfdn/spheron-mcp:latest"
      ],
      "env": {
        "SPHERON_PRIVATE_KEY": "your-spheron-private-key",
        "SPHERON_NETWORK": "testnet"
      }
    }
  }
}
```

## 🔧 Usage Examples

### Deploy with Natural Language

```
Deploy a PyTorch Jupyter notebook with GPU support on Spheron
```

### Deploy with YAML Configuration

```
Deploy this compute configuration:

version: "1.0"
services:
  pytorch-gpu:
    image: quay.io/jupyter/pytorch-notebook:cuda12-pytorch-2.4.1
    expose:
      - port: 8888
        as: 8888
        to:
          - global: true
    env:
      - JUPYTER_TOKEN=secure123
profiles:
  name: pytorch-gpu
  duration: 4h
  tier:
    - community
  compute:
    pytorch-gpu:
      resources:
        cpu:
          units: 8
        memory:
          size: 16Gi
        storage:
          - size: 200Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: rtx4090
```

### Check Wallet Balance

```
What's my CST balance on Spheron?
Check my USDC balance
```

### Get Deployment Information

```
Show me the URLs for deployment lease-123456
Get details for my active deployments
What's the status of lease lease-789012?
```

## 🏗️ Development

### Architecture Principles

This codebase follows **SOLID principles** and **Clean Architecture** patterns:

1. **Single Responsibility**: Each class has one reason to change
2. **Open/Closed**: Open for extension, closed for modification
3. **Liskov Substitution**: Derived classes are substitutable for base classes
4. **Interface Segregation**: No code depends on methods it doesn't use
5. **Dependency Inversion**: Depend on abstractions, not concretions

### Key Components

#### Controllers (`src/controllers/`)
- **`McpController`**: Handles MCP protocol requests and responses
- Follows dependency injection patterns
- Maps MCP requests to service operations

#### Services (`src/services/`)
- **`SpheroNService`**: Core business logic for Spheron SDK interactions
- **`ValidationService`**: Input validation and data transformation
- Single-purpose classes with clear interfaces

#### Core Infrastructure (`src/core/`)
- **`ConfigService`**: Centralized configuration management with validation
- **`Logger`**: Structured logging with contextual metadata
- **`Errors`**: Custom error classes with proper error handling

#### Types (`src/types/`)
- Comprehensive TypeScript type definitions
- Strict typing for all data structures
- No `any` types (except where required by external libraries)

### Code Style Guidelines

```typescript
// ✅ Good: Proper typing and documentation
/**
 * Deploy compute resources using Spheron SDK
 * @param dto - Validated deployment configuration
 * @returns Promise resolving to deployment result
 */
public async deployCompute(dto: DeployComputeDto): Promise<IDeploymentResult> {
  const yamlContent = await this.getYamlContent(dto);
  return await this.sdk.deployment.createDeployment(yamlContent);
}

// ❌ Bad: Any types and poor documentation
public async deployCompute(dto: any): Promise<any> {
  return await this.sdk.deployment.createDeployment(dto.yaml);
}
```

### Adding New Features

1. **Define Types**: Create interfaces in appropriate `types/` files
2. **Add Service Logic**: Implement business logic in `services/`
3. **Update Controller**: Add request handling in `controllers/`
4. **Update Validation**: Add input validation if needed
5. **Test**: Verify functionality with MCP inspector

### Debugging

```bash
# Launch MCP inspector
bun run inspector

# Enable debug logging
LOG_LEVEL=debug bun run dev

# Type checking only
bun run typecheck
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build Docker image
docker build -t spheronfdn/spheron-mcp:latest .

# Run with docker-compose
docker-compose up

# Or run directly
docker run -e SPHERON_PRIVATE_KEY=your-key spheronfdn/spheron-mcp:latest
```

### Docker Compose

The included `docker-compose.yml` provides a complete deployment setup with environment variable management.

## 🔍 Troubleshooting

### Common Issues

1. **Build Errors**: Ensure TypeScript dependencies are installed
   ```bash
   bun install --frozen-lockfile
   ```

2. **Module Resolution**: ES modules require `.js` extensions in imports
   ```typescript
   import { SpheroNService } from './services/spheron.service.js'; // ✅
   import { SpheroNService } from './services/spheron.service'; // ❌
   ```

3. **BigInt Serialization**: Handled automatically by the service layer
   ```typescript
   // Handled automatically
   const result = await spheronService.deployCompute(dto);
   // BigInt values are converted to strings for JSON serialization
   ```

4. **Configuration Errors**: Check environment variables and validation.

### Logs and Debugging

- **Structured Logging**: All operations include contextual metadata
- **Error Tracking**: Full error context with stack traces
- **Request Tracing**: Each request includes a correlation ID

## 📈 Version History

### v1.0.0 - Modular Architecture
- ✅ Complete TypeScript migration with strict typing
- ✅ Modular architecture with separation of concerns  
- ✅ Comprehensive error handling and logging
- ✅ Input validation and configuration management
- ✅ Enhanced build and deployment scripts
- ✅ Docker containerization support

### v0.1.1 - Legacy Version
- Basic functionality with monolithic structure
- ES module compatibility fixes
- BigInt serialization handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the TypeScript coding standards
4. Ensure all types are properly defined
5. Add appropriate error handling and logging
6. Test with the MCP inspector
7. Commit changes: `git commit -m 'Add amazing feature'`
8. Push to branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Spheron Protocol](https://spheron.network/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
