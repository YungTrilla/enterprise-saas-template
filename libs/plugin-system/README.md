# Enterprise Plugin System

A comprehensive plugin architecture for the Enterprise SaaS Template, enabling dynamic extension of functionality through secure, sandboxed plugins.

## 🎯 Overview

The plugin system provides a complete framework for:

- **Dynamic Plugin Loading** - Install, activate, and manage plugins at runtime
- **Secure Execution** - Sandboxed environment with permission-based access control
- **Hook System** - Extensible hooks for intercepting and extending application behavior
- **Plugin Marketplace** - Built-in marketplace for discovering and installing plugins
- **Dependency Management** - Automatic resolution and management of plugin dependencies
- **Version Control** - Plugin versioning, updates, and rollback capabilities
- **Performance Monitoring** - Real-time tracking of plugin performance and usage

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Plugin Manager │    │  Hook System    │    │ Security Layer  │
│                 │    │                 │    │                 │
│ • Install       │    │ • Register      │    │ • Sandbox       │
│ • Activate      │    │ • Execute       │    │ • Permissions   │
│ • Update        │    │ • Unregister    │    │ • Validation    │
│ • Monitor       │    │ • Lifecycle     │    │ • Scanning      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Plugin Registry │    │  Plugin Loader  │    │ Storage Layer   │
│                 │    │                 │    │                 │
│ • Marketplace   │    │ • File System   │    │ • Database      │
│ • Discovery     │    │ • NPM           │    │ • File System   │
│ • Validation    │    │ • Git           │    │ • Redis Cache   │
│ • Publishing    │    │ • URL           │    │ • Metadata      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Plugin Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Discovery  │───▶│ Installation│───▶│ Activation  │───▶│   Runtime   │
│             │    │             │    │             │    │             │
│ • Search    │    │ • Download  │    │ • Load      │    │ • Execute   │
│ • Validate  │    │ • Verify    │    │ • Register  │    │ • Monitor   │
│ • Preview   │    │ • Install   │    │ • Initialize│    │ • Update    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ▲                  ▲                  ▲                  │
       │                  │                  │                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Marketplace │    │ Uninstall   │    │ Deactivate  │    │  Cleanup    │
│             │    │             │    │             │    │             │
│ • Browse    │    │ • Remove    │    │ • Unregister│    │ • Resources │
│ • Rate      │    │ • Cleanup   │    │ • Cleanup   │    │ • Data      │
│ • Review    │    │ • Archive   │    │ • Preserve  │    │ • Logs      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🚀 Quick Start

### Installation

```bash
pnpm add @template/plugin-system
```

### Basic Setup

```typescript
import { 
  PluginManager,
  PluginLoader,
  PluginExecutor,
  HookSystem,
  DatabaseStorage,
  PluginValidator,
  SecurityScanner,
  PermissionManager,
  DependencyResolver
} from '@template/plugin-system';

// Initialize components
const storage = new DatabaseStorage({ /* db config */ });
const loader = new PluginLoader();
const executor = new PluginExecutor({ enableSandbox: true });
const hooks = new HookSystem();
const validator = new PluginValidator();
const scanner = new SecurityScanner();
const permissions = new PermissionManager();
const resolver = new DependencyResolver();

// Create plugin manager
const pluginManager = new PluginManager({
  storage,
  pluginLoader: loader,
  pluginExecutor: executor,
  hookSystem: hooks,
  validator,
  securityScanner: scanner,
  permissionManager: permissions,
  dependencyResolver: resolver,
  enableSandbox: true,
  maxConcurrentPlugins: 50
});

// Initialize
await pluginManager.initialize();
```

## 📦 Plugin Development

### Plugin Structure

```
my-plugin/
├── package.json          # Plugin manifest
├── index.js              # Main entry point
├── config.json           # Configuration schema
├── hooks/                # Hook implementations
│   ├── beforeRequest.js
│   └── afterAuth.js
├── ui/                   # UI components
│   ├── admin/
│   └── components/
├── api/                  # API extensions
│   ├── routes.js
│   └── middleware.js
└── README.md
```

### Plugin Manifest (package.json)

```json
{
  "name": "my-awesome-plugin",
  "version": "1.0.0",
  "description": "An awesome plugin for the Enterprise SaaS Template",
  "main": "index.js",
  "template": {
    "category": "INTEGRATION",
    "permissions": {
      "api": {
        "endpoints": ["/api/external/*"],
        "methods": ["GET", "POST"]
      },
      "database": {
        "read": true,
        "write": false
      }
    },
    "hooks": {
      "beforeRequest": "handleBeforeRequest",
      "afterCreate": "handleAfterCreate"
    },
    "ui": {
      "admin": {
        "menu": [
          {
            "id": "my-plugin-settings",
            "label": "My Plugin",
            "url": "/admin/my-plugin"
          }
        ]
      }
    },
    "config": {
      "schema": {
        "type": "object",
        "properties": {
          "apiKey": { "type": "string" },
          "enabled": { "type": "boolean", "default": true }
        },
        "required": ["apiKey"]
      }
    }
  },
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0",
    "template": ">=1.0.0"
  }
}
```

