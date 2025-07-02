# Service Migration Example

This example shows how to migrate the Employee Service to use the service bootstrap utility.

## Before (Manual Setup)

```typescript
// services/employee-service/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { loadConfig, getConfig } from '@abyss/shared-config';
import { createLogger } from '@abyss/shared-utils';
import { timeEntryRoutes } from './routes/time-entry.routes';

async function startServer() {
  await loadConfig();
  const config = getConfig();
  const logger = createLogger({ service: 'employee-service' });
  
  const app = express();
  
  // Security middleware
  app.set('trust proxy', true);
  app.use(helmet());
  
  // CORS
  app.use(cors({
    origin: config.CORS_ORIGIN || '*',
    credentials: true
  }));
  
  // Compression
  app.use(compression());
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests'
  });
  app.use('/api/', limiter);
  
  // Database
  const db = new Pool({
    connectionString: config.DATABASE_URL,
    min: 2,
    max: 10
  });
  
  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info('Request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: Date.now() - start
      });
    });
    next();
  });
  
  // Health check
  app.get('/health', async (req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({
        status: 'healthy',
        service: 'employee-service',
        version: '1.0.0'
      });
    } catch (error) {
      res.status(503).json({ status: 'unhealthy' });
    }
  });
  
  // Routes
  app.use('/api/v1/time-entries', timeEntryRoutes);
  
  // Error handling
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  
  app.use((err, req, res, next) => {
    logger.error('Error', { error: err });
    res.status(500).json({ error: 'Internal server error' });
  });
  
  // Start server
  const server = app.listen(config.PORT, () => {
    logger.info('Server started', { port: config.PORT });
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received');
    server.close(() => {
      db.end(() => {
        process.exit(0);
      });
    });
  });
}

startServer().catch(console.error);
```

## After (Using Bootstrap Utility)

```typescript
// services/employee-service/src/index.ts
import { bootstrapService } from '@abyss/service-bootstrap';
import { setupRoutes } from './routes';
import { getEmployeeConfig } from './config';

async function startServer() {
  const config = getEmployeeConfig();
  
  const { logger, start } = await bootstrapService({
    name: 'employee-service',
    version: '1.0.0',
    port: config.PORT,
    
    database: {
      enabled: true,
      connectionString: config.DATABASE_URL
    },
    
    redis: {
      enabled: true,
      url: config.REDIS_URL,
      optional: true
    },
    
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000,
      maxRequests: 100
    },
    
    healthCheck: {
      detailed: true
    }
  }, setupRoutes);
  
  await start();
  logger.info('Employee service started successfully');
}

startServer().catch(console.error);
```

```typescript
// services/employee-service/src/routes/index.ts
import { Application } from 'express';
import { ServiceDependencies } from '@abyss/service-bootstrap';
import { timeEntryRoutes } from './time-entry.routes';

export function setupRoutes(app: Application, deps: ServiceDependencies) {
  const { logger, db } = deps;
  
  // Pass dependencies to route handlers
  app.use('/api/v1/time-entries', timeEntryRoutes(db, logger));
  
  // Add any service-specific middleware or routes here
}
```

## Benefits of Migration

1. **Reduced Code**: From ~150 lines to ~40 lines (73% reduction)
2. **Standardization**: Consistent setup across all services
3. **Better Health Checks**: Automatic database/Redis health monitoring
4. **Improved Logging**: Structured logs with correlation IDs
5. **Graceful Shutdown**: Proper cleanup of all resources
6. **Type Safety**: Full TypeScript support with dependency injection
7. **Testing**: Easier to test with simplified setup

## Migration Steps

1. **Install the bootstrap utility**:
   ```bash
   pnpm add @abyss/service-bootstrap
   ```

2. **Create a route setup function**:
   - Move route definitions to a separate function
   - Accept dependencies as parameters

3. **Update the main index.ts**:
   - Replace manual setup with `bootstrapService` call
   - Configure options based on your needs

4. **Update route handlers**:
   - Use provided logger and database connections
   - Remove hardcoded middleware

5. **Test the migration**:
   - Verify all endpoints work
   - Check health endpoints
   - Test graceful shutdown

6. **Remove old dependencies** (if not used elsewhere):
   - Manual middleware packages
   - Custom logging setup
   - Shutdown handlers

## Common Patterns

### Using Database in Routes

```typescript
// Before
const db = new Pool({ /* config */ });
router.get('/', async (req, res) => {
  const result = await db.query('SELECT * FROM users');
  res.json(result.rows);
});

// After
export function createUserRoutes(db: Pool, logger: Logger) {
  const router = Router();
  
  router.get('/', async (req, res) => {
    const result = await db.query('SELECT * FROM users');
    logger.info('Users fetched', { count: result.rowCount });
    res.json(result.rows);
  });
  
  return router;
}
```

### Adding Service-Specific Middleware

```typescript
export function setupRoutes(app: Application, deps: ServiceDependencies) {
  const { logger } = deps;
  
  // Add service-specific middleware
  app.use('/api/v1/protected', authenticateUser);
  app.use('/api/v1/admin', authorizeAdmin);
  
  // Setup routes
  app.use('/api/v1/users', userRoutes);
}
```

### Custom Health Checks

```typescript
const config = {
  healthCheck: {
    detailed: true,
    custom: async () => {
      // Check job queue
      const jobQueueHealthy = await checkJobQueue();
      
      // Check external API
      const apiHealthy = await checkExternalAPI();
      
      return {
        jobQueue: jobQueueHealthy ? 'healthy' : 'unhealthy',
        externalAPI: apiHealthy ? 'healthy' : 'unhealthy'
      };
    }
  }
};
```