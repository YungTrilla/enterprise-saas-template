import { Server } from 'http';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { Logger } from 'winston';
import { ServiceBootstrapConfig } from './types';
import { closeDatabaseConnection } from './database';
import { closeRedisConnection } from './redis';

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown(
  server: Server | undefined,
  config: ServiceBootstrapConfig,
  logger: Logger,
  db?: Pool,
  redis?: Redis
): () => Promise<void> {
  let isShuttingDown = false;

  const shutdown = async (signal?: string) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress', { signal });
      return;
    }

    isShuttingDown = true;
    logger.info('Graceful shutdown initiated', { signal });

    const shutdownTimeout = config.shutdown?.timeout || 30000;
    const shutdownTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, shutdownTimeout);

    try {
      // Stop accepting new connections
      if (server) {
        await new Promise<void>((resolve, reject) => {
          server.close((err) => {
            if (err) {
              logger.error('Error closing server', { error: err.message });
              reject(err);
            } else {
              logger.info('Server stopped accepting new connections');
              resolve();
            }
          });
        });
      }

      // Run custom shutdown handlers
      if (config.shutdown?.handlers) {
        for (const handler of config.shutdown.handlers) {
          try {
            await handler();
          } catch (error) {
            logger.error('Custom shutdown handler failed', {
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      // Close database connections
      await closeDatabaseConnection(db, logger);

      // Close Redis connections
      await closeRedisConnection(redis, logger);

      clearTimeout(shutdownTimer);
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      clearTimeout(shutdownTimer);
      logger.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    }
  };

  // Register signal handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack
    });
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      promise
    });
    shutdown('unhandledRejection');
  });

  return () => shutdown('manual');
}