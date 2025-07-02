/**
 * API Response Utilities
 * Standardized API response formats
 */

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  correlationId?: string;
  timestamp: string;
}

export class ApiResponse {
  static success<T>(data: T, message?: string): IApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(code: string, message: string, details?: any): IApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      timestamp: new Date().toISOString()
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): IApiResponse<T[]> {
    return {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    };
  }
}

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): IApiResponse {
    return ApiResponse.error(this.code, this.message, this.details);
  }
}