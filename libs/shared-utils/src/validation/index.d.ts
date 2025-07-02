import Joi from 'joi';
import { z } from 'zod';
export declare const commonJoiSchemas: {
    uuid: Joi.StringSchema<string>;
    email: Joi.StringSchema<string>;
    password: Joi.StringSchema<string>;
    sku: Joi.StringSchema<string>;
    slug: Joi.StringSchema<string>;
    isoDate: Joi.StringSchema<string>;
    dateRange: Joi.ObjectSchema<any>;
    positiveInteger: Joi.NumberSchema<number>;
    nonNegativeInteger: Joi.NumberSchema<number>;
    currency: Joi.NumberSchema<number>;
    percentage: Joi.NumberSchema<number>;
    nonEmptyString: Joi.StringSchema<string>;
    safeText: Joi.StringSchema<string>;
    description: Joi.StringSchema<string>;
    stringArray: Joi.ArraySchema<any[]>;
    uuidArray: Joi.ArraySchema<any[]>;
    pagination: Joi.ObjectSchema<any>;
};
export declare const commonZodSchemas: {
    uuid: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    sku: z.ZodEffects<z.ZodString, string, string>;
    slug: z.ZodString;
    isoDate: z.ZodString;
    dateRange: z.ZodEffects<z.ZodObject<{
        startDate: z.ZodString;
        endDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        endDate: string;
    }, {
        startDate: string;
        endDate: string;
    }>, {
        startDate: string;
        endDate: string;
    }, {
        startDate: string;
        endDate: string;
    }>;
    positiveInteger: z.ZodNumber;
    nonNegativeInteger: z.ZodNumber;
    currency: z.ZodNumber;
    percentage: z.ZodNumber;
    nonEmptyString: z.ZodString;
    safeText: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    stringArray: z.ZodArray<z.ZodString, "many">;
    uuidArray: z.ZodArray<z.ZodString, "many">;
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sortBy: z.ZodOptional<z.ZodString>;
        sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortOrder: "asc" | "desc";
        sortBy?: string | undefined;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
        sortBy?: string | undefined;
        sortOrder?: "asc" | "desc" | undefined;
    }>;
};
/**
 * Sanitize HTML to prevent XSS attacks
 */
export declare function sanitizeHtml(input: string): string;
/**
 * Sanitize SQL input to prevent SQL injection
 */
export declare function sanitizeSql(input: string): string;
/**
 * Sanitize file name to prevent path traversal
 */
export declare function sanitizeFileName(fileName: string): string;
/**
 * Validate and sanitize URL
 */
export declare function sanitizeUrl(url: string): string | null;
/**
 * Validate email format and domain
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate UUID format
 */
export declare function isValidUuid(uuid: string): boolean;
/**
 * Validate phone number (international format)
 */
export declare function isValidPhoneNumber(phone: string): boolean;
/**
 * Validate password strength
 */
export declare function validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
};
/**
 * Validate file type against allowed extensions
 */
export declare function isValidFileType(fileName: string, allowedTypes: string[]): boolean;
/**
 * Validate file size
 */
export declare function isValidFileSize(fileSize: number, maxSizeInMB: number): boolean;
/**
 * Validate IP address (IPv4 and IPv6)
 */
export declare function isValidIpAddress(ip: string): boolean;
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
export declare function validateWithJoi<T>(data: unknown, schema: Joi.Schema): ValidationResult & {
    data?: T;
};
/**
 * Validate object against Zod schema
 */
export declare function validateWithZod<T>(data: unknown, schema: z.ZodSchema<T>): ValidationResult & {
    data?: T;
};
export * from './validation';
//# sourceMappingURL=index.d.ts.map