/**
 * Health Check Routes
 * Gateway and service health monitoring endpoints
 */

import { Router, Request, Response } from 'express';
import { HealthCheckService } from '../services/health-check.service';
import { circuitBreakerRegistry } from '../services/circuit-breaker.service';
import { getServiceInfo, getServiceRegistry } from '../config';

export function createHealthRoutes(healthService: HealthCheckService): Router {
  const router = Router();

  /**
   * GET /health
   * Basic health check
   */
  router.get('/', (req: Request, res: Response) => {
    const serviceInfo = getServiceInfo();

    res.json({
      success: true,
      status: 'healthy',
      service: serviceInfo,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    });
  });

  /**
   * GET /health/live
   * Kubernetes liveness probe
   */
  router.get('/live', (req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'alive',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    });
  });

  /**
   * GET /health/ready
   * Kubernetes readiness probe
   */
  router.get('/ready', async (req: Request, res: Response) => {
    try {
      const systemHealth = await healthService.getSystemHealth();

      if (systemHealth.status === 'unhealthy') {
        return res.status(503).json({
          success: false,
          status: 'not_ready',
          reason: 'One or more services are unhealthy',
          services: systemHealth.services.filter(s => s.status === 'unhealthy'),
          timestamp: new Date().toISOString(),
          correlationId: req.correlationId,
        });
      }

      res.json({
        success: true,
        status: 'ready',
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'not_ready',
        reason: (error as Error).message,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    }
  });

  /**
   * GET /health/detailed
   * Detailed health check including all services
   */
  router.get('/detailed', async (req: Request, res: Response) => {
    try {
      const systemHealth = await healthService.getSystemHealth();
      const circuitStates = circuitBreakerRegistry.getAllStates();

      res.json({
        success: true,
        ...systemHealth,
        circuitBreakers: circuitStates,
        correlationId: req.correlationId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    }
  });

  /**
   * GET /health/services
   * Check health of all registered services
   */
  router.get('/services', async (req: Request, res: Response) => {
    try {
      await healthService.checkAllServices();
      const systemHealth = await healthService.getSystemHealth();

      res.json({
        success: true,
        status: systemHealth.status,
        services: systemHealth.services,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVICE_CHECK_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    }
  });

  /**
   * GET /health/services/:serviceName
   * Check health of specific service
   */
  router.get('/services/:serviceName', async (req: Request, res: Response) => {
    try {
      const { serviceName } = req.params;
      const force = req.query.force === 'true';

      let serviceHealth;
      if (force) {
        serviceHealth = await healthService.forceServiceCheck(serviceName);
      } else {
        serviceHealth = healthService.getServiceHealth(serviceName);
        if (!serviceHealth) {
          serviceHealth = await healthService.forceServiceCheck(serviceName);
        }
      }

      if (!serviceHealth) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: `Service ${serviceName} not found in registry`,
          },
          timestamp: new Date().toISOString(),
          correlationId: req.correlationId,
        });
      }

      res.json({
        success: true,
        service: serviceHealth,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVICE_CHECK_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    }
  });

  /**
   * POST /health/circuit-breakers/:serviceName/reset
   * Reset circuit breaker for specific service
   */
  router.post('/circuit-breakers/:serviceName/reset', (req: Request, res: Response) => {
    try {
      const { serviceName } = req.params;
      const serviceRegistry = getServiceRegistry();

      if (!serviceRegistry[serviceName]) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: `Service ${serviceName} not found in registry`,
          },
          timestamp: new Date().toISOString(),
          correlationId: req.correlationId,
        });
      }

      circuitBreakerRegistry.resetCircuit(serviceName);

      res.json({
        success: true,
        message: `Circuit breaker for ${serviceName} has been reset`,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CIRCUIT_RESET_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    }
  });

  return router;
}
