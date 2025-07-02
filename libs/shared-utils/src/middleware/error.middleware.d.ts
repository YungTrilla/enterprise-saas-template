/**
 * Error handling middleware for Express applications
 * Provides consistent error responses across all services
 */
import { Request, Response, NextFunction } from 'express';
import { ApiError as BaseApiError } from '../api-response';
import { generateCorrelationId as genCorrId } from '../encryption';
interface ExtendedRequest extends Request {
    correlationId?: string;
}
export declare const ApiError: typeof BaseApiError;
/**
 * 404 Not Found handler middleware
 */
export declare function notFoundHandler(req: ExtendedRequest, res: Response): void;
/**
 * Global error handler middleware
 */
export declare function errorHandler(error: Error | BaseApiError, req: ExtendedRequest, res: Response, next: NextFunction): void;
/**
 * Async error wrapper - catches async errors and passes them to error handler
 */
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
export declare const generateCorrelationId: typeof genCorrId;
/**
 * Correlation ID middleware
 */
export declare function correlationIdMiddleware(req: ExtendedRequest, res: Response, next: NextFunction): void;
/**
 * Request logging middleware
 */
export declare function requestLoggingMiddleware(req: ExtendedRequest, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=error.middleware.d.ts.map