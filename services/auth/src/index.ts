/**
 * Auth Service Entry Point
 * Express server with comprehensive authentication and authorization
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createDatabaseConnection } from '@template/shared-config';
import {
  initializeAuthConfig,
  getServiceInfo,
  getAuthDatabaseConfig,
  getAuthRedisConfig,
} from './config';
import { AuthService } from './services/auth.service';
import { JwtService } from './services/jwt.service';
import { PasswordService } from './services/password.service';
import { MfaService } from './services/mfa.service';
import { RbacService } from './services/rbac.service';
import { SessionService } from './services/session.service';
import { AuditService } from './services/audit.service';
import { AuthMiddleware, initializeAuthMiddleware } from './middleware/auth.middleware';
import { createLogger } from './utils/logger';
import { authRoutes } from './routes/auth.routes';
import { healthRoutes } from './routes/health.routes';

async function startServer() {
  try {
    // Initialize configuration FIRST
    const config = await initializeAuthConfig();

    // Now create logger after config is loaded
    const logger = createLogger('server');
    logger.info('Starting Auth Service...');
    const serviceInfo = getServiceInfo();

    logger.info('Configuration loaded', {
      serviceName: serviceInfo.name,
      version: serviceInfo.version,
      environment: serviceInfo.environment,
      port: serviceInfo.port,
    });

    // Initialize database connection
    const dbManager = createDatabaseConnection({
      maxRetries: 5,
      retryDelay: 2000,
      exponentialBackoff: true,
      enableMonitoring: true,
    });

    await dbManager.connect();
    logger.info('Database connected successfully');

    // Initialize Redis connection (optional for session caching)
    let redisClient: any = null;
    try {
      const redisConfig = getAuthRedisConfig();
      // Redis client initialization would go here
      logger.info('Redis connection configured', {
        host: redisConfig.host,
        port: redisConfig.port,
      });
    } catch (error) {
      logger.warn('Redis not available, continuing without session caching', {
        error: (error as Error).message,
      });
    }

    // Initialize services
    const jwtService = new JwtService(config);
    const passwordService = new PasswordService(config);
    const mfaService = new MfaService();
    const rbacService = new RbacService();
    const sessionService = new SessionService(redisClient);
    const auditService = new AuditService();

    const authService = new AuthService(
      config,
      jwtService,
      passwordService,
      mfaService,
      rbacService,
      sessionService,
      auditService
    );

    // Initialize middleware
    const authMiddleware = new AuthMiddleware(authService, jwtService, rbacService);
    initializeAuthMiddleware(authService, jwtService, rbacService);

    // Create Express app
    const app = express();

    // Security middleware
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      })
    );

    // CORS configuration
    app.use(
      cors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'Authorization',
          'X-Correlation-ID',
        ],
      })
    );

    // General middleware
    app.use(compression());
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: config.rateLimit.skipSuccessfulRequests,
    });

    app.use('/api', limiter);

    // Add correlation ID to all requests
    app.use(authMiddleware.correlationId());

    // Request logging middleware
    app.use((req, res, next) => {
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        correlationId: req.correlationId,
      });
      next();
    });

    // Health check routes (no auth required)
    app.use('/health', healthRoutes);

    // API routes
    app.use(serviceInfo.apiPrefix, authRoutes(authService, authMiddleware));

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    });

    // Global error handler
    app.use(
      (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        logger.error('Unhandled error', {
          error: error.message,
          stack: error.stack,
          url: req.url,
          method: req.method,
          correlationId: req.correlationId,
        });

        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      }
    );

    // Start server
    const server = app.listen(serviceInfo.port, () => {
      logger.info('Auth Service started successfully', {
        port: serviceInfo.port,
        environment: serviceInfo.environment,
        version: serviceInfo.version,
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      server.close(async () => {
        try {
          // Close database connection
          await dbManager.disconnect();
          logger.info('Database connection closed');

          // Close Redis connection if available
          if (redisClient) {
            await redisClient.quit();
            logger.info('Redis connection closed');
          }

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', {
            error: (error as Error).message,
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
    process.on('uncaughtException', error => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', {
        reason,
        promise,
      });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start Auth Service', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
}

// Start the server
startServer();