### Plugin Implementation

```javascript
// index.js
class MyAwesomePlugin {
  constructor(context) {
    this.context = context;
    this.config = context.config;
    this.logger = context.logger;
    this.api = context.api;
  }

  async initialize() {
    this.logger.info('Plugin initialized');
    // Perform initialization tasks
  }

  async cleanup() {
    this.logger.info('Plugin cleanup');
    // Cleanup resources
  }

  // Hook implementations
  async handleBeforeRequest(req, res, next) {
    // Intercept requests before processing
    this.logger.info('Processing request:', req.url);
    next();
  }

  async handleAfterCreate(data) {
    // React to data creation events
    await this.sendNotification(data);
  }

  // Custom methods
  async sendNotification(data) {
    // Plugin-specific functionality
    const response = await this.api.post('/external/webhook', data);
    return response;
  }
}

module.exports = MyAwesomePlugin;
```

## 🔧 Plugin Management

### Installing Plugins

```typescript
// From marketplace
await pluginManager.installPlugin({
  source: PluginSource.MARKETPLACE,
  identifier: 'awesome-analytics-plugin',
  version: '1.2.0',
  autoActivate: true
});

// From file
await pluginManager.installPlugin({
  source: PluginSource.FILE_UPLOAD,
  identifier: '/path/to/plugin.zip',
  config: {
    apiKey: 'your-api-key',
    enabled: true
  }
});

// From Git repository
await pluginManager.installPlugin({
  source: PluginSource.GIT_REPOSITORY,
  identifier: 'https://github.com/user/plugin.git',
  version: 'v1.0.0'
});
```

### Managing Plugin Lifecycle

```typescript
// Activate plugin
await pluginManager.activatePlugin('plugin-id');

// Deactivate plugin
await pluginManager.deactivatePlugin('plugin-id');

// Update plugin
await pluginManager.updatePlugin({
  pluginId: 'plugin-id',
  version: '1.3.0',
  preserveData: true
});

// Uninstall plugin
await pluginManager.uninstallPlugin('plugin-id', {
  preserveData: false
});

// List plugins
const plugins = await pluginManager.listPlugins({
  status: PluginStatus.ACTIVE,
  category: 'INTEGRATION'
});
```

## 🔌 Hook System

### Available Hooks

```typescript
// Request lifecycle
beforeRequest    // Before request processing
afterRequest     // After request completion
beforeAuth      // Before authentication
afterAuth       // After authentication

// Data lifecycle
beforeCreate    // Before entity creation
afterCreate     // After entity creation
beforeUpdate    // Before entity update
afterUpdate     // After entity update
beforeDelete    // Before entity deletion
afterDelete     // After entity deletion

// Application lifecycle
appStart        // Application startup
appShutdown     // Application shutdown
pluginInstall   // Plugin installation
pluginUpdate    // Plugin update

// Custom hooks
custom.*        // Application-specific hooks
```

### Using Hooks in Application

```typescript
import { HookSystem } from '@template/plugin-system';

const hooks = new HookSystem();

// Execute hooks
app.use(async (req, res, next) => {
  await hooks.execute('beforeRequest', req, res);
  next();
});

app.post('/api/users', async (req, res) => {
  const user = await createUser(req.body);
  await hooks.execute('afterCreate', user, 'user');
  res.json(user);
});

// Register application hooks
hooks.register('custom.orderProcessed', 'core', async (order) => {
  console.log('Order processed:', order.id);
});
```

## 🔐 Security & Permissions

### Permission System

```typescript
// Plugin permissions in manifest
{
  "permissions": {
    "filesystem": {
      "read": ["/uploads/*", "/temp/*"],
      "write": ["/uploads/plugin-data/*"]
    },
    "network": {
      "domains": ["api.example.com", "webhook.service.com"],
      "ports": [80, 443]
    },
    "database": {
      "read": true,
      "write": false,
      "admin": false
    },
    "api": {
      "endpoints": ["/api/users", "/api/external/*"],
      "methods": ["GET", "POST"],
      "rateLimit": {
        "requests": 100,
        "windowMs": 60000
      }
    },
    "tenants": {
      "access": "own",
      "manage": false
    }
  }
}
```

### Sandbox Execution

```typescript
// Plugins run in secure sandbox by default
const executor = new PluginExecutor({
  enableSandbox: true,
  memoryLimit: 128 * 1024 * 1024, // 128MB
  timeout: 30000, // 30 seconds
  allowedModules: ['lodash', 'moment'], // Whitelist modules
  restrictions: {
    network: true,
    filesystem: true,
    subprocess: true
  }
});
```

### Security Scanning

```typescript
const scanner = new SecurityScanner({
  scanEnabled: true,
  rules: [
    'no-eval',
    'no-function-constructor',
    'no-require-bypass',
    'no-malicious-patterns'
  ],
  customRules: [
    // Custom security rules
  ]
});

const scanResult = await scanner.scanPlugin(pluginData);
if (!scanResult.safe) {
  throw new Error('Plugin failed security scan');
}
```

