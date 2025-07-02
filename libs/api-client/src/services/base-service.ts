import { HttpClient } from '../client/http-client';
import { ApiRequestConfig, ApiResponse, ServiceConfig } from '../types';

/**
 * Base service client class that all service clients extend
 * Provides common functionality and standardized service communication
 */
export abstract class BaseServiceClient {
  protected httpClient: HttpClient;
  protected serviceName: string;
  protected baseURL: string;

  constructor(serviceName: string, config: ServiceConfig) {
    this.serviceName = serviceName;
    this.baseURL = config.baseURL;
    this.httpClient = new HttpClient(config);
    
    // Add service-specific request interceptor
    this.httpClient.addRequestInterceptor((config) => {
      // Add service identifier to headers
      config.headers = {
        ...config.headers,
        'X-Service-Client': this.serviceName,
        'X-Client-Version': '1.0.0',
      };
      return config;
    });

    // Add structured logging interceptor
    this.httpClient.addResponseInterceptor((response) => {
      this.logRequest('SUCCESS', response.config, response);
      return response;
    });

    this.httpClient.addErrorInterceptor((error) => {
      this.logRequest('ERROR', error.config, null, error);
      return Promise.reject(error);
    });
  }

  /**
   * Get service health status
   */
  async getHealth(): Promise<any> {
    return this.httpClient.healthCheck();
  }

  /**
   * Set authentication tokens
   */
  setAuthTokens(accessToken: string, refreshToken: string, expiresAt: number): void {
    this.httpClient.setTokens({ accessToken, refreshToken, expiresAt });
  }

  /**
   * Clear authentication tokens
   */
  clearAuthTokens(): void {
    this.httpClient.clearTokens();
  }

  /**
   * Log requests for monitoring and debugging
   */
  private logRequest(
    status: 'SUCCESS' | 'ERROR',
    config: any,
    response?: any,
    error?: any
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      status,
      method: config?.method?.toUpperCase(),
      url: config?.url,
      correlationId: config?.correlationId,
      statusCode: response?.status || error?.response?.status,
      duration: response?.config?.metadata?.endTime - response?.config?.metadata?.startTime,
    };

    // In production, this would go to a structured logging service
    if (status === 'ERROR') {
      console.error(`[${this.serviceName}] API Error:`, logEntry);
    } else {
      console.info(`[${this.serviceName}] API Request:`, logEntry);
    }
  }

  /**
   * Standard GET request with service-specific error handling
   */
  protected async get<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.httpClient.get<T>(endpoint, config);
  }

  /**
   * Standard POST request with service-specific error handling
   */
  protected async post<T>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.httpClient.post<T>(endpoint, data, config);
  }

  /**
   * Standard PUT request with service-specific error handling
   */
  protected async put<T>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.httpClient.put<T>(endpoint, data, config);
  }

  /**
   * Standard PATCH request with service-specific error handling
   */
  protected async patch<T>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.httpClient.patch<T>(endpoint, data, config);
  }

  /**
   * Standard DELETE request with service-specific error handling
   */
  protected async delete<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.httpClient.delete<T>(endpoint, config);
  }

  /**
   * Paginated GET request
   */
  protected async getPaginated<T>(
    endpoint: string,
    page: number = 1,
    limit: number = 20,
    params?: Record<string, any>
  ): Promise<ApiResponse<T[]>> {
    return this.get<T[]>(endpoint, {
      params: {
        page,
        limit,
        ...params,
      },
    });
  }

  /**
   * Bulk operations helper
   */
  protected async bulkOperation<T>(
    endpoint: string,
    items: T[],
    operation: 'create' | 'update' | 'delete'
  ): Promise<ApiResponse<T[]>> {
    return this.post<T[]>(`${endpoint}/bulk`, {
      operation,
      items,
    });
  }

  /**
   * Upload file helper
   */
  protected async uploadFile(
    endpoint: string,
    file: File | Buffer,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Search with filters helper
   */
  protected async search<T>(
    endpoint: string,
    query: string,
    filters?: Record<string, any>,
    page?: number,
    limit?: number
  ): Promise<ApiResponse<T[]>> {
    return this.get<T[]>(`${endpoint}/search`, {
      params: {
        q: query,
        page,
        limit,
        ...filters,
      },
    });
  }
}