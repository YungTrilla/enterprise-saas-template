import { Application, Request, Response } from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { Logger } from 'winston';
import { ServiceBootstrapConfig, HealthCheckResult } from './types';
import { checkDatabaseHealth } from './database';
import { checkRedisHealth } from './redis';

/**
 * Get memory usage information
 */
function getMemoryUsage() {
  const used = process.memoryUsage();
  const total = require('os').totalmem();
  const percentage = (used.heapUsed / total) * 100;
  
  return {
    used: Math.round(used.heapUsed / 1024 / 1024), // MB
    total: Math.round(total / 1024 / 1024), // MB
    percentage: Math.round(percentage * 100) / 100
  };
}

/**
 * Create health check handler
 */
export function createHealthCheckHandler(
  config: ServiceBootstrapConfig,
  startTime: number,
  db?: Pool,
  redis?: Redis
) {
  return async (req: Request, res: Response) => {
    const result: HealthCheckResult = {
      status: 'healthy',
      service: config.name,
      version: config.version,
      environment: config.environment || 'development',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString()
    };

    // Detailed health checks
    if (config.healthCheck?.detailed) {
      result.checks = {};

      // Database check
      if (db) {
        result.checks.database = await checkDatabaseHealth(
          db,
          config.database?.healthCheckQuery
        );
        if (result.checks.database.status === 'disconnected') {
          result.status = 'unhealthy';
        }
      }

      // Redis check
      if (redis) {
        result.checks.redis = await checkRedisHealth(redis);
        // Redis is often optional, so don't mark unhealthy if disconnected
        if (!config.redis?.optional && result.checks.redis.status === 'disconnected') {
          result.status = 'unhealthy';
        }
      }

      // Memory check
      result.checks.memory = getMemoryUsage();

      // Custom health check
      if (config.healthCheck?.custom) {
        try {
          result.checks.custom = await config.healthCheck.custom();
        } catch (error) {
          result.status = 'unhealthy';
          result.checks.custom = { 
            error: error instanceof Error ? error.message : 'Custom health check failed' 
          };
        }
      }
    }

    const statusCode = result.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(result);
  };
}

/**
 * Setup health check routes
 */
export function setupHealthRoutes(
  app: Application,
  config: ServiceBootstrapConfig,
  startTime: number,
  db?: Pool,
  redis?: Redis
): void {
  const healthPath = config.healthCheck?.path || '/health';
  
  // Main health check endpoint
  app.get(healthPath, createHealthCheckHandler(config, startTime, db, redis));

  // Kubernetes-style probes
  app.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
  });

  app.get('/health/ready', async (req, res) => {
    // Check if service is ready to accept traffic
    let ready = true;
    const checks: any = {};

    if (db) {
      const dbHealth = await checkDatabaseHealth(db);
      checks.database = dbHealth.status;
      if (dbHealth.status === 'disconnected') {
        ready = false;
      }
    }

    if (redis && !config.redis?.optional) {
      const redisHealth = await checkRedisHealth(redis);
      checks.redis = redisHealth.status;
      if (redisHealth.status === 'disconnected') {
        ready = false;
      }
    }

    res.status(ready ? 200 : 503).json({
      ready,
      checks
    });
  });

  // Service info endpoint
  app.get(`${config.apiPrefix || '/api/v1'}/info`, (req, res) => {
    res.json({
      service: config.name,
      version: config.version,
      environment: config.environment || 'development',
      uptime: Math.floor((Date.now() - startTime) / 1000)
    });
  });
}