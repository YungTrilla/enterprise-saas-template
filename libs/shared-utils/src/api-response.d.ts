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
export declare class ApiResponse {
    static success<T>(data: T, message?: string): IApiResponse<T>;
    static error(code: string, message: string, details?: any): IApiResponse;
    static paginated<T>(data: T[], page: number, limit: number, total: number): IApiResponse<T[]>;
}
export declare class ApiError extends Error {
    statusCode: number;
    code: string;
    details?: any;
    constructor(message: string, statusCode?: number, code?: string, details?: any);
    toJSON(): IApiResponse;
}
//# sourceMappingURL=api-response.d.ts.map