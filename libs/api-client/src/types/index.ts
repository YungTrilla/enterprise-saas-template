import { AxiosRequestConfig, AxiosResponse } from 'axios';

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  correlationId: string;
  timestamp: string;
  pagination?: PaginationMeta;
}

// Error response structure
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    correlationId: string;
    timestamp: string;
  };
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Request configuration with auth and correlation
export interface ApiRequestConfig extends AxiosRequestConfig {
  correlationId?: string;
  skipAuth?: boolean;
  retries?: number;
  timeout?: number;
}

// Authentication tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Service configuration
export interface ServiceConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  correlationIdHeader?: string;
  authHeader?: string;
}

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request interceptor function
export type RequestInterceptor = (
  config: ApiRequestConfig
) => ApiRequestConfig | Promise<ApiRequestConfig>;

// Response interceptor function
export type ResponseInterceptor = (
  response: AxiosResponse
) => AxiosResponse | Promise<AxiosResponse>;

// Error interceptor function
export type ErrorInterceptor = (error: any) => Promise<any>;

// Retry configuration
export interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: any) => boolean;
}

// Circuit breaker state
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  dependencies?: Record<string, 'healthy' | 'unhealthy'>;
}