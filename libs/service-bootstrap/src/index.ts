import express from 'express';
import { Server } from 'http';
import { loadConfig } from '@abyss/shared-config';
import {
  ServiceBootstrapConfig,
  ServiceBootstrapResult,
  RouteSetupFunction,
  ServiceDependencies
} from './types';
import { createServiceLogger } from './logger';
import { applyStandardMiddleware, applyErrorHandlers } from './middleware';
import { createDatabaseConnection } from './database';
import { createRedisConnection } from './redis';
import { setupHealthRoutes } from './health';
import { setupGracefulShutdown } from './shutdown';

/**
 * Bootstrap a microservice with standard configuration
 */
export async function bootstrapService(
  config: ServiceBootstrapConfig,
  setupRoutes: RouteSetupFunction
): Promise<ServiceBootstrapResult> {
  const startTime = Date.now();
  
  // Load shared configuration
  await loadConfig();
  
  // Create logger
  const logger = createServiceLogger(config);
  logger.info('Starting service', {
    service: config.name,
    version: config.version,
    environment: config.environment || 'development',
    port: config.port
  });

  // Create Express app
  const app = express();

  // Apply standard middleware
  applyStandardMiddleware(app, config, logger);

  // Create database connection
  const db = await createDatabaseConnection(config, logger);

  // Create Redis connection
  const redis = await createRedisConnection(config, logger);

  // Setup health check routes
  setupHealthRoutes(app, config, startTime, db, redis);

  // Create dependencies object for route setup
  const deps: ServiceDependencies = {
    logger,
    db,
    redis,
    config
  };

  // Setup service-specific routes
  setupRoutes(app, deps);

  // Apply error handlers (must be last)
  applyErrorHandlers(app);

  // Create server
  let server: Server | undefined;

  // Setup graceful shutdown
  const shutdown = setupGracefulShutdown(server, config, logger, db, redis);

  // Start function
  const start = async () => {
    return new Promise<void>((resolve, reject) => {
      try {
        server = app.listen(config.port, config.host || '0.0.0.0', () => {
          logger.info('Service started successfully', {
            service: config.name,
            port: config.port,
            host: config.host || '0.0.0.0',
            environment: config.environment || 'development',
            startupTime: Date.now() - startTime
          });
          resolve();
        });

        server.on('error', (error) => {
          logger.error('Server error', { error });
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  return {
    app,
    server,
    logger,
    db,
    redis,
    shutdown,
    start
  };
}

// Re-export types and utilities
export * from './types';
export { createServiceLogger } from './logger';
export { 
  applyStandardMiddleware, 
  applyErrorHandlers,
  correlationIdMiddleware,
  createRequestLogger
} from './middleware';
export { 
  createDatabaseConnection, 
  checkDatabaseHealth,
  closeDatabaseConnection
} from './database';
export { 
  createRedisConnection, 
  checkRedisHealth,
  closeRedisConnection
} from './redis';
export { 
  createHealthCheckHandler,
  setupHealthRoutes
} from './health';
export { setupGracefulShutdown } from './shutdown';