/**
 * API Gateway Configuration
 * Central configuration for gateway service
 */

import { IServiceInfo } from '@template/shared-types';
import { validateEnvVar, parseBoolean, parseNumber } from '@template/shared-utils';
import { getRedisConfig } from '@template/shared-config';

export interface IGatewayConfig {
  port: number;
  environment: string;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  requestTimeoutMs: number;
  bodySizeLimit: string;
  enableSwaggerUI: boolean;
  enableHealthEndpoint: boolean;
  enableMetrics: boolean;
  jwtPublicKey?: string;
  redisEnabled: boolean;
}

export interface IServiceRegistry {
  [serviceName: string]: {
    url: string;
    healthEndpoint: string;
    timeout: number;
    retries: number;
    circuitBreakerThreshold: number;
    circuitBreakerTimeout: number;
  };
}

let gatewayConfig: IGatewayConfig | null = null;
let serviceRegistry: IServiceRegistry | null = null;

export async function initializeGatewayConfig(): Promise<IGatewayConfig> {
  if (gatewayConfig) {
    return gatewayConfig;
  }

  gatewayConfig = {
    port: parseNumber(validateEnvVar('GATEWAY_PORT', '3000')),
    environment: validateEnvVar('NODE_ENV', 'development'),
    corsOrigins: validateEnvVar('CORS_ORIGINS', 'http://localhost:3001').split(','),
    rateLimitWindowMs: parseNumber(validateEnvVar('RATE_LIMIT_WINDOW_MS', '900000')), // 15 minutes
    rateLimitMaxRequests: parseNumber(validateEnvVar('RATE_LIMIT_MAX_REQUESTS', '100')),
    requestTimeoutMs: parseNumber(validateEnvVar('REQUEST_TIMEOUT_MS', '30000')), // 30 seconds
    bodySizeLimit: validateEnvVar('BODY_SIZE_LIMIT', '10mb'),
    enableSwaggerUI: parseBoolean(validateEnvVar('ENABLE_SWAGGER_UI', 'true')),
    enableHealthEndpoint: parseBoolean(validateEnvVar('ENABLE_HEALTH_ENDPOINT', 'true')),
    enableMetrics: parseBoolean(validateEnvVar('ENABLE_METRICS', 'true')),
    jwtPublicKey: process.env.JWT_PUBLIC_KEY,
    redisEnabled: parseBoolean(validateEnvVar('REDIS_ENABLED', 'false')),
  };

  return gatewayConfig;
}

export function getGatewayConfig(): IGatewayConfig {
  if (!gatewayConfig) {
    throw new Error('Gateway configuration not initialized. Call initializeGatewayConfig() first.');
  }
  return gatewayConfig;
}

export async function initializeServiceRegistry(): Promise<IServiceRegistry> {
  if (serviceRegistry) {
    return serviceRegistry;
  }

  // Service registry configuration
  // In production, this could come from a service discovery system
  serviceRegistry = {
    auth: {
      url: validateEnvVar('AUTH_SERVICE_URL', 'http://localhost:3010'),
      healthEndpoint: '/health',
      timeout: parseNumber(validateEnvVar('AUTH_SERVICE_TIMEOUT', '10000')),
      retries: parseNumber(validateEnvVar('AUTH_SERVICE_RETRIES', '3')),
      circuitBreakerThreshold: parseNumber(validateEnvVar('AUTH_CIRCUIT_BREAKER_THRESHOLD', '5')),
      circuitBreakerTimeout: parseNumber(validateEnvVar('AUTH_CIRCUIT_BREAKER_TIMEOUT', '60000')),
    },
    inventory: {
      url: validateEnvVar('INVENTORY_SERVICE_URL', 'http://localhost:3020'),
      healthEndpoint: '/health',
      timeout: parseNumber(validateEnvVar('INVENTORY_SERVICE_TIMEOUT', '10000')),
      retries: parseNumber(validateEnvVar('INVENTORY_SERVICE_RETRIES', '3')),
      circuitBreakerThreshold: parseNumber(
        validateEnvVar('INVENTORY_CIRCUIT_BREAKER_THRESHOLD', '5')
      ),
      circuitBreakerTimeout: parseNumber(
        validateEnvVar('INVENTORY_CIRCUIT_BREAKER_TIMEOUT', '60000')
      ),
    },
    orders: {
      url: validateEnvVar('ORDERS_SERVICE_URL', 'http://localhost:3030'),
      healthEndpoint: '/health',
      timeout: parseNumber(validateEnvVar('ORDERS_SERVICE_TIMEOUT', '10000')),
      retries: parseNumber(validateEnvVar('ORDERS_SERVICE_RETRIES', '3')),
      circuitBreakerThreshold: parseNumber(validateEnvVar('ORDERS_CIRCUIT_BREAKER_THRESHOLD', '5')),
      circuitBreakerTimeout: parseNumber(validateEnvVar('ORDERS_CIRCUIT_BREAKER_TIMEOUT', '60000')),
    },
    analytics: {
      url: validateEnvVar('ANALYTICS_SERVICE_URL', 'http://localhost:3040'),
      healthEndpoint: '/health',
      timeout: parseNumber(validateEnvVar('ANALYTICS_SERVICE_TIMEOUT', '30000')),
      retries: parseNumber(validateEnvVar('ANALYTICS_SERVICE_RETRIES', '2')),
      circuitBreakerThreshold: parseNumber(
        validateEnvVar('ANALYTICS_CIRCUIT_BREAKER_THRESHOLD', '3')
      ),
      circuitBreakerTimeout: parseNumber(
        validateEnvVar('ANALYTICS_CIRCUIT_BREAKER_TIMEOUT', '120000')
      ),
    },
  };

  return serviceRegistry;
}

export function getServiceRegistry(): IServiceRegistry {
  if (!serviceRegistry) {
    throw new Error('Service registry not initialized. Call initializeServiceRegistry() first.');
  }
  return serviceRegistry;
}

export function getServiceInfo(): IServiceInfo {
  const config = getGatewayConfig();

  return {
    name: 'api-gateway',
    version: process.env.npm_package_version || '1.0.0',
    environment: config.environment,
    port: config.port,
    startTime: new Date().toISOString(),
    apiPrefix: '/api/v1',
  };
}

export function getGatewayRedisConfig() {
  return getRedisConfig('GATEWAY');
}
