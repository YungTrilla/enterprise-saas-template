/**
 * Request Validation Middleware
 * Validates and sanitizes incoming requests
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createLogger } from '../utils/logger';

const logger = createLogger('request-validation');

export interface IValidationSchema {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
  headers?: Joi.Schema;
}

export interface IValidationOptions {
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

/**
 * Create validation middleware for requests
 */
export function validateRequest(
  schema: IValidationSchema,
  options: IValidationOptions = {}
) {
  const defaultOptions: Joi.ValidationOptions = {
    allowUnknown: options.allowUnknown ?? false,
    stripUnknown: options.stripUnknown ?? true,
    abortEarly: options.abortEarly ?? false,
    errors: {
      wrap: {
        label: ''
      }
    }
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: any[] = [];

    // Validate body
    if (schema.body && req.body) {
      const { error, value } = schema.body.validate(req.body, defaultOptions);
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type,
          location: 'body'
        })));
      } else {
        req.body = value;
      }
    }

    // Validate query
    if (schema.query && req.query) {
      const { error, value } = schema.query.validate(req.query, defaultOptions);
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type,
          location: 'query'
        })));
      } else {
        req.query = value;
      }
    }

    // Validate params
    if (schema.params && req.params) {
      const { error, value } = schema.params.validate(req.params, defaultOptions);
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type,
          location: 'params'
        })));
      } else {
        req.params = value;
      }
    }

    // Validate headers
    if (schema.headers && req.headers) {
      const { error, value } = schema.headers.validate(req.headers, {
        ...defaultOptions,
        allowUnknown: true // Always allow unknown headers
      });
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type,
          location: 'headers'
        })));
      }
    }

    if (errors.length > 0) {
      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        errors,
        correlationId: req.correlationId
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid({ version: 'uuidv4' }),

  // Email validation
  email: Joi.string().email().lowercase().trim(),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().pattern(/^[a-zA-Z_]+:(asc|desc)$/),
    filter: Joi.object().unknown(true)
  }),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
  }),

  // Search
  search: Joi.object({
    q: Joi.string().min(1).max(100).trim(),
    fields: Joi.array().items(Joi.string())
  })
};

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove script tags and dangerous HTML
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }

  return input;
}

/**
 * Middleware to sanitize all input
 */
export function sanitizeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }

  // Sanitize query params
  if (req.query) {
    req.query = sanitizeInput(req.query) as any;
  }

  next();
}