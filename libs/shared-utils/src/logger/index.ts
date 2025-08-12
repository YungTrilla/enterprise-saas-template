import winston from 'winston';
import { getCurrentTimestamp } from '../datetime';

// ========================================
// Logger Configuration and Types
// ========================================

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  service?: string;
  environment?: string;
  version?: string;
  requestId?: string;
  sessionId?: string;
  action?: string;
  resource?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: any;
}

export interface StructuredLogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  level: LogLevel;
  service: string;
  environment: string;
  version: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableJsonFormat: boolean;
  logDirectory?: string;
  maxFileSize?: string;
  maxFiles?: number;
  enableSyslog?: boolean;
  syslogHost?: string;
  syslogPort?: number;
}

// ========================================
// Default Logger Configuration
// ========================================

const defaultConfig: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  service: process.env.SERVICE_NAME || 'abyss-service',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.SERVICE_VERSION || '1.0.0',
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  enableJsonFormat: process.env.NODE_ENV === 'production',
  logDirectory: process.env.LOG_DIRECTORY || './logs',
  maxFileSize: '10m',
  maxFiles: 5,
  enableSyslog: false,
};

// ========================================
// Winston Logger Setup
// ========================================

/**
 * Create structured logger with Winston
 */
export function createLogger(config: Partial<LoggerConfig> = {}): winston.Logger {
  const finalConfig = { ...defaultConfig, ...config };

  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    finalConfig.enableJsonFormat
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, service, correlationId, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              const corrId = correlationId ? `[${correlationId}]` : '';
              return `${timestamp} [${service}] ${corrId} ${level}: ${message} ${metaStr}`;
            }
          )
        )
  );

  // Configure transports
  const transports: winston.transport[] = [];

  // Console transport
  if (finalConfig.enableConsole) {
    transports.push(
      new winston.transports.Console({
        level: finalConfig.level,
        format: logFormat,
      })
    );
  }

  // File transports
  if (finalConfig.enableFile && finalConfig.logDirectory) {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: `${finalConfig.logDirectory}/error.log`,
        level: 'error',
        maxsize: parseSize(finalConfig.maxFileSize),
        maxFiles: finalConfig.maxFiles,
        format: winston.format.json(),
      })
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: `${finalConfig.logDirectory}/combined.log`,
        maxsize: parseSize(finalConfig.maxFileSize),
        maxFiles: finalConfig.maxFiles,
        format: winston.format.json(),
      })
    );
  }

  // Create and configure logger
  const logger = winston.createLogger({
    level: finalConfig.level,
    defaultMeta: {
      service: finalConfig.service,
      environment: finalConfig.environment,
      version: finalConfig.version,
    },
    transports,
    // Don't exit on error
    exitOnError: false,
  });

  return logger;
}

/**
 * Parse file size string to bytes
 */
function parseSize(sizeStr?: string): number {
  if (!sizeStr) return 10 * 1024 * 1024; // 10MB default

  const match = sizeStr.match(/^(\d+)([kmg]?)$/i);
  if (!match) return 10 * 1024 * 1024;

  const num = parseInt(match[1], 10);
  const unit = match[2]?.toLowerCase() || '';

  switch (unit) {
    case 'k':
      return num * 1024;
    case 'm':
      return num * 1024 * 1024;
    case 'g':
      return num * 1024 * 1024 * 1024;
    default:
      return num;
  }
}

// ========================================
// Structured Logger Class
// ========================================

export class StructuredLogger {
  private logger: winston.Logger;
  private defaultContext: LogContext;

  constructor(config: Partial<LoggerConfig> = {}, defaultContext: LogContext = {}) {
    this.logger = createLogger(config);
    this.defaultContext = defaultContext;
  }

  /**
   * Set default context for all log entries
   */
  setDefaultContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    metadata?: Record<string, any>
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      level,
      message,
      timestamp: getCurrentTimestamp(),
      context: { ...this.defaultContext, ...context },
      metadata,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  /**
   * Log error message
   */
  error(
    message: string,
    error?: Error,
    context?: LogContext,
    metadata?: Record<string, any>
  ): void {
    const entry = this.createLogEntry('error', message, context, error, metadata);
    this.logger.error(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('warn', message, context, undefined, metadata);
    this.logger.warn(entry);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('info', message, context, undefined, metadata);
    this.logger.info(entry);
  }

  /**
   * Log HTTP request/response
   */
  http(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('http', message, context, undefined, metadata);
    this.logger.http(entry);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('debug', message, context, undefined, metadata);
    this.logger.debug(entry);
  }

  /**
   * Log verbose message
   */
  verbose(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('verbose', message, context, undefined, metadata);
    this.logger.verbose(entry);
  }

  /**
   * Log with custom level
   */
  log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const entry = this.createLogEntry(level, message, context, error, metadata);
    this.logger.log(level, entry);
  }

