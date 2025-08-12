'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.commonZodSchemas = exports.commonJoiSchemas = void 0;
exports.sanitizeHtml = sanitizeHtml;
exports.sanitizeSql = sanitizeSql;
exports.sanitizeFileName = sanitizeFileName;
exports.sanitizeUrl = sanitizeUrl;
exports.isValidEmail = isValidEmail;
exports.isValidUuid = isValidUuid;
exports.isValidPhoneNumber = isValidPhoneNumber;
exports.validatePasswordStrength = validatePasswordStrength;
exports.isValidFileType = isValidFileType;
exports.isValidFileSize = isValidFileSize;
exports.isValidIpAddress = isValidIpAddress;
exports.validateWithJoi = validateWithJoi;
exports.validateWithZod = validateWithZod;
const joi_1 = __importDefault(require('joi'));
const zod_1 = require('zod');
// ========================================
// Common validation schemas using Joi
// ========================================
exports.commonJoiSchemas = {
  // Basic types
  uuid: joi_1.default.string().uuid({ version: 'uuidv4' }),
  email: joi_1.default.string().email().lowercase().trim(),
  password: joi_1.default
    .string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  // Identifiers
  sku: joi_1.default
    .string()
    .pattern(/^[A-Z0-9-]{3,20}$/)
    .uppercase()
    .trim(),
  slug: joi_1.default
    .string()
    .pattern(/^[a-z0-9-]+$/)
    .lowercase()
    .trim(),
  // Dates
  isoDate: joi_1.default.string().isoDate(),
  dateRange: joi_1.default.object({
    startDate: joi_1.default.string().isoDate().required(),
    endDate: joi_1.default.string().isoDate().required().min(joi_1.default.ref('startDate')),
  }),
  // Numbers
  positiveInteger: joi_1.default.number().integer().min(1),
  nonNegativeInteger: joi_1.default.number().integer().min(0),
  currency: joi_1.default.number().precision(2).min(0),
  percentage: joi_1.default.number().min(0).max(100),
  // Text
  nonEmptyString: joi_1.default.string().trim().min(1),
  safeText: joi_1.default
    .string()
    .trim()
    .max(1000)
    .pattern(/^[^<>{}]*$/),
  description: joi_1.default.string().trim().max(5000).allow(''),
  // Arrays
  stringArray: joi_1.default.array().items(joi_1.default.string().trim()),
  uuidArray: joi_1.default.array().items(joi_1.default.string().uuid()),
  // Pagination
  pagination: joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(20),
    sortBy: joi_1.default.string().trim().optional(),
    sortOrder: joi_1.default.string().valid('asc', 'desc').default('asc'),
  }),
};
// ========================================
// Common validation schemas using Zod
// ========================================
exports.commonZodSchemas = {
  // Basic types
  uuid: zod_1.z.string().uuid(),
  email: zod_1.z.string().email().toLowerCase().trim(),
  password: zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  // Identifiers
  sku: zod_1.z
    .string()
    .regex(/^[A-Z0-9-]{3,20}$/)
    .transform(s => s.toUpperCase()),
  slug: zod_1.z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .toLowerCase(),
  // Dates
  isoDate: zod_1.z.string().datetime(),
  dateRange: zod_1.z
    .object({
      startDate: zod_1.z.string().datetime(),
      endDate: zod_1.z.string().datetime(),
    })
    .refine(data => new Date(data.endDate) > new Date(data.startDate), {
      message: 'End date must be after start date',
      path: ['endDate'],
    }),
  // Numbers
  positiveInteger: zod_1.z.number().int().positive(),
  nonNegativeInteger: zod_1.z.number().int().nonnegative(),
  currency: zod_1.z.number().nonnegative().multipleOf(0.01),
  percentage: zod_1.z.number().min(0).max(100),
  // Text
  nonEmptyString: zod_1.z.string().trim().min(1),
  safeText: zod_1.z
    .string()
    .trim()
    .max(1000)
    .regex(/^[^<>{}]*$/, 'Text contains invalid characters'),
  description: zod_1.z.string().trim().max(5000).optional().default(''),
  // Arrays
  stringArray: zod_1.z.array(zod_1.z.string().trim()),
  uuidArray: zod_1.z.array(zod_1.z.string().uuid()),
  // Pagination
  pagination: zod_1.z.object({
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(100).default(20),
    sortBy: zod_1.z.string().trim().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
  }),
};
// ========================================
// Input sanitization functions
// ========================================
/**
 * Sanitize HTML to prevent XSS attacks
 */
function sanitizeHtml(input) {
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
function sanitizeSql(input) {
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
function sanitizeFileName(fileName) {
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
function sanitizeUrl(url) {
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
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.toLowerCase());
}
/**
 * Validate UUID format
 */
function isValidUuid(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidRegex.test(uuid);
}
/**
 * Validate phone number (international format)
 */
function isValidPhoneNumber(phone) {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return typeof phone === 'string' && phoneRegex.test(phone.replace(/[\s()-]/g, ''));
}
/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
  const feedback = [];
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
function isValidFileType(fileName, allowedTypes) {
  if (typeof fileName !== 'string') return false;
  const extension = fileName.toLowerCase().split('.').pop();
  return extension ? allowedTypes.map(type => type.toLowerCase()).includes(extension) : false;
}
/**
 * Validate file size
 */
function isValidFileSize(fileSize, maxSizeInMB) {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return typeof fileSize === 'number' && fileSize > 0 && fileSize <= maxSizeInBytes;
}
/**
 * Validate IP address (IPv4 and IPv6)
 */
function isValidIpAddress(ip) {
  if (typeof ip !== 'string') return false;
  // IPv4 regex
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
/**
 * Validate object against Joi schema
 */
function validateWithJoi(data, schema) {
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
    data: value,
  };
}
/**
 * Validate object against Zod schema
 */
function validateWithZod(data, schema) {
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
__exportStar(require('./validation'), exports);
