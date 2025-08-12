'use strict';
/**
 * API Response Utilities
 * Standardized API response formats
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ApiError = exports.ApiResponse = void 0;
class ApiResponse {
  static success(data, message) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
  static error(code, message, details) {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }
  static paginated(data, page, limit, total) {
    return {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
exports.ApiResponse = ApiResponse;
class ApiError extends Error {
  statusCode;
  code;
  details;
  constructor(message, statusCode = 500, code, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
  toJSON() {
    return ApiResponse.error(this.code, this.message, this.details);
  }
}
exports.ApiError = ApiError;
