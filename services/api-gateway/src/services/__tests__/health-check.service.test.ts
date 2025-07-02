/**
 * Health Check Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthCheckService } from '../health-check.service';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as any;

describe('HealthCheckService', () => {
  let healthCheckService: HealthCheckService;
  const mockServices = {
    auth: 'http://auth-service:3001',
    inventory: 'http://inventory-service:3020',
    orders: 'http://orders-service:3021',
  };

  beforeEach(() => {
    healthCheckService = new HealthCheckService(mockServices);
    vi.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('should return healthy status when service is up', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: 'healthy',
          service: 'auth-service',
          version: '1.0.0',
          uptime: 3600,
        },
        status: 200,
      });

      const result = await healthCheckService.checkHealth('auth', 'http://auth-service:3001');

      expect(result).toEqual({
        service: 'auth',
        status: 'healthy',
        latency: expect.any(Number),
        details: {
          status: 'healthy',
          service: 'auth-service',
          version: '1.0.0',
          uptime: 3600,
        },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://auth-service:3001/health',
        { timeout: 5000 }
      );
    });

    it('should return unhealthy status when service is down', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      const result = await healthCheckService.checkHealth('auth', 'http://auth-service:3001');

      expect(result).toEqual({
        service: 'auth',
        status: 'unhealthy',
        latency: expect.any(Number),
        error: 'Connection refused',
      });
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';
      mockedAxios.get.mockRejectedValue(timeoutError);

      const result = await healthCheckService.checkHealth('inventory', 'http://inventory-service:3020');

      expect(result).toEqual({
        service: 'inventory',
        status: 'unhealthy',
        latency: expect.any(Number),
        error: 'timeout of 5000ms exceeded',
      });
    });

    it('should handle non-200 status codes', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { error: 'Service degraded' },
        status: 503,
      });

      const result = await healthCheckService.checkHealth('orders', 'http://orders-service:3021');

      expect(result).toEqual({
        service: 'orders',
        status: 'unhealthy',
        latency: expect.any(Number),
        details: { error: 'Service degraded' },
      });
    });

    it('should measure latency accurately', async () => {
      // Mock a delay
      mockedAxios.get.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => 
            resolve({ data: { status: 'healthy' }, status: 200 }), 
            100
          )
        )
      );

      const result = await healthCheckService.checkHealth('auth', 'http://auth-service:3001');

      expect(result.latency).toBeGreaterThanOrEqual(100);
      expect(result.latency).toBeLessThan(200);
    });
  });

  describe('checkAllServices', () => {
    it('should check all configured services', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: { status: 'healthy' }, status: 200 })
        .mockResolvedValueOnce({ data: { status: 'healthy' }, status: 200 })
        .mockRejectedValueOnce(new Error('Connection refused'));

      const results = await healthCheckService.checkAllServices();

      expect(results).toHaveLength(3);
      expect(results).toContainEqual(
        expect.objectContaining({
          service: 'auth',
          status: 'healthy',
        })
      );
      expect(results).toContainEqual(
        expect.objectContaining({
          service: 'inventory',
          status: 'healthy',
        })
      );
      expect(results).toContainEqual(
        expect.objectContaining({
          service: 'orders',
          status: 'unhealthy',
          error: 'Connection refused',
        })
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should handle parallel health checks', async () => {
      // All services return healthy
      mockedAxios.get.mockResolvedValue({
        data: { status: 'healthy' },
        status: 200,
      });

      const startTime = Date.now();
      const results = await healthCheckService.checkAllServices();
      const duration = Date.now() - startTime;

      // Should complete faster than sequential (3 * 5000ms timeout)
      expect(duration).toBeLessThan(1000);
      expect(results).toHaveLength(3);
      expect(results.every(r => r.status === 'healthy')).toBe(true);
    });

    it('should continue checking other services if one fails', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: { status: 'healthy' }, status: 200 })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { status: 'healthy' }, status: 200 });

      const results = await healthCheckService.checkAllServices();

      expect(results).toHaveLength(3);
      const healthyServices = results.filter(r => r.status === 'healthy');
      const unhealthyServices = results.filter(r => r.status === 'unhealthy');

      expect(healthyServices).toHaveLength(2);
      expect(unhealthyServices).toHaveLength(1);
      expect(unhealthyServices[0].error).toBe('Network error');
    });
  });

  describe('getOverallHealth', () => {
    it('should return healthy when all services are up', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { status: 'healthy' },
        status: 200,
      });

      const overallHealth = await healthCheckService.getOverallHealth();

      expect(overallHealth).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        services: {
          total: 3,
          healthy: 3,
          unhealthy: 0,
        },
        checks: expect.arrayContaining([
          expect.objectContaining({ service: 'auth', status: 'healthy' }),
          expect.objectContaining({ service: 'inventory', status: 'healthy' }),
          expect.objectContaining({ service: 'orders', status: 'healthy' }),
        ]),
      });
    });

    it('should return degraded when some services are down', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: { status: 'healthy' }, status: 200 })
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValueOnce({ data: { status: 'healthy' }, status: 200 });

      const overallHealth = await healthCheckService.getOverallHealth();

      expect(overallHealth).toEqual({
        status: 'degraded',
        timestamp: expect.any(String),
        services: {
          total: 3,
          healthy: 2,
          unhealthy: 1,
        },
        checks: expect.arrayContaining([
          expect.objectContaining({ status: 'healthy' }),
          expect.objectContaining({ status: 'unhealthy' }),
        ]),
      });
    });

    it('should return unhealthy when all services are down', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      const overallHealth = await healthCheckService.getOverallHealth();

      expect(overallHealth).toEqual({
        status: 'unhealthy',
        timestamp: expect.any(String),
        services: {
          total: 3,
          healthy: 0,
          unhealthy: 3,
        },
        checks: expect.arrayContaining([
          expect.objectContaining({ status: 'unhealthy', error: 'Connection refused' }),
        ]),
      });
    });

    it('should include timestamp in ISO format', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { status: 'healthy' },
        status: 200,
      });

      const overallHealth = await healthCheckService.getOverallHealth();

      expect(overallHealth.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('edge cases', () => {
    it('should handle empty service configuration', async () => {
      const emptyHealthCheck = new HealthCheckService({});
      const results = await emptyHealthCheck.checkAllServices();

      expect(results).toEqual([]);
    });

    it('should handle malformed health response', async () => {
      mockedAxios.get.mockResolvedValue({
        data: 'Not a JSON response',
        status: 200,
      });

      const result = await healthCheckService.checkHealth('auth', 'http://auth-service:3001');

      expect(result).toEqual({
        service: 'auth',
        status: 'healthy',
        latency: expect.any(Number),
        details: 'Not a JSON response',
      });
    });

    it('should handle network errors with response data', async () => {
      const errorWithResponse = {
        message: 'Request failed',
        response: {
          data: { error: 'Service error', code: 'INTERNAL_ERROR' },
          status: 500,
        },
      };

      mockedAxios.get.mockRejectedValue(errorWithResponse);

      const result = await healthCheckService.checkHealth('auth', 'http://auth-service:3001');

      expect(result).toEqual({
        service: 'auth',
        status: 'unhealthy',
        latency: expect.any(Number),
        error: 'Request failed',
      });
    });
  });
});