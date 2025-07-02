export * from './validation';
export * from './encryption';
export * from './formatting';
export * from './datetime';
export * from './logger';
export * from './api-response';
export { notFoundHandler, errorHandler, asyncHandler, correlationIdMiddleware, requestLoggingMiddleware } from './middleware/error.middleware';
/**
 * Safely access nested object properties
 */
export declare function get(obj: any, path: string, defaultValue?: any): any;
/**
 * Set nested object properties safely
 */
export declare function set(obj: any, path: string, value: any): void;
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export declare function isEmpty(value: any): boolean;
/**
 * Omit properties from object
 */
export declare function omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
/**
 * Pick properties from object
 */
export declare function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Merge objects deeply
 */
export declare function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T;
/**
 * Debounce function calls
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number, immediate?: boolean): (...args: Parameters<T>) => void;
/**
 * Throttle function calls
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Retry function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, maxAttempts?: number, baseDelay?: number, maxDelay?: number): Promise<T>;
/**
 * Retry with backoff (alias for retry)
 */
export declare const retryWithBackoff: typeof retry;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Create a promise that resolves after a timeout
 */
export declare function timeout<T>(promise: Promise<T>, ms: number): Promise<T>;
/**
 * Group array items by key
 */
export declare function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]>;
/**
 * Remove duplicates from array
 */
export declare function unique<T>(array: T[], keyFn?: (item: T) => any): T[];
/**
 * Chunk array into smaller arrays
 */
export declare function chunk<T>(array: T[], size: number): T[][];
/**
 * Flatten nested arrays
 */
export declare function flatten<T>(arrays: T[][]): T[];
/**
 * Calculate percentage change
 */
export declare function percentageChange(oldValue: number, newValue: number): number;
/**
 * Clamp number between min and max
 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * Generate range of numbers
 */
export declare function range(start: number, end: number, step?: number): number[];
/**
 * Convert bytes to human readable string
 */
export declare function bytesToHuman(bytes: number): string;
/**
 * Create a map from array
 */
export declare function arrayToMap<T, K extends string | number>(array: T[], keyFn: (item: T) => K): Map<K, T>;
/**
 * Safe JSON parse with fallback
 */
export declare function safeJsonParse<T>(json: string, fallback: T): T;
/**
 * Safe JSON stringify
 */
export declare function safeJsonStringify(obj: any, space?: number): string;
/**
 * Check if running in browser environment
 */
export declare function isBrowser(): boolean;
/**
 * Check if running in Node.js environment
 */
export declare function isNode(): boolean;
/**
 * Create enum from array of strings
 */
export declare function createEnum<T extends string>(values: T[]): Record<T, T>;
//# sourceMappingURL=index.d.ts.map