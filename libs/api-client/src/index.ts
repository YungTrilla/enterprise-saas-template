// Internal imports for factory functions
import { BaseServiceClient } from './services/base-service';
import { AuthServiceClient } from './services/auth-service';
import { ExampleServiceClient } from './services/example-service';
import type { ServiceConfig } from './types';

// Core HTTP Client
export { HttpClient } from './client/http-client';

// Base Service Client
export { BaseServiceClient } from './services/base-service';

// Service Clients
export { AuthServiceClient } from './services/auth-service';
export { ExampleServiceClient } from './services/example-service';

// Types and Interfaces
export type {
  ApiResponse,
  ApiError,
  ApiRequestConfig,
  AuthTokens,
  ServiceConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  RetryConfig,
  CircuitBreakerConfig,
  HealthCheckResponse,
  PaginationMeta,
  HttpMethod,
} from './types';

// Auth Service Types
export type {
  LoginCredentials,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterUserRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  CreateRoleRequest,
  UpdateUserRoleRequest,
} from './services/auth-service';

// Example Service Types
export type {
  CreateExampleRequest,
  UpdateExampleRequest,
  ExampleSearchFilters,
  ExampleEntity,
  ExampleSummary,
} from './services/example-service';

// Circuit Breaker State
export type { CircuitBreakerState } from './types';

// Factory functions for creating service clients
export const createAuthServiceClient = (baseURL: string, config?: Partial<ServiceConfig>) => {
  return new AuthServiceClient({
    baseURL,
    timeout: 30000,
    retries: 3,
    ...config,
  });
};

export const createExampleServiceClient = (baseURL: string, config?: Partial<ServiceConfig>) => {
  return new ExampleServiceClient({
    baseURL,
    timeout: 30000,
    retries: 3,
    ...config,
  });
};

// Default configurations for development
export const DEFAULT_SERVICE_CONFIGS = {
  auth: {
    baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    timeout: 30000,
    retries: 3,
  },
  example: {
    baseURL: process.env.EXAMPLE_SERVICE_URL || 'http://localhost:3002',
    timeout: 30000,
    retries: 3,
  },
  notification: {
    baseURL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
    timeout: 30000,
    retries: 3,
  },
  users: {
    baseURL: process.env.USERS_SERVICE_URL || 'http://localhost:3004',
    timeout: 30000,
    retries: 3,
  },
} as const;

// Service client registry for managing multiple service instances
export class ServiceClientRegistry {
  private clients: Map<string, BaseServiceClient> = new Map();

  /**
   * Register a service client
   */
  register<T extends BaseServiceClient>(name: string, client: T): T {
    this.clients.set(name, client);
    return client;
  }

  /**
   * Get a registered service client
   */
  get<T extends BaseServiceClient>(name: string): T | undefined {
    return this.clients.get(name) as T;
  }

  /**
   * Check if a service client is registered
   */
  has(name: string): boolean {
    return this.clients.has(name);
  }

  /**
   * Unregister a service client
   */
  unregister(name: string): boolean {
    return this.clients.delete(name);
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Clear all registered services
   */
  clear(): void {
    this.clients.clear();
  }

  /**
   * Set authentication tokens for all registered services
   */
  setAuthTokensForAll(accessToken: string, refreshToken: string, expiresAt: number): void {
    this.clients.forEach((client) => {
      client.setAuthTokens(accessToken, refreshToken, expiresAt);
    });
  }

  /**
   * Clear authentication tokens from all registered services
   */
  clearAuthTokensForAll(): void {
    this.clients.forEach((client) => {
      client.clearAuthTokens();
    });
  }

  /**
   * Health check all registered services
   */
  async healthCheckAll(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    await Promise.allSettled(
      Array.from(this.clients.entries()).map(async ([name, client]) => {
        try {
          results[name] = await client.getHealth();
        } catch (error) {
          results[name] = {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          };
        }
      })
    );

    return results;
  }
}

// Create a default registry instance
export const defaultServiceRegistry = new ServiceClientRegistry();