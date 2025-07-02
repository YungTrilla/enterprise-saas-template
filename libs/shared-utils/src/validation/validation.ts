import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * Validation middleware for request body
 */
export function validate(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        },
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString()
      });
    }
    
    req.body = value;
    next();
  };
}

/**
 * Validation middleware for query parameters
 */
export function validateQuery(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query parameter validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        },
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString()
      });
    }
    
    req.query = value;
    next();
  };
}

/**
 * Validation middleware for URL parameters
 */
export function validateParams(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'URL parameter validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        },
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString()
      });
    }
    
    req.params = value;
    next();
  };
}