# Service Bootstrap Utility

A shared utility for bootstrapping Abyss Central microservices with standard configuration, middleware, health checks, and graceful shutdown handling.

## Features

- 🚀 **Quick Setup**: Bootstrap a production-ready service in minutes
- 🔒 **Security**: Built-in security middleware (Helmet, CORS, rate limiting)
- 📊 **Health Checks**: Kubernetes-compatible health and readiness probes
- 🗄️ **Database Support**: PostgreSQL connection pooling with health checks
- 📦 **Redis Support**: Optional Redis connection with health checks
- 📝 **Structured Logging**: Winston logger with correlation IDs
- 🛡️ **Error Handling**: Consistent error responses and logging
- 🔄 **Graceful Shutdown**: Proper cleanup of connections and resources
- 🎯 **TypeScript**: Full type safety and IntelliSense support

## Installation

```bash
pnpm add @abyss/service-bootstrap
```

## Quick Start

```typescript
import { bootstrapService } from '@abyss/service-bootstrap';
import { routes } from './routes';

async function startServer() {
  const { app, logger, db, start } = await bootstrapService({
    name: 'my-service',
    version: '1.0.0',
    port: 3000,
    
    database: {
      enabled: true,
      connectionString: process.env.DATABASE_URL
    },
    
    redis: {
      enabled: true,
      url: process.env.REDIS_URL,
      optional: true // Don't fail if Redis is unavailable
    }
  }, (app, { logger, db, redis }) => {
    // Setup your service routes
    app.use('/api/v1/resources', routes);
  });

  // Start the server
  await start();
  logger.info('Service is ready to accept requests');
}

startServer().catch(console.error);
```

## Configuration Options

### Basic Configuration

```typescript
interface ServiceBootstrapConfig {
  // Required
  name: string;              // Service name
  version: string;           // Service version
  port: number;              // Port to listen on
  
  // Optional
  environment?: string;      // Environment (defaults to NODE_ENV)
  host?: string;            // Host to bind to (defaults to '0.0.0.0')
  apiPrefix?: string;       // API prefix (defaults to '/api/v1')
}
```

### Middleware Options

```typescript
{
  cors: {
    enabled?: boolean;      // Enable CORS (default: true)
    origins?: string[];     // Allowed origins (default: all)
    credentials?: boolean;  // Allow credentials (default: true)
  },
  
  rateLimit: {
    enabled?: boolean;      // Enable rate limiting (default: true)
    windowMs?: number;      // Time window in ms (default: 15 minutes)
    maxRequests?: number;   // Max requests per window (default: 100)
    message?: string;       // Custom rate limit message
  },
  
  bodyParser: {
    jsonLimit?: string;     // JSON body size limit (default: '10mb')
    urlEncodedLimit?: string; // URL-encoded limit (default: '10mb')
  },
  
  security: {
    trustProxy?: boolean;   // Trust proxy headers (default: false)
    helmet?: boolean;       // Use Helmet middleware (default: true)
  }
}
```

### Database Configuration

```typescript
{
  database: {
    enabled: boolean;         // Enable database connection
    connectionString?: string; // PostgreSQL connection string
    poolMin?: number;         // Min pool size (default: 2)
    poolMax?: number;         // Max pool size (default: 10)
    healthCheckQuery?: string; // Custom health check query
  }
}
```

### Redis Configuration

```typescript
{
  redis: {
    enabled: boolean;         // Enable Redis connection
    url?: string;            // Redis connection URL
    optional?: boolean;      // Don't fail if Redis unavailable
  }
}
```

### Health Check Options

```typescript
{
  healthCheck: {
    path?: string;           // Health check path (default: '/health')
    detailed?: boolean;      // Include detailed checks (default: false)
    custom?: () => Promise<any>; // Custom health check function
  }
}
```

### Logging Options

```typescript
{
  logging: {
    service?: string;        // Service name for logs
    level?: string;         // Log level (default: 'info')
  }
}
```

### Shutdown Options

```typescript
{
  shutdown: {
    timeout?: number;        // Shutdown timeout in ms (default: 30000)
    handlers?: Array<() => Promise<void>>; // Custom cleanup handlers
  }
}
```

## API Endpoints

### Health Checks

