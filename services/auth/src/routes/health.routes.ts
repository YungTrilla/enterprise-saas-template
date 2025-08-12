/**
 * Health Check Routes
 * Service health monitoring endpoints
 */

import { Router } from 'express';
import { checkDatabaseHealth } from '@template/shared-config';
import { getServiceInfo } from '../config';

const router = Router();

/**
 * Basic health check
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: getServiceInfo(),
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId
  });
});

/**
 * Detailed health check
 */
router.get('/detailed', async (req, res) => {
  const serviceInfo = getServiceInfo();
  
  try {
    // Check database connectivity
    const dbHealth = await checkDatabaseHealth();
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    // Check uptime
    const uptime = Math.floor(process.uptime());
    
    res.json({
      success: true,
      status: 'healthy',
      service: serviceInfo,
      health: {
        database: dbHealth,
        memory: memoryUsageMB,
        uptime: {
          seconds: uptime,
          human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`
        },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: serviceInfo,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: (error as Error).message
      },
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  }
});

/**
 * Readiness probe
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if service is ready to accept requests
    const dbHealth = await checkDatabaseHealth();
    
    if (dbHealth.status === 'healthy') {
      res.json({
        success: true,
        status: 'ready',
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'not_ready',
        reason: 'Database not available',
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'not_ready',
      reason: (error as Error).message,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  }
});

/**
 * Liveness probe
 */
router.get('/live', (req, res) => {
  res.json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId
  });
});

export { router as healthRoutes };