# @abyss/shared-config

Centralized configuration management for Abyss Central suite with
environment-aware loading, validation, and type safety.

## Features

- 🌍 **Environment-Aware** - Automatic environment detection and configuration
  loading
- 🔒 **Type-Safe** - Full TypeScript support with typed configuration objects
- ✅ **Validation** - Joi schema validation for all configuration values
- 📁 **Multiple Sources** - Load from .env files, environment variables, and
  defaults
- 🔧 **Centralized** - Single source of truth for all service configurations
- 🚀 **Production-Ready** - Environment-specific validation and security checks
- 🎯 **Service-Oriented** - Pre-configured for microservices architecture

## Installation

This library is part of the Abyss Central monorepo and is used internally by the
suite applications.

```bash
# Install dependencies in the monorepo root
npm install
```

## Usage

### Basic Configuration Loading

```typescript
import { loadConfig, getConfig, isProduction } from '@abyss/shared-config';

// Initialize configuration (call once at app startup)
await loadConfig();

// Get specific configuration values
const port = getConfig('PORT');
const serviceName = getConfig('SERVICE_NAME');
const dbUrl = getDatabaseUrl();

// Environment checks
if (isProduction()) {
  console.log('Running in production mode');
}
```

### Service Configuration

```typescript
import { ConfigManager, getServiceUrls } from '@abyss/shared-config';

// Get configuration manager instance
const config = ConfigManager.getInstance();
await config.load();

// Database configuration
const dbConfig = {
  host: config.get('DB_HOST'),
  port: config.get('DB_PORT'),
  database: config.get('DB_NAME'),
  user: config.get('DB_USER'),
  password: config.get('DB_PASSWORD'),
  ssl: config.get('DB_SSL'),
};

// Service URLs for API calls
const serviceUrls = getServiceUrls();
console.log('Auth Service:', serviceUrls.AUTH_SERVICE_URL);
console.log('Inventory Service:', serviceUrls.INVENTORY_SERVICE_URL);
```

### Environment-Specific Configuration

```typescript
import {
  loadConfig,
  getEnvironment,
  validateConfig,
} from '@abyss/shared-config';

// Load environment-specific configuration
await loadConfig(); // Automatically loads .env.production, .env.development, etc.

const environment = getEnvironment(); // 'development' | 'test' | 'staging' | 'production'

// Validate configuration
const validation = validateConfig();
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
  process.exit(1);
}
```

### Custom Environment File

```typescript
import { loadConfig } from '@abyss/shared-config';

// Load from specific .env file
await loadConfig('./config/.env.custom');

// Or use environment variable
await loadConfig(process.env.CONFIG_FILE);
```

## Configuration Structure

### Environment Files Priority

The configuration loader checks for environment files in this order:

1. `.env.${NODE_ENV}.local` (e.g., `.env.production.local`)
2. `.env.${NODE_ENV}` (e.g., `.env.production`)
3. `.env.local`
4. `.env`

### Configuration Categories

#### Base Configuration

```typescript
interface BaseConfig {
  NODE_ENV: 'development' | 'test' | 'staging' | 'production';
  PORT: number; // Default: 3000
  SERVICE_NAME: string; // Required
  SERVICE_VERSION: string; // Default: '1.0.0'
  LOG_LEVEL: string; // Default: 'info'
  API_PREFIX: string; // Default: '/api/v1'
  CORS_ORIGINS: string[]; // Default: ['http://localhost:3000']
  ENABLE_CORS: boolean; // Default: true
  REQUEST_TIMEOUT: number; // Default: 30000
  RATE_LIMIT_WINDOW: number; // Default: 900000 (15 min)
  RATE_LIMIT_MAX: number; // Default: 100
}
```

#### Database Configuration

