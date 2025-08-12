import Joi from 'joi';
import { z } from 'zod';

// ========================================
// Common validation schemas using Joi
// ========================================

export const commonJoiSchemas = {
  // Basic types
  uuid: Joi.string().uuid({ version: 'uuidv4' }),
  email: Joi.string().email().lowercase().trim(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  // Identifiers
  sku: Joi.string()
    .pattern(/^[A-Z0-9-]{3,20}$/)
    .uppercase()
    .trim(),
  slug: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .lowercase()
    .trim(),

  // Dates
  isoDate: Joi.string().isoDate(),
  dateRange: Joi.object({
    startDate: Joi.string().isoDate().required(),
    endDate: Joi.string().isoDate().required().min(Joi.ref('startDate')),
  }),

  // Numbers
  positiveInteger: Joi.number().integer().min(1),
  nonNegativeInteger: Joi.number().integer().min(0),
  currency: Joi.number().precision(2).min(0),
  percentage: Joi.number().min(0).max(100),

  // Text
  nonEmptyString: Joi.string().trim().min(1),
  safeText: Joi.string()
    .trim()
    .max(1000)
    .pattern(/^[^<>{}]*$/),
  description: Joi.string().trim().max(5000).allow(''),

  // Arrays
  stringArray: Joi.array().items(Joi.string().trim()),
  uuidArray: Joi.array().items(Joi.string().uuid()),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().trim().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  }),
};

// ========================================
// Common validation schemas using Zod
// ========================================

export const commonZodSchemas = {
  // Basic types
  uuid: z.string().uuid(),
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  // Identifiers
  sku: z
    .string()
    .regex(/^[A-Z0-9-]{3,20}$/)
    .transform(s => s.toUpperCase()),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .toLowerCase(),

  // Dates
  isoDate: z.string().datetime(),
  dateRange: z
    .object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    })
    .refine(data => new Date(data.endDate) > new Date(data.startDate), {
      message: 'End date must be after start date',
      path: ['endDate'],
    }),

  // Numbers
  positiveInteger: z.number().int().positive(),
  nonNegativeInteger: z.number().int().nonnegative(),
  currency: z.number().nonnegative().multipleOf(0.01),
  percentage: z.number().min(0).max(100),

  // Text
  nonEmptyString: z.string().trim().min(1),
  safeText: z
    .string()
    .trim()
    .max(1000)
    .regex(/^[^<>{}]*$/, 'Text contains invalid characters'),
  description: z.string().trim().max(5000).optional().default(''),

  // Arrays
  stringArray: z.array(z.string().trim()),
  uuidArray: z.array(z.string().uuid()),

  // Pagination
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sortBy: z.string().trim().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
};

// ========================================
// Input sanitization functions
// ========================================

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize SQL input to prevent SQL injection
 */
export function sanitizeSql(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/['";\\]/g, '') // Remove dangerous SQL characters
    .replace(/(--|\*|\/\*|\*\/)/g, '') // Remove comment markers
    .replace(/\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|EXEC|EXECUTE)\b/gi, '') // Remove dangerous keywords
    .trim();
}

/**
 * Sanitize file name to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return '';

  return fileName
    .replace(/[^\w\s.-]/g, '') // Keep only alphanumeric, spaces, dots, and hyphens
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 255) // Limit length
    .trim();
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null;

  try {
    const urlObj = new URL(url);

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }

    return urlObj.toString();
  } catch {
    return null;
  }
}

// ========================================
// Validation helper functions
// ========================================

/**
 * Validate email format and domain
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.toLowerCase());
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidRegex.test(uuid);
}

/**
 * Validate phone number (international format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return typeof phone === 'string' && phoneRegex.test(phone.replace(/[\s()-]/g, ''));
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (typeof password !== 'string') {
    return { isValid: false, score: 0, feedback: ['Password must be a string'] };
  }

  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Character variety checks
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[@$!%*?&]/.test(password)) {
    feedback.push('Password must contain at least one special character (@$!%*?&)');
  } else {
    score += 1;
  }

  // Common password patterns
  if (/^(.)\1+$/.test(password)) {
    feedback.push('Password cannot be all the same character');
    score = 0;
  }

  if (/^(123|abc|qwe)/i.test(password)) {
    feedback.push('Password cannot start with common sequences');
    score = Math.max(0, score - 2);
  }

  const isValid = feedback.length === 0 && score >= 4;

  return { isValid, score, feedback };
}

/**
 * Validate file type against allowed extensions
 */
export function isValidFileType(fileName: string, allowedTypes: string[]): boolean {
  if (typeof fileName !== 'string') return false;

  const extension = fileName.toLowerCase().split('.').pop();
  return extension ? allowedTypes.map(type => type.toLowerCase()).includes(extension) : false;
}

/**
 * Validate file size
 */
export function isValidFileSize(fileSize: number, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return typeof fileSize === 'number' && fileSize > 0 && fileSize <= maxSizeInBytes;
}

/**
 * Validate IP address (IPv4 and IPv6)
 */
export function isValidIpAddress(ip: string): boolean {
  if (typeof ip !== 'string') return false;

  // IPv4 regex
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// ========================================
// Custom validation decorators for classes
// ========================================

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

/**
 * Validate object against Joi schema
 */
export function validateWithJoi<T>(
  data: unknown,
  schema: Joi.Schema
): ValidationResult & { data?: T } {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      })),
    };
  }

  return {
    isValid: true,
    errors: [],
    data: value as T,
  };
}

/**
 * Validate object against Zod schema
 */
export function validateWithZod<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): ValidationResult & { data?: T } {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
        value: error,
      })),
    };
  }

  return {
    isValid: true,
    errors: [],
    data: result.data,
  };
}

// Export Express middleware validators
export * from './validation';
