/**
 * API Gateway Entry Point
 * Central routing and orchestration for microservices
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'fs';
import path from 'path';

import { 
  initializeGatewayConfig, 
  initializeServiceRegistry, 
  getServiceInfo,
  getGatewayConfig
} from './config';
import { HealthCheckService } from './services/health-check.service';
import { correlationIdMiddleware } from './middleware/correlation.middleware';
import { sanitizeMiddleware } from './middleware/request-validation.middleware';
import { createHealthRoutes } from './routes/health.routes';
import { createGatewayRoutes } from './routes/gateway.routes';
import { createLogger } from './utils/logger';

async function startGateway() {
  try {
    // Create logger inside async function
    const logger = createLogger('server');
    logger.info('Starting API Gateway...');

    // Initialize configuration
    const config = await initializeGatewayConfig();
    const serviceRegistry = await initializeServiceRegistry();
    const serviceInfo = getServiceInfo();

    logger.info('Configuration loaded', {
      serviceName: serviceInfo.name,
      version: serviceInfo.version,
      environment: serviceInfo.environment,
      port: serviceInfo.port,
      registeredServices: Object.keys(serviceRegistry)
    });

    // Initialize health check service
    const healthCheckService = new HealthCheckService(serviceRegistry);
    healthCheckService.startPeriodicChecks();

    // Create Express app
    const app = express();

    // Trust proxy (for accurate IP addresses behind load balancers)
    app.set('trust proxy', true);

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    app.use(cors({
      origin: config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Correlation-ID',
        'X-Request-ID'
      ],
      exposedHeaders: [
        'X-Correlation-ID',
        'X-Request-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
      ]
    }));

    // General middleware
    app.use(compression());
    app.use(express.json({ limit: config.bodySizeLimit }));
    app.use(express.urlencoded({ extended: true, limit: config.bodySizeLimit }));

    // Add correlation ID to all requests
    app.use(correlationIdMiddleware);

    // Sanitize user input
    app.use(sanitizeMiddleware);

    // Request logging
    app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.http('HTTP Request', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          correlationId: req.correlationId
        });
      });

      next();
    });

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.'
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise use IP
        return req.auth?.userId || req.ip;
      }
    });

    // Apply rate limiting to API routes
    app.use('/api', limiter);

    // Health check routes (no rate limiting)
    app.use('/health', createHealthRoutes(healthCheckService));

    // API Documentation (if enabled)
    if (config.enableSwaggerUI) {
      try {
        const openApiPath = path.join(__dirname, 'docs', 'openapi.yaml');
        if (fs.existsSync(openApiPath)) {
          const openApiDoc = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));
          app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));
          logger.info('Swagger UI enabled at /api/v1/docs');
        }
      } catch (error) {
        logger.warn('Failed to load OpenAPI documentation', {
          error: (error as Error).message
        });
      }
    }

    // Main API routes
    app.use('/api/v1', createGatewayRoutes());

    // Root endpoint
    app.get('/', (req, res) => {
      res.json({
        success: true,
        service: serviceInfo,
        message: 'Enterprise SaaS API Gateway',
        endpoints: {
          health: '/health',
          api: '/api/v1',
          docs: config.enableSwaggerUI ? '/api/v1/docs' : undefined
        },
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found'
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        correlationId: req.correlationId
      });

      // Don't leak error details in production
      const message = config.environment === 'production' 
        ? 'An unexpected error occurred'
        : error.message;

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    });

    // Start server
    const server = app.listen(serviceInfo.port, () => {
      logger.info('API Gateway started successfully', {
        port: serviceInfo.port,
        environment: serviceInfo.environment,
        version: serviceInfo.version,
        corsOrigins: config.corsOrigins,
        services: Object.keys(serviceRegistry)
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        try {
          // Stop health checks
          healthCheckService.stopPeriodicChecks();
          logger.info('Stopped health check service');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', {
            error: (error as Error).message
          });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', {
        reason,
        promise
      });
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start API Gateway', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    process.exit(1);
  }
}

// Start the gateway
startGateway();