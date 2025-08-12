/**
 * Auth Service Logger
 * Structured logging with correlation IDs and security event tracking
 */

import winston from 'winston';
import { getConfig, isProduction } from '@template/shared-config';
import { CorrelationId } from '@template/shared-types';

// Log format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, correlationId, service, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      service: service || 'auth-service',
      correlationId,
      message,
      ...meta,
    });
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, correlationId, service, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    const correlationString = correlationId ? `[${correlationId}]` : '';
    return `${timestamp} ${level} [${service || 'auth-service'}] ${correlationString} ${message} ${metaString}`;
  })
);

/**
 * Create logger instance with auth service context
 */
export function createLogger(context?: string): winston.Logger {
  // Use environment variable directly if config not loaded yet
  let logLevel = 'info';
  let isProd = false;

  try {
    logLevel = getConfig('LOG_LEVEL') || 'info';
    isProd = isProduction();
  } catch (e) {
    // Config not loaded yet, use environment variables directly
    logLevel = process.env.LOG_LEVEL || 'info';
    isProd = process.env.NODE_ENV === 'production';
  }

  const logger = winston.createLogger({
    level: logLevel,
    format: isProd ? logFormat : consoleFormat,
    defaultMeta: {
      service: 'auth-service',
      context,
    },
    transports: [
      // Console transport for all environments
      new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
    ],
  });

  // Add file transport in production
  if (isProduction()) {
    logger.add(
      new winston.transports.File({
        filename: 'logs/auth-service-error.log',
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        tailable: true,
      })
    );

    logger.add(
      new winston.transports.File({
        filename: 'logs/auth-service-combined.log',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        tailable: true,
      })
    );
  }

  return logger;
}

/**
 * Logger with correlation ID support
 */
export class CorrelatedLogger {
  private logger: winston.Logger;
  private correlationId?: CorrelationId;

  constructor(context?: string, correlationId?: CorrelationId) {
    this.logger = createLogger(context);
    this.correlationId = correlationId;
  }

  setCorrelationId(correlationId: CorrelationId) {
    this.correlationId = correlationId;
  }

  private addCorrelationId(meta: any = {}) {
    return {
      ...meta,
      correlationId: this.correlationId,
    };
  }

  error(message: string, meta?: any) {
    this.logger.error(message, this.addCorrelationId(meta));
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, this.addCorrelationId(meta));
  }

  info(message: string, meta?: any) {
    this.logger.info(message, this.addCorrelationId(meta));
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, this.addCorrelationId(meta));
  }

  verbose(message: string, meta?: any) {
    this.logger.verbose(message, this.addCorrelationId(meta));
  }
}

/**
 * Security-specific logger for audit trails
 */
export class SecurityLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = createLogger('security');
  }

  logAuthAttempt(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    correlationId: CorrelationId,
    error?: string
  ) {
    this.logger.info('Authentication attempt', {
      email,
      success,
      ipAddress,
      userAgent,
      correlationId,
      error,
      type: 'AUTH_ATTEMPT',
    });
  }

  logSecurityEvent(
    type: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    description: string,
    metadata: Record<string, unknown>,
    correlationId: CorrelationId
  ) {
    this.logger.warn('Security event detected', {
      type,
      severity,
      description,
      metadata,
      correlationId,
      eventType: 'SECURITY_EVENT',
    });
  }

  logPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    allowed: boolean,
    correlationId: CorrelationId
  ) {
    this.logger.info('Permission check', {
      userId,
      resource,
      action,
      allowed,
      correlationId,
      type: 'PERMISSION_CHECK',
    });
  }

  logSessionActivity(
    userId: string,
    sessionId: string,
    action: 'CREATE' | 'REFRESH' | 'REVOKE',
    ipAddress: string,
    correlationId: CorrelationId
  ) {
    this.logger.info('Session activity', {
      userId,
      sessionId,
      action,
      ipAddress,
      correlationId,
      type: 'SESSION_ACTIVITY',
    });
  }
}

// Export singleton instances
export const logger = createLogger();
export const securityLogger = new SecurityLogger();