- `GET /health` - Main health check endpoint
- `GET /health/live` - Kubernetes liveness probe
- `GET /health/ready` - Kubernetes readiness probe
- `GET /api/v1/info` - Service information

### Health Check Response

```json
{
  "status": "healthy",
  "service": "my-service",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:00:00Z",
  "checks": {
    "database": {
      "status": "connected",
      "latency": 5
    },
    "redis": {
      "status": "connected",
      "latency": 2
    },
    "memory": {
      "used": 128,
      "total": 8192,
      "percentage": 1.56
    }
  }
}
```

## Advanced Usage

### Custom Middleware

```typescript
await bootstrapService(config, (app, deps) => {
  // Add custom middleware before routes
  app.use(myCustomMiddleware);
  
  // Setup routes
  app.use('/api/v1/users', userRoutes);
});
```

### Custom Health Checks

```typescript
const config = {
  healthCheck: {
    detailed: true,
    custom: async () => {
      // Check external service
      const serviceHealthy = await checkExternalService();
      return {
        externalService: serviceHealthy ? 'healthy' : 'unhealthy'
      };
    }
  }
};
```

### Custom Shutdown Handlers

```typescript
const config = {
  shutdown: {
    handlers: [
      async () => {
        // Clean up background jobs
        await jobQueue.close();
      },
      async () => {
        // Close WebSocket connections
        await wsServer.close();
      }
    ]
  }
};
```

### Using Dependencies in Routes

```typescript
await bootstrapService(config, (app, { logger, db, redis }) => {
  app.get('/users', async (req, res) => {
    try {
      // Use the database connection
      const result = await db.query('SELECT * FROM users');
      
      // Use Redis for caching
      if (redis) {
        await redis.setex('users', 3600, JSON.stringify(result.rows));
      }
      
      // Use the logger
      logger.info('Users fetched', { count: result.rows.length });
      
      res.json(result.rows);
    } catch (error) {
      logger.error('Failed to fetch users', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});
```

## Middleware Stack

The bootstrap utility applies middleware in the following order:

1. **Security** (Helmet)
2. **CORS**
3. **Compression**
4. **Body Parsing** (JSON, URL-encoded)
5. **Correlation ID**
6. **Request Logging**
7. **Rate Limiting**
8. **Health Routes**
9. **Your Custom Routes**
10. **404 Handler**
11. **Error Handler**

## Environment Variables

The bootstrap utility respects these environment variables:

- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection URL

## Error Handling

All errors are automatically caught and logged with:

- Correlation ID for request tracing
- Structured error details
- Appropriate HTTP status codes
- Consistent error response format

Example error response:
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "correlationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

## Graceful Shutdown

The service handles graceful shutdown automatically:

1. Stops accepting new connections
2. Waits for existing requests to complete
3. Runs custom shutdown handlers
4. Closes database connections
5. Closes Redis connections
6. Exits with appropriate code

Shutdown is triggered by:
- `SIGTERM` signal (Kubernetes/Docker)
- `SIGINT` signal (Ctrl+C)
- Uncaught exceptions
- Unhandled promise rejections
- Manual shutdown call

## Testing

```typescript
import { bootstrapService } from '@abyss/service-bootstrap';
import request from 'supertest';

describe('My Service', () => {
  let app;
  let shutdown;

  beforeAll(async () => {
    const result = await bootstrapService(testConfig, setupRoutes);
    app = result.app;
    shutdown = result.shutdown;
  });

  afterAll(async () => {
    await shutdown();
  });

  it('should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });
});
```

## Best Practices

1. **Always handle database/Redis being optional** in development
2. **Use structured logging** with the provided logger
3. **Add custom health checks** for external dependencies
4. **Implement proper shutdown handlers** for background tasks
5. **Use correlation IDs** for request tracing
6. **Keep route setup function focused** on routing only
7. **Use environment variables** for configuration
8. **Test health endpoints** in your integration tests

## Migration Guide

### From Manual Express Setup

Before:
```typescript
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
// ... 50+ lines of boilerplate
```

After:
```typescript
const { app } = await bootstrapService(config, setupRoutes);
// Done! All middleware configured
```

### From Existing Service

1. Install the package
2. Replace your `index.ts` with bootstrap call
3. Move routes to setup function
4. Remove boilerplate middleware
5. Update health check endpoints
6. Test and deploy

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

Part of Abyss Central - VOID Software Company