/**
 * Logger Utility for API Gateway
 * Structured logging with Winston
 */

import winston from 'winston';
import { CorrelationId } from '@template/shared-types';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Create default logger
const defaultLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: combine(errors({ stack: true }), timestamp(), json()),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' ? combine(colorize(), simple()) : json(),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  defaultLogger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );

  defaultLogger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

export interface ILogger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  http(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

/**
 * Create a logger instance with a specific context
 */
export function createLogger(context: string): ILogger {
  const childLogger = defaultLogger.child({ context });

  return {
    error: (message: string, meta?: any) => childLogger.error(message, sanitizeMeta(meta)),

    warn: (message: string, meta?: any) => childLogger.warn(message, sanitizeMeta(meta)),

    info: (message: string, meta?: any) => childLogger.info(message, sanitizeMeta(meta)),

    http: (message: string, meta?: any) => childLogger.http(message, sanitizeMeta(meta)),

    debug: (message: string, meta?: any) => childLogger.debug(message, sanitizeMeta(meta)),
  };
}

/**
 * Sanitize metadata to remove sensitive information
 */
function sanitizeMeta(meta: any): any {
  if (!meta) return {};

  const sanitized = { ...meta };

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'authorization',
    'cookie',
    'secret',
    'apiKey',
    'privateKey',
    'creditCard',
    'ssn',
  ];

  const removeSensitive = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(removeSensitive);
    }

    const cleaned: any = {};

    for (const key in obj) {
      const lowerKey = key.toLowerCase();

      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        cleaned[key] = removeSensitive(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }

    return cleaned;
  };

  return removeSensitive(sanitized);
}

/**
 * Create HTTP request logger middleware
 */
export function createHttpLogger() {
  const logger = createLogger('http');

  return winston.createLogger({
    level: 'http',
    format: combine(timestamp(), json()),
    transports: [
      new winston.transports.Console({
        format: process.env.NODE_ENV === 'development' ? combine(colorize(), simple()) : json(),
      }),
    ],
  });
}

export { defaultLogger };
