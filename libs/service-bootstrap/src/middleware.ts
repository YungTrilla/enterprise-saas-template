import express, { Application, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ServiceBootstrapConfig } from './types';
import { errorHandler, notFoundHandler, generateCorrelationId } from '@template/shared-utils';

/**
 * Correlation ID middleware - adds correlation ID to all requests
 */
export const correlationIdMiddleware: RequestHandler = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] as string || generateCorrelationId();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
};

/**
 * Request logging middleware
 */
export const createRequestLogger = (logger: any): RequestHandler => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        correlationId: req.correlationId,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
    });
    
    next();
  };
};

/**
 * Apply standard middleware to Express app
 */
export function applyStandardMiddleware(
  app: Application,
  config: ServiceBootstrapConfig,
  logger: any
): void {
  // Security
  if (config.security?.trustProxy) {
    app.set('trust proxy', true);
  }
  
  if (config.security?.helmet !== false) {
    app.use(helmet());
  }

  // CORS
  if (config.cors?.enabled !== false) {
    app.use(cors({
      origin: config.cors?.origins || true,
      credentials: config.cors?.credentials !== false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id']
    }));
  }

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ 
    limit: config.bodyParser?.jsonLimit || '10mb' 
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: config.bodyParser?.urlEncodedLimit || '10mb' 
  }));

  // Correlation ID
  app.use(correlationIdMiddleware);

  // Request logging
  app.use(createRequestLogger(logger));

  // Rate limiting
  if (config.rateLimit?.enabled !== false) {
    const limiter = rateLimit({
      windowMs: config.rateLimit?.windowMs || 15 * 60 * 1000, // 15 minutes
      max: config.rateLimit?.maxRequests || 100,
      message: config.rateLimit?.message || 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(limiter);
  }
}

/**
 * Apply error handling middleware (should be last)
 */
export function applyErrorHandlers(app: Application): void {
  app.use(notFoundHandler);
  app.use(errorHandler);
}