```typescript
interface DatabaseConfig {
  DB_HOST: string; // Required
  DB_PORT: number; // Default: 5432
  DB_NAME: string; // Required (validated pattern)
  DB_USER: string; // Required
  DB_PASSWORD: string; // Required (min 8 chars, 12+ in production)
  DB_SSL: boolean; // Default: false (true in production)
  DB_SSL_REJECT_UNAUTHORIZED: boolean; // Default: true
  DB_POOL_MIN: number; // Default: 2 (5 in production)
  DB_POOL_MAX: number; // Default: 10 (20 in production)
  DB_TIMEOUT: number; // Default: 30000
  DB_CONNECTION_TIMEOUT: number; // Default: 10000
  DB_IDLE_TIMEOUT: number; // Default: 30000
  DB_MIGRATION_TIMEOUT: number; // Default: 300000
  DB_STATEMENT_TIMEOUT: number; // Default: 60000
  DB_MAX_LIFETIME: number; // Default: 3600000 (1 hour)
  DB_RETRY_ATTEMPTS: number; // Default: 3
  DB_RETRY_DELAY: number; // Default: 1000
  DB_CONNECTION_CHECK_INTERVAL: number; // Default: 30000
  DB_CREDENTIAL_ROTATION_ENABLED: boolean; // Default: false
  DB_CREDENTIAL_ROTATION_INTERVAL: number; // Default: 86400000 (24 hours)
}
```

#### Redis Configuration

```typescript
interface RedisConfig {
  REDIS_HOST: string; // Default: 'localhost'
  REDIS_PORT: number; // Default: 6379
  REDIS_PASSWORD?: string; // Optional
  REDIS_DB: number; // Default: 0
  REDIS_TIMEOUT: number; // Default: 5000
  REDIS_RETRY_ATTEMPTS: number; // Default: 3
  REDIS_RETRY_DELAY: number; // Default: 1000
}
```

#### Authentication Configuration

```typescript
interface AuthConfig {
  JWT_SECRET: string; // Required (min 32 chars)
  JWT_ACCESS_EXPIRATION: string; // Default: '15m'
  JWT_REFRESH_EXPIRATION: string; // Default: '7d'
  JWT_ISSUER: string; // Default: 'abyss-central'
  JWT_AUDIENCE: string; // Default: 'abyss-users'
  BCRYPT_ROUNDS: number; // Default: 12 (min: 10, max: 15)
  SESSION_SECRET: string; // Required (min 32 chars)
  ENABLE_MFA: boolean; // Default: false
  PASSWORD_RESET_EXPIRATION: number; // Default: 3600000 (1 hour)
}
```

#### Security Configuration

```typescript
interface SecurityConfig {
  ENCRYPTION_KEY: string; // Required (min 32 chars)
  API_KEY_PREFIX: string; // Default: 'ak'
  TRUSTED_PROXIES: string[]; // Default: []
  ENABLE_RATE_LIMITING: boolean; // Default: true
  ENABLE_HELMET: boolean; // Default: true
  SECURE_COOKIES: boolean; // Default: false
  CSRF_SECRET: string; // Required (min 32 chars)
  MAX_REQUEST_SIZE: string; // Default: '1mb'
}
```

#### Service URLs Configuration

```typescript
interface ServiceUrlsConfig {
  AUTH_SERVICE_URL: string; // Default: 'http://localhost:3001'
  INVENTORY_SERVICE_URL: string; // Default: 'http://localhost:3002'
  ORDER_SERVICE_URL: string; // Default: 'http://localhost:3003'
  EMPLOYEE_SERVICE_URL: string; // Default: 'http://localhost:3004'
  ANALYTICS_SERVICE_URL: string; // Default: 'http://localhost:3005'
  NOTIFICATION_SERVICE_URL: string; // Default: 'http://localhost:3006'
}
```

## Environment Examples

### Development (.env.development)

```bash
NODE_ENV=development
PORT=3000
SERVICE_NAME=abyss-inventory
LOG_LEVEL=debug

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=abyss_inventory_dev
DB_USER=dev_user
DB_PASSWORD=dev_password
DB_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Security (development keys - not for production!)
JWT_SECRET=development-jwt-secret-key-min-32-chars
SESSION_SECRET=development-session-secret-key-min-32-chars
ENCRYPTION_KEY=development-encryption-key-min-32-chars
CSRF_SECRET=development-csrf-secret-key-min-32-chars

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
ENABLE_CORS=true

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
INVENTORY_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
```

### Production (.env.production)