## 📊 Monitoring & Analytics

### Plugin Performance

```typescript
// Get plugin statistics
const stats = await pluginManager.getPluginStats('plugin-id');
console.log(stats);
/*
{
  plugin: {
    id: 'plugin-id',
    name: 'My Plugin',
    version: '1.0.0',
    status: 'ACTIVE'
  },
  usage: {
    activations: 5,
    totalRuntime: 12500,
    apiCalls: 150,
    errors: 0,
    performance: {
      averageExecutionTime: 45,
      slowestExecution: 120,
      fastestExecution: 12
    }
  },
  isActive: true,
  uptime: 3600000
}
*/
```

### Event Monitoring

```typescript
pluginManager.on('pluginInstalled', (plugin) => {
  console.log('Plugin installed:', plugin.name);
});

pluginManager.on('pluginActivated', (plugin) => {
  console.log('Plugin activated:', plugin.name);
});

pluginManager.on('activationError', ({ pluginId, error }) => {
  console.error('Plugin activation failed:', pluginId, error);
});

pluginManager.on('pluginExecuted', ({ pluginId, function, duration }) => {
  console.log(`Plugin ${pluginId} executed ${function} in ${duration}ms`);
});
```

## 🛒 Plugin Marketplace

### Marketplace Integration

```typescript
import { PluginMarketplace } from '@template/plugin-system';

const marketplace = new PluginMarketplace({
  apiUrl: 'https://marketplace.template.com',
  apiKey: 'your-api-key'
});

// Search plugins
const plugins = await marketplace.search({
  category: 'ANALYTICS',
  tags: ['reporting', 'dashboard'],
  verified: true,
  free: false,
  rating: 4.0
});

// Get plugin details
const plugin = await marketplace.getPlugin('plugin-id');

// Install from marketplace
await pluginManager.installPlugin({
  source: PluginSource.MARKETPLACE,
  identifier: plugin.id,
  version: plugin.latestVersion
});
```

### Publishing Plugins

```typescript
// Publish to marketplace
await marketplace.publishPlugin({
  manifest: pluginManifest,
  archive: pluginArchive,
  screenshots: ['screenshot1.png', 'screenshot2.png'],
  documentation: 'README.md',
  license: 'MIT',
  pricing: {
    type: 'free' // or 'paid', 'subscription'
  }
});
```

## 🧪 Testing Plugins

### Plugin Testing Framework

```typescript
import { PluginTester } from '@template/plugin-system/testing';

describe('My Plugin', () => {
  let tester: PluginTester;
  
  beforeEach(async () => {
    tester = new PluginTester({
      pluginPath: './path/to/plugin',
      mockServices: true
    });
    await tester.setup();
  });
  
  afterEach(async () => {
    await tester.cleanup();
  });
  
  it('should initialize correctly', async () => {
    const result = await tester.activate();
    expect(result.success).toBe(true);
  });
  
  it('should handle hooks', async () => {
    await tester.activate();
    const result = await tester.executeHook('beforeRequest', mockRequest);
    expect(result).toBeDefined();
  });
  
  it('should respect permissions', async () => {
    await tester.activate();
    await expect(
      tester.executeFunction('accessRestrictedAPI')
    ).rejects.toThrow('Permission denied');
  });
});
```

## 📋 Best Practices

### Plugin Development

1. **Follow Security Guidelines**
   - Always validate inputs
   - Use parameterized queries
   - Avoid eval() and similar functions
   - Implement proper error handling

2. **Performance Optimization**
   - Minimize startup time
   - Use lazy loading for heavy operations
   - Implement proper cleanup
   - Monitor memory usage

3. **Error Handling**
   - Use try-catch blocks
   - Log errors appropriately
   - Provide meaningful error messages
   - Implement graceful degradation

4. **Configuration Management**
   - Provide sensible defaults
   - Validate configuration
   - Support environment-specific configs
   - Document all options

### Plugin Integration

1. **Lifecycle Management**
   - Test activation/deactivation
   - Handle dependencies properly
   - Implement proper cleanup
   - Monitor plugin health

2. **Security**
   - Review plugin permissions
   - Enable sandbox mode
   - Scan for vulnerabilities
   - Monitor plugin behavior

3. **Performance**
   - Set appropriate limits
   - Monitor resource usage
   - Implement timeouts
   - Use caching effectively

## 🔗 API Reference

### Core Classes

- `PluginManager` - Central plugin management
- `PluginLoader` - Plugin loading and installation
- `PluginExecutor` - Secure plugin execution
- `HookSystem` - Hook registration and execution
- `PluginRegistry` - Plugin discovery and registry
- `SecurityScanner` - Security validation
- `PermissionManager` - Permission enforcement

### Types

- `IPlugin` - Plugin interface
- `IPluginContext` - Execution context
- `IPluginPermissions` - Permission configuration
- `PluginStatus` - Plugin state enumeration
- `PluginSource` - Installation source types

## 📄 License

Part of the Enterprise SaaS Template - see main project license.