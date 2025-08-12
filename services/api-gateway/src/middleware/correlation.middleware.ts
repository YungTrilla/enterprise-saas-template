/**
 * Correlation ID Middleware
 * Ensures all requests have a correlation ID for distributed tracing
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CorrelationId } from '@template/shared-types';

// Extend Express Request to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId: CorrelationId;
    }
  }
}

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get correlation ID from header or generate new one
  const correlationId = (req.headers['x-correlation-id'] as string) || 
                       (req.headers['x-request-id'] as string) ||
                       uuidv4();
  
  // Ensure it's typed correctly
  req.correlationId = correlationId as CorrelationId;
  
  // Add to response header for client tracking
  res.setHeader('x-correlation-id', correlationId);
  res.setHeader('x-request-id', correlationId);
  
  next();
}