  /**
   * Get child logger with additional context
   */
  child(context: LogContext): StructuredLogger {
    return new StructuredLogger({}, { ...this.defaultContext, ...context });
  }
}

// ========================================
// Request/Response Logging Utilities
// ========================================

export interface RequestLogData {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  correlationId?: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, any>;
  params?: Record<string, any>;
}

export interface ResponseLogData {
  statusCode: number;
  duration: number;
  responseSize?: number;
  error?: Error;
}

/**
 * Log HTTP request
 */
export function logRequest(logger: StructuredLogger, requestData: RequestLogData): void {
  const { method, url, userAgent, ip, userId, correlationId, ...metadata } = requestData;

  logger.http(
    `${method} ${url}`,
    {
      correlationId,
      userId,
      action: 'http_request',
      resource: url,
    },
    {
      method,
      userAgent,
      ip,
      ...metadata,
    }
  );
}

/**
 * Log HTTP response
 */
export function logResponse(
  logger: StructuredLogger,
  responseData: ResponseLogData,
  context?: LogContext
): void {
  const { statusCode, duration, responseSize, error } = responseData;

  const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  const message = `Response ${statusCode} (${duration}ms)`;

  logger.log(
    level,
    message,
    {
      ...context,
      action: 'http_response',
      statusCode,
      duration,
    },
    error,
    {
      responseSize,
    }
  );
}

// ========================================
// Business Event Logging
// ========================================

export interface BusinessEventData {
  eventType: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
}

/**
 * Log business events for audit trails
 */
export function logBusinessEvent(
  logger: StructuredLogger,
  eventData: BusinessEventData,
  context?: LogContext
): void {
  const { eventType, entityType, entityId, action, userId, changes, metadata } = eventData;

  logger.info(
    `${eventType}: ${action} ${entityType}`,
    {
      ...context,
      userId,
      action: 'business_event',
      resource: `${entityType}:${entityId}`,
    },
    {
      eventType,
      entityType,
      entityId,
      changes,
      ...metadata,
    }
  );
}

// ========================================
// Security Event Logging
// ========================================

export interface SecurityEventData {
  eventType: 'authentication' | 'authorization' | 'data_access' | 'security_violation';
  action: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  success: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Log security events
 */
export function logSecurityEvent(
  logger: StructuredLogger,
  eventData: SecurityEventData,
  context?: LogContext
): void {
  const { eventType, action, userId, ip, userAgent, resource, success, reason, metadata } =
    eventData;

  const level: LogLevel = success ? 'info' : 'warn';
  const message = `Security ${eventType}: ${action} ${success ? 'succeeded' : 'failed'}`;

  logger.log(
    level,
    message,
    {
      ...context,
      userId,
      action: 'security_event',
      resource,
    },
    undefined,
    {
      eventType,
      ip,
      userAgent,
      success,
      reason,
      ...metadata,
    }
  );
}

// ========================================
// Performance Logging
// ========================================

export interface PerformanceData {
  operation: string;
  duration: number;
  memoryUsage?: NodeJS.MemoryUsage;
  metadata?: Record<string, any>;
}

/**
 * Log performance metrics
 */
export function logPerformance(
  logger: StructuredLogger,
  performanceData: PerformanceData,
  context?: LogContext
): void {
  const { operation, duration, memoryUsage, metadata } = performanceData;

  const level: LogLevel = duration > 5000 ? 'warn' : 'info';
  const message = `Performance: ${operation} completed in ${duration}ms`;

  logger.log(
    level,
    message,
    {
      ...context,
      action: 'performance_metric',
      duration,
    },
    undefined,
    {
      operation,
      memoryUsage,
      ...metadata,
    }
  );
}

// ========================================
// Default Logger Instance
// ========================================

// Create default logger instance
export const defaultLogger = new StructuredLogger();

// Export convenient logging functions
export const logError = (message: string, error?: Error, context?: LogContext) =>
  defaultLogger.error(message, error, context);

export const logWarn = (message: string, context?: LogContext) =>
  defaultLogger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) =>
  defaultLogger.info(message, context);

export const logDebug = (message: string, context?: LogContext) =>
  defaultLogger.debug(message, context);

// Logger utilities are already exported above