```bash
NODE_ENV=production
PORT=3000
SERVICE_NAME=abyss-inventory
SERVICE_VERSION=1.2.3
LOG_LEVEL=info

# Database (use environment variables for sensitive data)
DB_HOST=${DATABASE_HOST}
DB_PORT=5432
DB_NAME=${DATABASE_NAME}
DB_USER=${DATABASE_USER}
DB_PASSWORD=${DATABASE_PASSWORD}
DB_SSL=true
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=0

# Security (use secure secret management)
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CSRF_SECRET=${CSRF_SECRET}

# Security settings
ENABLE_RATE_LIMITING=true
ENABLE_HELMET=true
SECURE_COOKIES=true
TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16

# CORS
CORS_ORIGINS=${ALLOWED_ORIGINS}
ENABLE_CORS=true

# Service URLs (internal network)
AUTH_SERVICE_URL=http://auth-service:3000
INVENTORY_SERVICE_URL=http://inventory-service:3000
ORDER_SERVICE_URL=http://order-service:3000
```

## Advanced Usage

### Custom Configuration Manager

```typescript
import { ConfigManager } from '@abyss/shared-config';

class CustomConfigManager extends ConfigManager {
  async loadWithSecrets() {
    await this.load();

    // Load secrets from external service
    const secrets = await secretManager.getSecrets();
    this.set('JWT_SECRET', secrets.jwtSecret);
    this.set('DB_PASSWORD', secrets.dbPassword);
  }
}

const customConfig = new CustomConfigManager();
await customConfig.loadWithSecrets();
```

### Configuration Validation

```typescript
import { validateConfig, ConfigManager } from '@abyss/shared-config';

const config = ConfigManager.getInstance();
await config.load();

// Validate all configuration
const validation = validateConfig();

if (!validation.isValid) {
  console.error('Configuration validation failed:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log('Configuration is valid');
```

### Environment-Specific Behavior

```typescript
import {
  isProduction,
  isDevelopment,
  isTest,
  getEnvironment,
} from '@abyss/shared-config';

// Environment checks
if (isProduction()) {
  // Production-only setup
  console.log('Production mode: Enhanced security enabled');
}

if (isDevelopment()) {
  // Development-only setup
  console.log('Development mode: Debug logging enabled');
}

if (isTest()) {
  // Test-only setup
  console.log('Test mode: Using test database');
}

// Get current environment
const env = getEnvironment(); // 'development' | 'test' | 'staging' | 'production'
console.log(`Running in ${env} environment`);
```

### Enhanced Database and Redis Setup

```typescript
import {
  getDatabaseUrl,
  getDatabaseConfig,
  getDatabaseRetryConfig,
  getRedisConfig,
  getConfig,
} from '@abyss/shared-config';

// Enhanced database connection with full configuration
const dbConfig = getDatabaseConfig();
const db = new Pool(dbConfig);

// Database connection with retry logic
const retryConfig = getDatabaseRetryConfig();
async function connectWithRetry() {
  let attempts = 0;
  while (attempts < retryConfig.attempts) {
    try {
      await db.connect();
      console.log('Database connected successfully');
      break;
    } catch (error) {
      attempts++;
      if (attempts >= retryConfig.attempts) throw error;

      const delay = retryConfig.exponentialBackoff
        ? Math.min(
            retryConfig.delay * Math.pow(2, attempts - 1),
            retryConfig.maxDelay
          )
        : retryConfig.delay;

      console.log(
        `Database connection failed, retrying in ${delay}ms (attempt ${attempts}/${retryConfig.attempts})`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Enhanced Redis connection with security features
const redisConfig = getRedisConfig();
const redis = new Redis({
  ...redisConfig,
  lazyConnect: true,
  retryDelayOnFailover: redisConfig.retryDelayOnFailover,
  maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
  enableReadyCheck: true,
  enableOfflineQueue: false,
});

// Simple database URL for quick connections
const databaseUrl = getDatabaseUrl();
const simpleDb = new Pool({ connectionString: databaseUrl });
```

### Advanced Database Connection Management

