'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.logDebug =
  exports.logInfo =
  exports.logWarn =
  exports.logError =
  exports.defaultLogger =
  exports.StructuredLogger =
    void 0;
exports.createLogger = createLogger;
exports.logRequest = logRequest;
exports.logResponse = logResponse;
exports.logBusinessEvent = logBusinessEvent;
exports.logSecurityEvent = logSecurityEvent;
exports.logPerformance = logPerformance;
const winston_1 = __importDefault(require('winston'));
const datetime_1 = require('../datetime');
// ========================================
// Default Logger Configuration
// ========================================
const defaultConfig = {
  level: process.env.LOG_LEVEL || 'info',
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
function createLogger(config = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  // Define log format
  const logFormat = winston_1.default.format.combine(
    winston_1.default.format.timestamp(),
    winston_1.default.format.errors({ stack: true }),
    finalConfig.enableJsonFormat
      ? winston_1.default.format.json()
      : winston_1.default.format.combine(
          winston_1.default.format.colorize(),
          winston_1.default.format.printf(
            ({ timestamp, level, message, service, correlationId, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              const corrId = correlationId ? `[${correlationId}]` : '';
              return `${timestamp} [${service}] ${corrId} ${level}: ${message} ${metaStr}`;
            }
          )
        )
  );
  // Configure transports
  const transports = [];
  // Console transport
  if (finalConfig.enableConsole) {
    transports.push(
      new winston_1.default.transports.Console({
        level: finalConfig.level,
        format: logFormat,
      })
    );
  }
  // File transports
  if (finalConfig.enableFile && finalConfig.logDirectory) {
    // Error log file
    transports.push(
      new winston_1.default.transports.File({
        filename: `${finalConfig.logDirectory}/error.log`,
        level: 'error',
        maxsize: parseSize(finalConfig.maxFileSize),
        maxFiles: finalConfig.maxFiles,
        format: winston_1.default.format.json(),
      })
    );
    // Combined log file
    transports.push(
      new winston_1.default.transports.File({
        filename: `${finalConfig.logDirectory}/combined.log`,
        maxsize: parseSize(finalConfig.maxFileSize),
        maxFiles: finalConfig.maxFiles,
        format: winston_1.default.format.json(),
      })
    );
  }
  // Create and configure logger
  const logger = winston_1.default.createLogger({
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
function parseSize(sizeStr) {
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
class StructuredLogger {
  logger;
  defaultContext;
  constructor(config = {}, defaultContext = {}) {
    this.logger = createLogger(config);
    this.defaultContext = defaultContext;
  }
  /**
   * Set default context for all log entries
   */
  setDefaultContext(context) {
    this.defaultContext = { ...this.defaultContext, ...context };
  }
  /**
   * Create structured log entry
   */
  createLogEntry(level, message, context, error, metadata) {
    const entry = {
      level,
      message,
      timestamp: (0, datetime_1.getCurrentTimestamp)(),
      context: { ...this.defaultContext, ...context },
      metadata,
    };
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
      };
    }
    return entry;
  }
  /**
   * Log error message
   */
  error(message, error, context, metadata) {
    const entry = this.createLogEntry('error', message, context, error, metadata);
    this.logger.error(entry);
  }
  /**
   * Log warning message
   */
  warn(message, context, metadata) {
    const entry = this.createLogEntry('warn', message, context, undefined, metadata);
    this.logger.warn(entry);
  }
  /**
   * Log info message
   */
  info(message, context, metadata) {
    const entry = this.createLogEntry('info', message, context, undefined, metadata);
    this.logger.info(entry);
  }
  /**
   * Log HTTP request/response
   */
  http(message, context, metadata) {
    const entry = this.createLogEntry('http', message, context, undefined, metadata);
    this.logger.http(entry);
  }
  /**
   * Log debug message
   */
  debug(message, context, metadata) {
    const entry = this.createLogEntry('debug', message, context, undefined, metadata);
    this.logger.debug(entry);
  }
  /**
   * Log verbose message
   */
  verbose(message, context, metadata) {
    const entry = this.createLogEntry('verbose', message, context, undefined, metadata);
    this.logger.verbose(entry);
  }
  /**
   * Log with custom level
   */
  log(level, message, context, error, metadata) {
    const entry = this.createLogEntry(level, message, context, error, metadata);
    this.logger.log(level, entry);
  }
  /**
   * Get child logger with additional context
   */
  child(context) {
    return new StructuredLogger({}, { ...this.defaultContext, ...context });
  }
}
exports.StructuredLogger = StructuredLogger;
/**
 * Log HTTP request
 */
function logRequest(logger, requestData) {
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
function logResponse(logger, responseData, context) {
  const { statusCode, duration, responseSize, error } = responseData;
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
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
/**
 * Log business events for audit trails
 */
function logBusinessEvent(logger, eventData, context) {
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
/**
 * Log security events
 */
function logSecurityEvent(logger, eventData, context) {
  const { eventType, action, userId, ip, userAgent, resource, success, reason, metadata } =
    eventData;
  const level = success ? 'info' : 'warn';
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
/**
 * Log performance metrics
 */
function logPerformance(logger, performanceData, context) {
  const { operation, duration, memoryUsage, metadata } = performanceData;
  const level = duration > 5000 ? 'warn' : 'info';
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
exports.defaultLogger = new StructuredLogger();
// Export convenient logging functions
const logError = (message, error, context) => exports.defaultLogger.error(message, error, context);
exports.logError = logError;
const logWarn = (message, context) => exports.defaultLogger.warn(message, context);
exports.logWarn = logWarn;
const logInfo = (message, context) => exports.defaultLogger.info(message, context);
exports.logInfo = logInfo;
const logDebug = (message, context) => exports.defaultLogger.debug(message, context);
exports.logDebug = logDebug;
// Logger utilities are already exported above
