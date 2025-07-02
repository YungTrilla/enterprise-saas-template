import { bootstrapService } from '../index';
import { ServiceBootstrapConfig } from '../types';
import express from 'express';
import request from 'supertest';

// Mock database and Redis modules
jest.mock('../database', () => ({
  createDatabaseConnection: jest.fn().mockResolvedValue({
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
  }),
  checkDatabaseHealth: jest.fn().mockResolvedValue({ 
    status: 'connected', 
    latency: 5 
  }),
  closeDatabaseConnection: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../redis', () => ({
  createRedisConnection: jest.fn().mockResolvedValue({
    ping: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn()
  }),
  checkRedisHealth: jest.fn().mockResolvedValue({ 
    status: 'connected', 
    latency: 2 
  }),
  closeRedisConnection: jest.fn().mockResolvedValue(undefined)
}));

describe('bootstrapService', () => {
  const baseConfig: ServiceBootstrapConfig = {
    name: 'test-service',
    version: '1.0.0',
    environment: 'test',
    port: 3000
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Bootstrap', () => {
    it('should bootstrap a minimal service', async () => {
      const setupRoutes = jest.fn();
      const result = await bootstrapService(baseConfig, setupRoutes);

      expect(result).toHaveProperty('app');
      expect(result).toHaveProperty('logger');
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('shutdown');
      expect(setupRoutes).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          logger: expect.any(Object),
          config: baseConfig
        })
      );
    });

    it('should create health check endpoints', async () => {
      const result = await bootstrapService(baseConfig, () => {});
      const response = await request(result.app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'test-service',
        version: '1.0.0',
        environment: 'test'
      });
    });

    it('should create service info endpoint', async () => {
      const result = await bootstrapService(baseConfig, () => {});
      const response = await request(result.app).get('/api/v1/info');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        service: 'test-service',
        version: '1.0.0',
        environment: 'test'
      });
    });

    it('should handle 404 routes', async () => {
      const result = await bootstrapService(baseConfig, () => {});
      const response = await request(result.app).get('/non-existent');
      
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ error: 'Not found' });
    });
  });

  describe('Middleware Configuration', () => {
    it('should apply CORS when enabled', async () => {
      const config = {
        ...baseConfig,
        cors: {
          enabled: true,
          origins: ['http://localhost:3001']
        }
      };
      
      const result = await bootstrapService(config, () => {});
      const response = await request(result.app)
        .options('/api/v1/test')
        .set('Origin', 'http://localhost:3001');
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3001');
    });

    it('should apply rate limiting when enabled', async () => {
      const config = {
        ...baseConfig,
        rateLimit: {
          enabled: true,
          windowMs: 100,
          maxRequests: 2
        }
      };
      
      const result = await bootstrapService(config, (app) => {
        app.get('/test', (req, res) => res.json({ ok: true }));
      });

      // Make requests up to the limit
      await request(result.app).get('/test');
      await request(result.app).get('/test');
      
      // This should be rate limited
      const response = await request(result.app).get('/test');
      expect(response.status).toBe(429);
    });

    it('should add correlation ID to requests', async () => {
      const result = await bootstrapService(baseConfig, (app) => {
        app.get('/test', (req, res) => {
          res.json({ correlationId: req.correlationId });
        });
      });

      const response = await request(result.app).get('/test');
      expect(response.body.correlationId).toBe('test-correlation-id');
      expect(response.headers['x-correlation-id']).toBe('test-correlation-id');
    });

    it('should preserve existing correlation ID', async () => {
      const result = await bootstrapService(baseConfig, (app) => {
        app.get('/test', (req, res) => {
          res.json({ correlationId: req.correlationId });
        });
      });

      const response = await request(result.app)
        .get('/test')
        .set('x-correlation-id', 'existing-id');
      
      expect(response.body.correlationId).toBe('existing-id');
      expect(response.headers['x-correlation-id']).toBe('existing-id');
    });
  });

  describe('Database Configuration', () => {
    it('should create database connection when enabled', async () => {
      const config = {
        ...baseConfig,
        database: {
          enabled: true,
          connectionString: 'postgresql://test'
        }
      };

      const result = await bootstrapService(config, () => {});
      expect(result.db).toBeDefined();
    });

    it('should not create database connection when disabled', async () => {
      const config = {
        ...baseConfig,
        database: {
          enabled: false
        }
      };

      const result = await bootstrapService(config, () => {});
      expect(result.db).toBeUndefined();
    });

    it('should include database health in detailed health check', async () => {
      const config = {
        ...baseConfig,
        database: {
          enabled: true,
          connectionString: 'postgresql://test'
        },
        healthCheck: {
          detailed: true
        }
      };

      const result = await bootstrapService(config, () => {});
      const response = await request(result.app).get('/health');
      
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks.database).toMatchObject({
        status: 'connected',
        latency: 5
      });
    });
  });

  describe('Redis Configuration', () => {
    it('should create Redis connection when enabled', async () => {
      const config = {
        ...baseConfig,
        redis: {
          enabled: true,
          url: 'redis://localhost'
        }
      };

      const result = await bootstrapService(config, () => {});
      expect(result.redis).toBeDefined();
    });

    it('should handle optional Redis gracefully', async () => {
      const { createRedisConnection } = require('../redis');
      createRedisConnection.mockResolvedValueOnce(undefined);

      const config = {
        ...baseConfig,
        redis: {
          enabled: true,
          url: 'redis://localhost',
          optional: true
        }
      };

      const result = await bootstrapService(config, () => {});
      expect(result.redis).toBeUndefined();
    });
  });

  describe('Custom Routes', () => {
    it('should allow adding custom routes', async () => {
      const setupRoutes = (app: express.Application) => {
        app.get('/custom', (req, res) => {
          res.json({ message: 'Custom route' });
        });
      };

      const result = await bootstrapService(baseConfig, setupRoutes);
      const response = await request(result.app).get('/custom');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ message: 'Custom route' });
    });

    it('should provide dependencies to route setup', async () => {
      const setupRoutes = jest.fn();
      const config = {
        ...baseConfig,
        database: {
          enabled: true,
          connectionString: 'postgresql://test'
        },
        redis: {
          enabled: true,
          url: 'redis://localhost'
        }
      };

      await bootstrapService(config, setupRoutes);
      
      expect(setupRoutes).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          logger: expect.any(Object),
          db: expect.any(Object),
          redis: expect.any(Object),
          config: config
        })
      );
    });
  });

  describe('Health Check Routes', () => {
    it('should provide liveness probe', async () => {
      const result = await bootstrapService(baseConfig, () => {});
      const response = await request(result.app).get('/health/live');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ status: 'alive' });
    });

    it('should provide readiness probe', async () => {
      const config = {
        ...baseConfig,
        database: {
          enabled: true,
          connectionString: 'postgresql://test'
        }
      };

      const result = await bootstrapService(config, () => {});
      const response = await request(result.app).get('/health/ready');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ready: true,
        checks: {
          database: 'connected'
        }
      });
    });

    it('should handle custom health checks', async () => {
      const customHealthCheck = jest.fn().mockResolvedValue({ custom: 'ok' });
      const config = {
        ...baseConfig,
        healthCheck: {
          detailed: true,
          custom: customHealthCheck
        }
      };

      const result = await bootstrapService(config, () => {});
      const response = await request(result.app).get('/health');
      
      expect(customHealthCheck).toHaveBeenCalled();
      expect(response.body.checks.custom).toMatchObject({ custom: 'ok' });
    });
  });

  describe('Error Handling', () => {
    it('should handle route errors', async () => {
      const result = await bootstrapService(baseConfig, (app) => {
        app.get('/error', (req, res, next) => {
          next(new Error('Test error'));
        });
      });

      const response = await request(result.app).get('/error');
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({ error: 'Test error' });
    });

    it('should handle async route errors', async () => {
      const result = await bootstrapService(baseConfig, (app) => {
        app.get('/async-error', async (req, res) => {
          throw new Error('Async error');
        });
      });

      const response = await request(result.app).get('/async-error');
      expect(response.status).toBe(500);
    });
  });
});