```typescript
import {
  DatabaseConnectionManager,
  createDatabaseConnection,
  checkDatabaseHealth,
  createConnectionPool,
} from '@abyss/shared-config';

// Create managed database connection with retry logic
const dbManager = createDatabaseConnection(
  {
    maxRetries: 5,
    retryDelay: 1000,
    exponentialBackoff: true,
    maxRetryDelay: 10000,
    enableMonitoring: true,
    healthCheckInterval: 30000,
  },
  {
    onConnect: client => console.log('Client connected'),
    onError: error => console.error('Connection error:', error),
    onAcquire: client => console.log('Client acquired from pool'),
    onRelease: client => console.log('Client returned to pool'),
  }
);

// Connect with automatic retry
await dbManager.connect();

// Execute queries with built-in error handling
const result = await dbManager.query('SELECT * FROM users WHERE id = $1', [
  userId,
]);

// Execute transactions safely
const transferResult = await dbManager.transaction(async client => {
  await client.query(
    'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
    [amount, fromId]
  );
  await client.query(
    'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
    [amount, toId]
  );
  return { success: true };
});

// Monitor database health
const healthMetrics = dbManager.getHealthMetrics();
console.log('Database health:', {
  isHealthy: healthMetrics.isHealthy,
  totalConnections: healthMetrics.totalConnections,
  activeConnections: healthMetrics.activeConnections,
  lastHealthCheck: healthMetrics.lastHealthCheck,
});

// Health check for API endpoints
app.get('/health/database', async (req, res) => {
  const health = await checkDatabaseHealth();
  res.json(health);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await dbManager.disconnect();
  process.exit(0);
});
```

### Simple Connection Pool Setup

```typescript
import { createConnectionPool, getDatabaseConfig } from '@abyss/shared-config';

// Create connection pool with environment-specific defaults
const poolConfig = createConnectionPool({
  // Override specific settings if needed
  max: 25, // Override environment default
  ssl: { rejectUnauthorized: true },
});

// Use with your preferred database library
const pool = new Pool(poolConfig);
```

## Security Best Practices

### Database Security

1. **SSL/TLS Encryption** - Always enable SSL in production (`DB_SSL=true`)
2. **Certificate Validation** - Use `DB_SSL_REJECT_UNAUTHORIZED=true` for strict
   certificate validation
3. **Strong Passwords** - Minimum 12 characters in production, 8+ in development
4. **Connection Timeouts** - Configure timeouts to prevent hanging connections
5. **Connection Pool Limits** - Use appropriate pool sizes for your environment
6. **Connection Monitoring** - Monitor connection health and performance
7. **Credential Rotation** - Enable automatic credential rotation in production

### General Security

1. **Never commit secrets** to version control
2. **Use environment variables** for sensitive data in production
3. **Validate configuration** on startup with strict schemas
4. **Use secure defaults** for production environments (auto-enabled SSL, higher
   pool limits)
5. **Rotate secrets regularly** using external secret management
6. **Environment-specific validation** - Stricter rules in production
7. **Connection resilience** - Implement retry logic with exponential backoff

## Error Handling

```typescript
import { loadConfig, validateConfig } from '@abyss/shared-config';

try {
  await loadConfig();

  const validation = validateConfig();
  if (!validation.isValid) {
    throw new Error(
      `Configuration validation failed: ${validation.errors.join(', ')}`
    );
  }

  console.log('Configuration loaded successfully');
} catch (error) {
  console.error('Failed to load configuration:', error.message);
  process.exit(1);
}
```

## Development

```bash
# Build the library
turbo run build --filter=@abyss/shared-config

# Watch mode for development
turbo run dev --filter=@abyss/shared-config

# Run tests
turbo run test --filter=@abyss/shared-config

# Type checking
turbo run typecheck --filter=@abyss/shared-config
```

## Testing

```typescript
import { ConfigManager } from '@abyss/shared-config';

describe('Configuration', () => {
  let config: ConfigManager;

  beforeEach(() => {
    config = ConfigManager.getInstance();
    config.reset(); // Reset for clean test state
  });

  test('loads configuration correctly', async () => {
    process.env.SERVICE_NAME = 'test-service';
    process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters';

    await config.load();

    expect(config.get('SERVICE_NAME')).toBe('test-service');
    expect(config.get('JWT_SECRET')).toBe('test-jwt-secret-min-32-characters');
  });

  test('validates configuration', async () => {
    process.env.PORT = 'invalid-port';
    await config.load();

    const validation = config.validate();
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain(
      'Base config: "PORT" must be a valid port'
    );
  });
});
```

## Architecture

- **Singleton Pattern** - Single configuration instance per application
- **Environment Detection** - Automatic environment detection and file loading
- **Schema Validation** - Joi schemas for type safety and validation
- **Default Values** - Sensible defaults for all configuration options
- **Type Safety** - Full TypeScript support with interface definitions

---

Built with ❤️ for centralized, secure configuration management in the Abyss
Central Suite
