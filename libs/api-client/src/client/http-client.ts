import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import qs from 'qs';
import {
  ApiRequestConfig,
  ApiResponse,
  ApiError,
  AuthTokens,
  ServiceConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  RetryConfig,
  CircuitBreakerConfig,
  CircuitBreakerState,
  HealthCheckResponse,
} from '../types';

/**
 * HTTP Client for Abyss Central service communication
 * Features: Authentication, Retry Logic, Circuit Breaker, Correlation IDs, Error Handling
 */
export class HttpClient {
  private axiosInstance: AxiosInstance;
  private tokens: AuthTokens | null = null;
  private retryConfig: RetryConfig;
  private circuitBreakerConfig: CircuitBreakerConfig;
  private circuitBreakerState: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ServiceConfig) {
    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Abyss-Central-Client/1.0.0',
      },
      paramsSerializer: params => qs.stringify(params, { arrayFormat: 'brackets' }),
    });

    // Default retry configuration
    this.retryConfig = {
      retries: config.retries || 3,
      retryDelay: 1000,
      retryCondition: error => {
        return !error.response || (error.response.status >= 500 && error.response.status <= 599);
      },
    };

    // Default circuit breaker configuration
    this.circuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
    };

    this.setupInterceptors();
  }

  /**
   * Set authentication tokens
   */
  setTokens(tokens: AuthTokens): void {
    this.tokens = tokens;
  }

  /**
   * Clear authentication tokens
   */
  clearTokens(): void {
    this.tokens = null;
  }

  /**
   * Get current authentication tokens
   */
  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  /**
   * Check if tokens are expired
   */
  isTokenExpired(): boolean {
    if (!this.tokens) return true;
    return Date.now() >= this.tokens.expiresAt;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `abyss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup axios interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const apiConfig = config as ApiRequestConfig & InternalAxiosRequestConfig;

        // Generate correlation ID if not provided
        if (!apiConfig.correlationId) {
          apiConfig.correlationId = this.generateCorrelationId();
        }

        // Add correlation ID to headers
        config.headers['X-Correlation-ID'] = apiConfig.correlationId;

        // Add authentication if available and not skipped
        if (!apiConfig.skipAuth && this.tokens && !this.isTokenExpired()) {
          config.headers['Authorization'] = `Bearer ${this.tokens.accessToken}`;
        }

        // Apply custom request interceptors
        let processedConfig = config as ApiRequestConfig & InternalAxiosRequestConfig;
        for (const interceptor of this.requestInterceptors) {
          const result = await interceptor(processedConfig as ApiRequestConfig);
          Object.assign(processedConfig, result);
        }

        return processedConfig as InternalAxiosRequestConfig;
      },
      error => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      async (response: AxiosResponse) => {
        // Reset circuit breaker on successful response
        this.resetCircuitBreaker();

        // Apply custom response interceptors
        let processedResponse = response;
        for (const interceptor of this.responseInterceptors) {
          processedResponse = await interceptor(processedResponse);
        }

        return processedResponse;
      },
      async error => {
        // Handle circuit breaker
        this.recordFailure();

        // Apply custom error interceptors
        for (const interceptor of this.errorInterceptors) {
          error = await interceptor(error);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Circuit breaker - record failure
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.circuitBreakerConfig.failureThreshold) {
      this.circuitBreakerState = CircuitBreakerState.OPEN;
    }
  }

  /**
   * Circuit breaker - reset on success
   */
  private resetCircuitBreaker(): void {
    this.failureCount = 0;
    this.circuitBreakerState = CircuitBreakerState.CLOSED;
  }

  /**
   * Circuit breaker - check if request should be allowed
   */
  private shouldAllowRequest(): boolean {
    if (this.circuitBreakerState === CircuitBreakerState.CLOSED) {
      return true;
    }

    if (this.circuitBreakerState === CircuitBreakerState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.circuitBreakerConfig.resetTimeout) {
        this.circuitBreakerState = CircuitBreakerState.HALF_OPEN;
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow one request to test
    return true;
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retries: number = this.retryConfig.retries
  ): Promise<AxiosResponse<T>> {
    try {
      return await requestFn();
    } catch (error: any) {
      if (retries > 0 && this.retryConfig.retryCondition?.(error)) {
        const delay = this.retryConfig.retryDelay * Math.pow(2, this.retryConfig.retries - retries);
        await this.sleep(delay);
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Sleep utility for retry delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with full error handling and retry logic
   */
  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    // Check circuit breaker
    if (!this.shouldAllowRequest()) {
      throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
    }

    try {
      const response = await this.retryRequest(() => this.axiosInstance.request(config));

      // Return structured API response
      return {
        success: true,
        data: response.data,
        correlationId: config.correlationId || this.generateCorrelationId(),
        timestamp: new Date().toISOString(),
        ...response.data,
      };
    } catch (error: any) {
      throw this.handleError(error, config);
    }
  }

  /**
   * Handle and format errors
   */
  private handleError(error: any, config: ApiRequestConfig): ApiError {
    const correlationId = config.correlationId || this.generateCorrelationId();

    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: {
          code: error.response.status.toString(),
          message: error.response.data?.message || error.message,
          details: error.response.data,
          correlationId,
          timestamp: new Date().toISOString(),
        },
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error - no response received',
          details: { timeout: config.timeout },
          correlationId,
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: {
          code: 'REQUEST_ERROR',
          message: error.message,
          correlationId,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await this.get<HealthCheckResponse>('/health', { skipAuth: true });
      return response.data;
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: 0,
        version: 'unknown',
      };
    }
  }
}
