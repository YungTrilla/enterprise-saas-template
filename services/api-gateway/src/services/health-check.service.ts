/**
 * Health Check Service
 * Monitors health of all registered microservices
 */

import axios from 'axios';
import { IServiceRegistry } from '../config';
import { createLogger } from '../utils/logger';

export interface IServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
  details?: any;
}

export interface ISystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: IServiceHealth[];
  gateway: {
    status: 'healthy';
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
  timestamp: string;
}

export class HealthCheckService {
  private logger = createLogger('health-check-service');
  private healthCache = new Map<string, IServiceHealth>();
  private checkInterval: NodeJS.Timer | null = null;

  constructor(
    private serviceRegistry: IServiceRegistry,
    private intervalMs: number = 30000 // 30 seconds
  ) {}

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(): void {
    // Initial check
    this.checkAllServices();

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAllServices();
    }, this.intervalMs);

    this.logger.info('Started periodic health checks', {
      intervalMs: this.intervalMs,
    });
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.logger.info('Stopped periodic health checks');
    }
  }

  /**
   * Check health of all services
   */
  async checkAllServices(): Promise<void> {
    const checks = Object.entries(this.serviceRegistry).map(([name, config]) =>
      this.checkServiceHealth(name, config)
    );

    await Promise.allSettled(checks);
  }

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(
    serviceName: string,
    serviceConfig: IServiceRegistry[string]
  ): Promise<IServiceHealth> {
    const startTime = Date.now();

    try {
      const response = await axios.get(`${serviceConfig.url}${serviceConfig.healthEndpoint}`, {
        timeout: 5000,
        validateStatus: () => true,
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === 200;

      const health: IServiceHealth = {
        name: serviceName,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: response.data,
      };

      if (!isHealthy) {
        health.error = `Unhealthy status code: ${response.status}`;
      }

      this.healthCache.set(serviceName, health);

      this.logger.debug('Service health check completed', {
        service: serviceName,
        status: health.status,
        responseTime,
      });

      return health;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      const health: IServiceHealth = {
        name: serviceName,
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: (error as Error).message,
      };

      this.healthCache.set(serviceName, health);

      this.logger.error('Service health check failed', {
        service: serviceName,
        error: (error as Error).message,
        responseTime,
      });

      return health;
    }
  }

  /**
   * Get current system health
   */
  async getSystemHealth(): Promise<ISystemHealth> {
    // Get cached health data or check all services
    if (this.healthCache.size === 0) {
      await this.checkAllServices();
    }

    const services = Array.from(this.healthCache.values());

    // Determine overall system status
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    let systemStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (unhealthyCount > services.length / 2) {
      systemStatus = 'unhealthy';
    } else if (unhealthyCount > 0 || degradedCount > 0) {
      systemStatus = 'degraded';
    } else {
      systemStatus = 'healthy';
    }

    // Get gateway metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      status: systemStatus,
      services,
      gateway: {
        status: 'healthy',
        uptime: Math.floor(uptime),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get health of specific service
   */
  getServiceHealth(serviceName: string): IServiceHealth | null {
    return this.healthCache.get(serviceName) || null;
  }

  /**
   * Force health check for specific service
   */
  async forceServiceCheck(serviceName: string): Promise<IServiceHealth | null> {
    const serviceConfig = this.serviceRegistry[serviceName];
    if (!serviceConfig) {
      return null;
    }

    return this.checkServiceHealth(serviceName, serviceConfig);
  }

  /**
   * Clear health cache
   */
  clearCache(): void {
    this.healthCache.clear();
    this.logger.info('Health cache cleared');
  }
}
