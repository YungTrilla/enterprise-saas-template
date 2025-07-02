import Redis from 'ioredis';
import { Logger } from 'winston';
import { ServiceBootstrapConfig } from './types';

/**
 * Create and configure Redis connection
 */
export async function createRedisConnection(
  config: ServiceBootstrapConfig,
  logger: Logger
): Promise<Redis | undefined> {
  if (!config.redis?.enabled) {
    return undefined;
  }

  if (!config.redis.url) {
    if (config.redis.optional) {
      logger.warn('Redis URL not provided, skipping Redis connection', {
        service: config.name
      });
      return undefined;
    }
    throw new Error('Redis URL is required when Redis is enabled');
  }

  const redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });

  // Handle connection events
  redis.on('connect', () => {
    logger.info('Redis connection established', {
      service: config.name
    });
  });

  redis.on('error', (err) => {
    logger.error('Redis connection error', {
      service: config.name,
      error: err.message
    });
    if (!config.redis.optional) {
      throw err;
    }
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed', {
      service: config.name
    });
  });

  // Test connection
  try {
    await redis.ping();
    return redis;
  } catch (error) {
    if (config.redis.optional) {
      logger.warn('Failed to connect to Redis, continuing without cache', {
        service: config.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      redis.disconnect();
      return undefined;
    }
    throw error;
  }
}

/**
 * Check Redis health
 */
export async function checkRedisHealth(
  redis: Redis
): Promise<{ status: 'connected' | 'disconnected'; latency?: number }> {
  const start = Date.now();
  
  try {
    await redis.ping();
    const latency = Date.now() - start;
    return { status: 'connected', latency };
  } catch (error) {
    return { status: 'disconnected' };
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(
  redis: Redis | undefined,
  logger: Logger
): Promise<void> {
  if (!redis) return;

  try {
    redis.disconnect();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}