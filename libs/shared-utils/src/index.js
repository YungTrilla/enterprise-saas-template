"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWithBackoff = exports.requestLoggingMiddleware = exports.correlationIdMiddleware = exports.asyncHandler = exports.errorHandler = exports.notFoundHandler = void 0;
exports.get = get;
exports.set = set;
exports.deepClone = deepClone;
exports.isEmpty = isEmpty;
exports.omit = omit;
exports.pick = pick;
exports.deepMerge = deepMerge;
exports.debounce = debounce;
exports.throttle = throttle;
exports.retry = retry;
exports.sleep = sleep;
exports.timeout = timeout;
exports.groupBy = groupBy;
exports.unique = unique;
exports.chunk = chunk;
exports.flatten = flatten;
exports.percentageChange = percentageChange;
exports.clamp = clamp;
exports.range = range;
exports.bytesToHuman = bytesToHuman;
exports.arrayToMap = arrayToMap;
exports.safeJsonParse = safeJsonParse;
exports.safeJsonStringify = safeJsonStringify;
exports.isBrowser = isBrowser;
exports.isNode = isNode;
exports.createEnum = createEnum;
// Validation utilities
__exportStar(require("./validation"), exports);
// Encryption utilities
__exportStar(require("./encryption"), exports);
// Formatting utilities
__exportStar(require("./formatting"), exports);
// DateTime utilities
__exportStar(require("./datetime"), exports);
// Logger utilities
__exportStar(require("./logger"), exports);
// API Response utilities
__exportStar(require("./api-response"), exports);
// Middleware utilities - export specific items to avoid conflicts
var error_middleware_1 = require("./middleware/error.middleware");
Object.defineProperty(exports, "notFoundHandler", { enumerable: true, get: function () { return error_middleware_1.notFoundHandler; } });
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return error_middleware_1.errorHandler; } });
Object.defineProperty(exports, "asyncHandler", { enumerable: true, get: function () { return error_middleware_1.asyncHandler; } });
Object.defineProperty(exports, "correlationIdMiddleware", { enumerable: true, get: function () { return error_middleware_1.correlationIdMiddleware; } });
Object.defineProperty(exports, "requestLoggingMiddleware", { enumerable: true, get: function () { return error_middleware_1.requestLoggingMiddleware; } });
// ========================================
// Common utility functions
// ========================================
/**
 * Safely access nested object properties
 */
function get(obj, path, defaultValue) {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current == null || typeof current !== 'object') {
            return defaultValue;
        }
        current = current[key];
    }
    return current !== undefined ? current : defaultValue;
}
/**
 * Set nested object properties safely
 */
function set(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
}
/**
 * Deep clone an object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (obj instanceof Array)
        return obj.map(item => deepClone(item));
    const cloned = {};
    Object.keys(obj).forEach(key => {
        cloned[key] = deepClone(obj[key]);
    });
    return cloned;
}
/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
function isEmpty(value) {
    if (value == null)
        return true;
    if (typeof value === 'string')
        return value.trim().length === 0;
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
}
/**
 * Omit properties from object
 */
function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
}
/**
 * Pick properties from object
 */
function pick(obj, keys) {
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}
/**
 * Merge objects deeply
 */
function deepMerge(target, ...sources) {
    if (!sources.length)
        return target;
    const source = sources.shift();
    if (!source)
        return deepMerge(target, ...sources);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            const sourceValue = source[key];
            if (isObject(sourceValue)) {
                if (!target[key])
                    Object.assign(target, { [key]: {} });
                deepMerge(target[key], sourceValue);
            }
            else {
                Object.assign(target, { [key]: sourceValue });
            }
        });
    }
    return deepMerge(target, ...sources);
}
/**
 * Check if value is an object
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}
/**
 * Debounce function calls
 */
function debounce(func, wait, immediate) {
    let timeout = null;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate)
                func(...args);
        };
        const callNow = immediate && !timeout;
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
            func(...args);
    };
}
/**
 * Throttle function calls
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
/**
 * Retry function with exponential backoff
 */
async function retry(fn, maxAttempts = 3, baseDelay = 1000, maxDelay = 30000) {
    let attempt = 1;
    while (attempt <= maxAttempts) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
            await sleep(delay);
            attempt++;
        }
    }
    throw new Error('Retry failed'); // This should never be reached
}
/**
 * Retry with backoff (alias for retry)
 */
exports.retryWithBackoff = retry;
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Create a promise that resolves after a timeout
 */
function timeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
    ]);
}
/**
 * Group array items by key
 */
function groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}
/**
 * Remove duplicates from array
 */
function unique(array, keyFn) {
    if (!keyFn) {
        return [...new Set(array)];
    }
    const seen = new Set();
    return array.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}
/**
 * Chunk array into smaller arrays
 */
function chunk(array, size) {
    if (size <= 0)
        throw new Error('Chunk size must be positive');
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
/**
 * Flatten nested arrays
 */
function flatten(arrays) {
    return arrays.reduce((flat, array) => flat.concat(array), []);
}
/**
 * Calculate percentage change
 */
function percentageChange(oldValue, newValue) {
    if (oldValue === 0)
        return newValue === 0 ? 0 : 100;
    return ((newValue - oldValue) / oldValue) * 100;
}
/**
 * Clamp number between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/**
 * Generate range of numbers
 */
function range(start, end, step = 1) {
    const result = [];
    for (let i = start; i < end; i += step) {
        result.push(i);
    }
    return result;
}
/**
 * Convert bytes to human readable string
 */
function bytesToHuman(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0)
        return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
/**
 * Create a map from array
 */
function arrayToMap(array, keyFn) {
    const map = new Map();
    array.forEach(item => {
        map.set(keyFn(item), item);
    });
    return map;
}
/**
 * Safe JSON parse with fallback
 */
function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
/**
 * Safe JSON stringify
 */
function safeJsonStringify(obj, space) {
    try {
        return JSON.stringify(obj, null, space);
    }
    catch {
        return '{}';
    }
}
/**
 * Check if running in browser environment
 */
function isBrowser() {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}
/**
 * Check if running in Node.js environment
 */
function isNode() {
    return typeof process !== 'undefined' && process.versions?.node != null;
}
/**
 * Create enum from array of strings
 */
function createEnum(values) {
    return values.reduce((enum_, value) => {
        enum_[value] = value;
        return enum_;
    }, {});
}
