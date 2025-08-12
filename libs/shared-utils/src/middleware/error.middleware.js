'use strict';
/**
 * Error handling middleware for Express applications
 * Provides consistent error responses across all services
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.generateCorrelationId = exports.ApiError = void 0;
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
exports.correlationIdMiddleware = correlationIdMiddleware;
exports.requestLoggingMiddleware = requestLoggingMiddleware;
const logger_1 = require('../logger');
const api_response_1 = require('../api-response');
const encryption_1 = require('../encryption');
const logger = (0, logger_1.createLogger)({ service: 'error-middleware' });
// Re-export ApiError from api-response to avoid duplication
exports.ApiError = api_response_1.ApiError;
/**
 * 404 Not Found handler middleware
 */
function notFoundHandler(req, res) {
  const response = {
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
function errorHandler(error, req, res, next) {
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
  let details;
  // Handle different error types
  if (error instanceof api_response_1.ApiError) {
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
  const response = {
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
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
// Re-export generateCorrelationId from encryption to avoid duplication
exports.generateCorrelationId = encryption_1.generateCorrelationId;
/**
 * Correlation ID middleware
 */
function correlationIdMiddleware(req, res, next) {
  req.correlationId = req.headers['x-correlation-id'] || (0, encryption_1.generateCorrelationId)();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
}
/**
 * Request logging middleware
 */
function requestLoggingMiddleware(req, res, next) {
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
