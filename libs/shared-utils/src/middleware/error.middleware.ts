/**
 * Error handling middleware for Express applications
 * Provides consistent error responses across all services
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../logger';
import { ApiError as BaseApiError } from '../api-response';
import { generateCorrelationId as genCorrId } from '../encryption';

const logger = createLogger({ service: 'error-middleware' });

// Extend Express Request type to include correlationId
interface ExtendedRequest extends Request {
  correlationId?: string;
}

/**
 * Error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  correlationId?: string;
  timestamp: string;
}

// Re-export ApiError from api-response to avoid duplication
export const ApiError = BaseApiError;

/**
 * 404 Not Found handler middleware
 */
export function notFoundHandler(req: ExtendedRequest, res: Response): void {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} not found`,
    },
    correlationId: req.correlationId,
    timestamp: new Date().toISOString(),
  };

  logger.warn('404 Not Found', {
    method: req.method,
    path: req.path,
    url: req.url,
    correlationId: req.correlationId,
  });

  res.status(404).json(response);
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error | BaseApiError,
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    correlationId: req.correlationId,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Determine status code
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any;

  // Handle different error types
  if (error instanceof BaseApiError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request data';
    details = error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    code = 'FORBIDDEN';
    message = 'Access denied';
  } else if (error.name === 'CastError' || error.name === 'TypeError') {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'Invalid request format';
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isDevelopment && statusCode === 500) {
    message = 'An unexpected error occurred';
    details = undefined;
  } else if (isDevelopment && statusCode === 500) {
    details = {
      stack: error.stack,
      originalError: error.message,
    };
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    correlationId: req.correlationId,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

/**
 * Async error wrapper - catches async errors and passes them to error handler
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Re-export generateCorrelationId from encryption to avoid duplication
export const generateCorrelationId = genCorrId;

/**
 * Correlation ID middleware
 */
export function correlationIdMiddleware(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): void {
  req.correlationId = (req.headers['x-correlation-id'] as string) || genCorrId();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
}

/**
 * Request logging middleware
 */
export function requestLoggingMiddleware(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      correlationId: req.correlationId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });

  next();
}
