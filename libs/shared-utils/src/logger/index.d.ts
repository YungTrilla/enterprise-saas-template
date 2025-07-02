import winston from 'winston';
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
/**
 * Create structured logger with Winston
 */
export declare function createLogger(config?: Partial<LoggerConfig>): winston.Logger;
export declare class StructuredLogger {
    private logger;
    private defaultContext;
    constructor(config?: Partial<LoggerConfig>, defaultContext?: LogContext);
    /**
     * Set default context for all log entries
     */
    setDefaultContext(context: LogContext): void;
    /**
     * Create structured log entry
     */
    private createLogEntry;
    /**
     * Log error message
     */
    error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>): void;
    /**
     * Log warning message
     */
    warn(message: string, context?: LogContext, metadata?: Record<string, any>): void;
    /**
     * Log info message
     */
    info(message: string, context?: LogContext, metadata?: Record<string, any>): void;
    /**
     * Log HTTP request/response
     */
    http(message: string, context?: LogContext, metadata?: Record<string, any>): void;
    /**
     * Log debug message
     */
    debug(message: string, context?: LogContext, metadata?: Record<string, any>): void;
    /**
     * Log verbose message
     */
    verbose(message: string, context?: LogContext, metadata?: Record<string, any>): void;
    /**
     * Log with custom level
     */
    log(level: LogLevel, message: string, context?: LogContext, error?: Error, metadata?: Record<string, any>): void;
    /**
     * Get child logger with additional context
     */
    child(context: LogContext): StructuredLogger;
}
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
export declare function logRequest(logger: StructuredLogger, requestData: RequestLogData): void;
/**
 * Log HTTP response
 */
export declare function logResponse(logger: StructuredLogger, responseData: ResponseLogData, context?: LogContext): void;
export interface BusinessEventData {
    eventType: string;
    entityType: string;
    entityId: string;
    action: string;
    userId?: string;
    changes?: Record<string, {
        from: any;
        to: any;
    }>;
    metadata?: Record<string, any>;
}
/**
 * Log business events for audit trails
 */
export declare function logBusinessEvent(logger: StructuredLogger, eventData: BusinessEventData, context?: LogContext): void;
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
export declare function logSecurityEvent(logger: StructuredLogger, eventData: SecurityEventData, context?: LogContext): void;
export interface PerformanceData {
    operation: string;
    duration: number;
    memoryUsage?: NodeJS.MemoryUsage;
    metadata?: Record<string, any>;
}
/**
 * Log performance metrics
 */
export declare function logPerformance(logger: StructuredLogger, performanceData: PerformanceData, context?: LogContext): void;
export declare const defaultLogger: StructuredLogger;
export declare const logError: (message: string, error?: Error, context?: LogContext) => void;
export declare const logWarn: (message: string, context?: LogContext) => void;
export declare const logInfo: (message: string, context?: LogContext) => void;
export declare const logDebug: (message: string, context?: LogContext) => void;
//# sourceMappingURL=index.d.ts.map