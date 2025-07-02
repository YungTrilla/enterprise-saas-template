import * as dotenv from 'dotenv';
import Joi from 'joi';
import { z } from 'zod';
import { validateWithJoi, validateWithZod } from '@abyss/shared-utils';

// ========================================
// Types and Interfaces
// ========================================

export type Environment = 'development' | 'test' | 'staging' | 'production';

export interface BaseConfig {
  NODE_ENV: Environment;
  PORT: number;
  SERVICE_NAME: string;
  SERVICE_VERSION: string;
  LOG_LEVEL: string;
  API_PREFIX: string;
  CORS_ORIGINS: string[];
  ENABLE_CORS: boolean;
  REQUEST_TIMEOUT: number;
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX: number;
}

export interface DatabaseConfig {
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_SSL: boolean;
  DB_SSL_REJECT_UNAUTHORIZED: boolean;
  DB_POOL_MIN: number;
  DB_POOL_MAX: number;
  DB_TIMEOUT: number;
  DB_CONNECTION_TIMEOUT: number;
  DB_IDLE_TIMEOUT: number;
  DB_MIGRATION_TIMEOUT: number;
  DB_STATEMENT_TIMEOUT: number;
  DB_MAX_LIFETIME: number;
  DB_RETRY_ATTEMPTS: number;
  DB_RETRY_DELAY: number;
  DB_CONNECTION_CHECK_INTERVAL: number;
  DB_CREDENTIAL_ROTATION_ENABLED: boolean;
  DB_CREDENTIAL_ROTATION_INTERVAL: number;
}

export interface RedisConfig {
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;
  REDIS_TIMEOUT: number;
  REDIS_RETRY_ATTEMPTS: number;
  REDIS_RETRY_DELAY: number;
}

export interface AuthConfig {
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRATION: string;
  JWT_REFRESH_EXPIRATION: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  BCRYPT_ROUNDS: number;
  SESSION_SECRET: string;
  ENABLE_MFA: boolean;
  PASSWORD_RESET_EXPIRATION: number;
}

export interface SecurityConfig {
  ENCRYPTION_KEY: string;
  API_KEY_PREFIX: string;
  TRUSTED_PROXIES: string[];
  ENABLE_RATE_LIMITING: boolean;
  ENABLE_HELMET: boolean;
  SECURE_COOKIES: boolean;
  CSRF_SECRET: string;
  MAX_REQUEST_SIZE: string;
}

export interface MonitoringConfig {
  ENABLE_METRICS: boolean;
  METRICS_PORT: number;
  METRICS_PATH: string;
  ENABLE_TRACING: boolean;
  TRACING_ENDPOINT: string;
  HEALTH_CHECK_PATH: string;
  ENABLE_PROFILING: boolean;
}

export interface EmailConfig {
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  FROM_EMAIL: string;
  FROM_NAME: string;
}

export interface StorageConfig {
  STORAGE_TYPE: 'local' | 's3' | 'gcs';
  UPLOAD_PATH: string;
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string[];
  AWS_REGION?: string;
  AWS_BUCKET?: string;
  AWS_ACCESS_KEY?: string;
  AWS_SECRET_KEY?: string;
}

export interface ServiceUrlsConfig {
  AUTH_SERVICE_URL: string;
  INVENTORY_SERVICE_URL: string;
  ORDER_SERVICE_URL: string;
  EMPLOYEE_SERVICE_URL: string;
  ANALYTICS_SERVICE_URL: string;
  NOTIFICATION_SERVICE_URL: string;
}

export interface FullConfig extends 
  BaseConfig,
  DatabaseConfig,
  RedisConfig,
  AuthConfig,
  SecurityConfig,
  MonitoringConfig,
  EmailConfig,
  StorageConfig,
  ServiceUrlsConfig {}

// ========================================
// Validation Schemas
// ========================================

const environmentSchema = Joi.string().valid('development', 'test', 'staging', 'production').default('development');

export const baseConfigSchema = Joi.object({
  NODE_ENV: environmentSchema,
  PORT: Joi.number().port().default(3000),
  SERVICE_NAME: Joi.string().required(),
  SERVICE_VERSION: Joi.string().pattern(/^\d+\.\d+\.\d+$/).default('1.0.0'),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info'),
  API_PREFIX: Joi.string().default('/api/v1'),
  CORS_ORIGINS: Joi.array().items(Joi.string().uri()).default(['http://localhost:3000']),
  ENABLE_CORS: Joi.boolean().default(true),
  REQUEST_TIMEOUT: Joi.number().positive().default(30000),
  RATE_LIMIT_WINDOW: Joi.number().positive().default(900000), // 15 minutes
  RATE_LIMIT_MAX: Joi.number().positive().default(100),
});

export const databaseConfigSchema = Joi.object({
  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(1).max(63).required()
    .messages({
      'string.pattern.base': 'Database name must contain only alphanumeric characters, underscores, and hyphens',
      'string.min': 'Database name must be at least 1 character',
      'string.max': 'Database name must not exceed 63 characters'
    }),
  DB_USER: Joi.string().min(1).max(63).required(),
  DB_PASSWORD: Joi.string().min(8).required(),
  DB_SSL: Joi.boolean().default(Joi.ref('$environment') === 'production' ? true : false),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(true),
  DB_POOL_MIN: Joi.number().min(0).max(50).default(
    Joi.when('$environment', {
      is: 'production',
      then: Joi.number().default(5),
      otherwise: Joi.number().default(2)
    })
  ),
  DB_POOL_MAX: Joi.number().min(1).max(100).default(
    Joi.when('$environment', {
      is: 'production',
      then: Joi.number().default(20),
      otherwise: Joi.number().default(10)
    })
  ).custom((value, helpers) => {
    const poolMin = helpers.state.ancestors[0].DB_POOL_MIN || 2;
    if (value <= poolMin) {
      return helpers.error('any.invalid', { message: 'DB_POOL_MAX must be greater than DB_POOL_MIN' });
    }
    return value;
  }),
  DB_TIMEOUT: Joi.number().positive().min(1000).max(60000).default(30000),
  DB_CONNECTION_TIMEOUT: Joi.number().positive().min(1000).max(30000).default(10000),
  DB_IDLE_TIMEOUT: Joi.number().positive().min(5000).max(300000).default(30000),
  DB_MIGRATION_TIMEOUT: Joi.number().positive().min(30000).max(600000).default(300000), // 5 minutes
  DB_STATEMENT_TIMEOUT: Joi.number().positive().min(1000).max(300000).default(60000), // 1 minute
  DB_MAX_LIFETIME: Joi.number().positive().min(60000).max(7200000).default(3600000), // 1 hour
  DB_RETRY_ATTEMPTS: Joi.number().min(0).max(10).default(3),
  DB_RETRY_DELAY: Joi.number().positive().min(100).max(10000).default(1000),
  DB_CONNECTION_CHECK_INTERVAL: Joi.number().positive().min(5000).max(300000).default(30000),
  DB_CREDENTIAL_ROTATION_ENABLED: Joi.boolean().default(false),
  DB_CREDENTIAL_ROTATION_INTERVAL: Joi.number().positive().min(3600000).max(604800000).default(86400000), // 24 hours
});

export const redisConfigSchema = Joi.object({
  REDIS_HOST: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().min(0).max(15).default(0),
  REDIS_TIMEOUT: Joi.number().positive().default(5000),
  REDIS_RETRY_ATTEMPTS: Joi.number().min(0).default(3),
  REDIS_RETRY_DELAY: Joi.number().positive().default(1000),
});

export const authConfigSchema = Joi.object({
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  JWT_ISSUER: Joi.string().default('abyss-central'),
  JWT_AUDIENCE: Joi.string().default('abyss-users'),
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),
  SESSION_SECRET: Joi.string().min(32).required(),
  ENABLE_MFA: Joi.boolean().default(false),
  PASSWORD_RESET_EXPIRATION: Joi.number().positive().default(3600000), // 1 hour
});

export const securityConfigSchema = Joi.object({
  ENCRYPTION_KEY: Joi.string().min(32).required(),
  API_KEY_PREFIX: Joi.string().default('ak'),
  TRUSTED_PROXIES: Joi.array().items(Joi.string()).default([]),
  ENABLE_RATE_LIMITING: Joi.boolean().default(true),
  ENABLE_HELMET: Joi.boolean().default(true),
  SECURE_COOKIES: Joi.boolean().default(false),
  CSRF_SECRET: Joi.string().min(32).required(),
  MAX_REQUEST_SIZE: Joi.string().default('1mb'),
});

export const serviceUrlsSchema = Joi.object({
  AUTH_SERVICE_URL: Joi.string().uri().default('http://localhost:3001'),
  INVENTORY_SERVICE_URL: Joi.string().uri().default('http://localhost:3002'),
  ORDER_SERVICE_URL: Joi.string().uri().default('http://localhost:3003'),
  EMPLOYEE_SERVICE_URL: Joi.string().uri().default('http://localhost:3004'),
  ANALYTICS_SERVICE_URL: Joi.string().uri().default('http://localhost:3005'),
  NOTIFICATION_SERVICE_URL: Joi.string().uri().default('http://localhost:3006'),
});

// ========================================
// Configuration Manager Class
// ========================================

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Partial<FullConfig> = {};
  private isLoaded = false;
  private environment: Environment;

  private constructor() {
    this.environment = this.detectEnvironment();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): Environment {
    const env = process.env.NODE_ENV?.toLowerCase();
    
    if (env === 'production' || env === 'prod') return 'production';
    if (env === 'staging' || env === 'stage') return 'staging';
    if (env === 'test' || env === 'testing') return 'test';
    return 'development';
  }

  /**
   * Load configuration from environment and .env files
   */
  async load(envFilePath?: string): Promise<void> {
    if (this.isLoaded) return;

    // Load .env file
    if (envFilePath) {
      dotenv.config({ path: envFilePath });
    } else {
      // Load environment-specific .env file
      const envFiles = [
        `.env.${this.environment}.local`,
        `.env.${this.environment}`,
        '.env.local',
        '.env'
      ];

      for (const file of envFiles) {
        try {
          dotenv.config({ path: file });
          break; // Use the first file that exists
        } catch (error) {
          // Continue to next file
        }
      }
    }

    // Parse and validate configuration
    this.config = this.parseEnvironmentVariables();
    this.isLoaded = true;
  }

  /**
   * Parse environment variables into typed configuration
   */
  private parseEnvironmentVariables(): Partial<FullConfig> {
    const env = process.env;

    return {
      // Base config
      NODE_ENV: this.environment,
      PORT: parseInt(env.PORT || '3000', 10),
      SERVICE_NAME: env.SERVICE_NAME || 'abyss-service',
      SERVICE_VERSION: env.SERVICE_VERSION || '1.0.0',
      LOG_LEVEL: env.LOG_LEVEL || 'info',
      API_PREFIX: env.API_PREFIX || '/api/v1',
      CORS_ORIGINS: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
      ENABLE_CORS: env.ENABLE_CORS !== 'false',
      REQUEST_TIMEOUT: parseInt(env.REQUEST_TIMEOUT || '30000', 10),
      RATE_LIMIT_WINDOW: parseInt(env.RATE_LIMIT_WINDOW || '900000', 10),
      RATE_LIMIT_MAX: parseInt(env.RATE_LIMIT_MAX || '100', 10),

      // Database config
      DB_HOST: env.DB_HOST || 'localhost',
      DB_PORT: parseInt(env.DB_PORT || '5432', 10),
      DB_NAME: env.DB_NAME,
      DB_USER: env.DB_USER,
      DB_PASSWORD: env.DB_PASSWORD,
      DB_SSL: env.DB_SSL === 'true' || this.isProduction(),
      DB_SSL_REJECT_UNAUTHORIZED: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      DB_POOL_MIN: parseInt(env.DB_POOL_MIN || (this.isProduction() ? '5' : '2'), 10),
      DB_POOL_MAX: parseInt(env.DB_POOL_MAX || (this.isProduction() ? '20' : '10'), 10),
      DB_TIMEOUT: parseInt(env.DB_TIMEOUT || '30000', 10),
      DB_CONNECTION_TIMEOUT: parseInt(env.DB_CONNECTION_TIMEOUT || '10000', 10),
      DB_IDLE_TIMEOUT: parseInt(env.DB_IDLE_TIMEOUT || '30000', 10),
      DB_MIGRATION_TIMEOUT: parseInt(env.DB_MIGRATION_TIMEOUT || '300000', 10),
      DB_STATEMENT_TIMEOUT: parseInt(env.DB_STATEMENT_TIMEOUT || '60000', 10),
      DB_MAX_LIFETIME: parseInt(env.DB_MAX_LIFETIME || '3600000', 10),
      DB_RETRY_ATTEMPTS: parseInt(env.DB_RETRY_ATTEMPTS || '3', 10),
      DB_RETRY_DELAY: parseInt(env.DB_RETRY_DELAY || '1000', 10),
      DB_CONNECTION_CHECK_INTERVAL: parseInt(env.DB_CONNECTION_CHECK_INTERVAL || '30000', 10),
      DB_CREDENTIAL_ROTATION_ENABLED: env.DB_CREDENTIAL_ROTATION_ENABLED === 'true',
      DB_CREDENTIAL_ROTATION_INTERVAL: parseInt(env.DB_CREDENTIAL_ROTATION_INTERVAL || '86400000', 10),

      // Redis config
      REDIS_HOST: env.REDIS_HOST || 'localhost',
      REDIS_PORT: parseInt(env.REDIS_PORT || '6379', 10),
      REDIS_PASSWORD: env.REDIS_PASSWORD,
      REDIS_DB: parseInt(env.REDIS_DB || '0', 10),
      REDIS_TIMEOUT: parseInt(env.REDIS_TIMEOUT || '5000', 10),
      REDIS_RETRY_ATTEMPTS: parseInt(env.REDIS_RETRY_ATTEMPTS || '3', 10),
      REDIS_RETRY_DELAY: parseInt(env.REDIS_RETRY_DELAY || '1000', 10),

      // Auth config
      JWT_SECRET: env.JWT_SECRET,
      JWT_ACCESS_EXPIRATION: env.JWT_ACCESS_EXPIRATION || '15m',
      JWT_REFRESH_EXPIRATION: env.JWT_REFRESH_EXPIRATION || '7d',
      JWT_ISSUER: env.JWT_ISSUER || 'abyss-central',
      JWT_AUDIENCE: env.JWT_AUDIENCE || 'abyss-users',
      BCRYPT_ROUNDS: parseInt(env.BCRYPT_ROUNDS || '12', 10),
      SESSION_SECRET: env.SESSION_SECRET,
      ENABLE_MFA: env.ENABLE_MFA === 'true',
      PASSWORD_RESET_EXPIRATION: parseInt(env.PASSWORD_RESET_EXPIRATION || '3600000', 10),

      // Security config
      ENCRYPTION_KEY: env.ENCRYPTION_KEY,
      API_KEY_PREFIX: env.API_KEY_PREFIX || 'ak',
      TRUSTED_PROXIES: env.TRUSTED_PROXIES ? env.TRUSTED_PROXIES.split(',') : [],
      ENABLE_RATE_LIMITING: env.ENABLE_RATE_LIMITING !== 'false',
      ENABLE_HELMET: env.ENABLE_HELMET !== 'false',
      SECURE_COOKIES: env.SECURE_COOKIES === 'true',
      CSRF_SECRET: env.CSRF_SECRET,
      MAX_REQUEST_SIZE: env.MAX_REQUEST_SIZE || '1mb',

      // Service URLs
      AUTH_SERVICE_URL: env.AUTH_SERVICE_URL || 'http://localhost:3001',
      INVENTORY_SERVICE_URL: env.INVENTORY_SERVICE_URL || 'http://localhost:3002',
      ORDER_SERVICE_URL: env.ORDER_SERVICE_URL || 'http://localhost:3003',
      EMPLOYEE_SERVICE_URL: env.EMPLOYEE_SERVICE_URL || 'http://localhost:3004',
      ANALYTICS_SERVICE_URL: env.ANALYTICS_SERVICE_URL || 'http://localhost:3005',
      NOTIFICATION_SERVICE_URL: env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
    };
  }

  /**
   * Get configuration value by key
   */
  get<K extends keyof FullConfig>(key: K): FullConfig[K] {
    if (!this.isLoaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config[key] as FullConfig[K];
  }

  /**
   * Get all configuration
   */
  getAll(): Partial<FullConfig> {
    if (!this.isLoaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return { ...this.config };
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.environment === 'development';
  }

  /**
   * Check if running in test
   */
  isTest(): boolean {
    return this.environment === 'test';
  }

  /**
   * Check if running in staging
   */
  isStaging(): boolean {
    return this.environment === 'staging';
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.environment === 'production';
  }

  /**
   * Get current environment
   */
  getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Validate configuration against schema
   */
  validate(): { isValid: boolean; errors: string[] } {
    if (!this.isLoaded) {
      return { isValid: false, errors: ['Configuration not loaded'] };
    }

    const errors: string[] = [];

    // Validate base config
    const baseResult = validateWithJoi(this.config, baseConfigSchema);
    if (!baseResult.isValid) {
      errors.push(...baseResult.errors.map(e => `Base config: ${e.message}`));
    }

    // Validate auth config if JWT_SECRET is provided
    if (this.config.JWT_SECRET) {
      const authResult = validateWithJoi(this.config, authConfigSchema);
      if (!authResult.isValid) {
        errors.push(...authResult.errors.map(e => `Auth config: ${e.message}`));
      }
    }

    // Validate database config if DB_NAME is provided
    if (this.config.DB_NAME) {
      const dbResult = validateWithJoi(this.config, databaseConfigSchema.options({ context: { environment: this.environment } }));
      if (!dbResult.isValid) {
        errors.push(...dbResult.errors.map(e => `Database config: ${e.message}`));
      }
    }

    // Validate security config in production
    if (this.isProduction()) {
      if (!this.config.ENCRYPTION_KEY) {
        errors.push('Security config: ENCRYPTION_KEY is required in production');
      }
      
      // Database security validation for production
      if (this.config.DB_NAME) {
        if (!this.config.DB_SSL) {
          errors.push('Database config: SSL must be enabled in production');
        }
        if (this.config.DB_PASSWORD && this.config.DB_PASSWORD.length < 12) {
          errors.push('Database config: Password must be at least 12 characters in production');
        }
        if (this.config.DB_POOL_MAX && this.config.DB_POOL_MAX < 5) {
          errors.push('Database config: Pool max should be at least 5 in production');
        }
      }
      
      // Redis security validation for production
      if (this.config.REDIS_HOST && this.config.REDIS_HOST !== 'localhost' && !this.config.REDIS_PASSWORD) {
        errors.push('Redis config: Password is required for non-localhost connections in production');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get database connection string with enhanced security parameters
   */
  getDatabaseUrl(): string {
    const { 
      DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, 
      DB_SSL, DB_SSL_REJECT_UNAUTHORIZED, DB_CONNECTION_TIMEOUT 
    } = this.config;
    
    if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD) {
      throw new Error('Database configuration incomplete');
    }

    const params = new URLSearchParams();
    
    if (DB_SSL) {
      params.set('sslmode', 'require');
      if (DB_SSL_REJECT_UNAUTHORIZED === false) {
        params.set('sslcert', 'disable');
      }
    }
    
    if (DB_CONNECTION_TIMEOUT) {
      params.set('connect_timeout', Math.floor(DB_CONNECTION_TIMEOUT / 1000).toString());
    }
    
    params.set('application_name', this.get('SERVICE_NAME') || 'abyss-service');
    
    const paramString = params.toString();
    return `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}${paramString ? '?' + paramString : ''}`;
  }

  /**
   * Get Redis connection config with enhanced security
   */
  getRedisConfig(): { host: string; port: number; password?: string; db: number; connectTimeout: number; retryDelayOnFailover: number; maxRetriesPerRequest: number } {
    const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, REDIS_TIMEOUT, REDIS_RETRY_ATTEMPTS, REDIS_RETRY_DELAY } = this.config;
    
    return {
      host: REDIS_HOST || 'localhost',
      port: REDIS_PORT || 6379,
      password: REDIS_PASSWORD,
      db: REDIS_DB || 0,
      connectTimeout: REDIS_TIMEOUT || 5000,
      retryDelayOnFailover: REDIS_RETRY_DELAY || 1000,
      maxRetriesPerRequest: REDIS_RETRY_ATTEMPTS || 3
    };
  }

  /**
   * Get service URLs mapping
   */
  getServiceUrls(): ServiceUrlsConfig {
    return {
      AUTH_SERVICE_URL: this.get('AUTH_SERVICE_URL'),
      INVENTORY_SERVICE_URL: this.get('INVENTORY_SERVICE_URL'),
      ORDER_SERVICE_URL: this.get('ORDER_SERVICE_URL'),
      EMPLOYEE_SERVICE_URL: this.get('EMPLOYEE_SERVICE_URL'),
      ANALYTICS_SERVICE_URL: this.get('ANALYTICS_SERVICE_URL'),
      NOTIFICATION_SERVICE_URL: this.get('NOTIFICATION_SERVICE_URL'),
    };
  }

  /**
   * Get enhanced database connection configuration for database clients
   */
  getDatabaseConfig(): {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean | { rejectUnauthorized: boolean };
    connectionTimeoutMillis: number;
    idleTimeoutMillis: number;
    statementTimeout: number;
    max: number;
    min: number;
    maxLifetimeSeconds: number;
    application_name: string;
  } {
    const {
      DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD,
      DB_SSL, DB_SSL_REJECT_UNAUTHORIZED,
      DB_CONNECTION_TIMEOUT, DB_IDLE_TIMEOUT, DB_STATEMENT_TIMEOUT,
      DB_POOL_MIN, DB_POOL_MAX, DB_MAX_LIFETIME
    } = this.config;

    if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD) {
      throw new Error('Database configuration incomplete');
    }

    return {
      host: DB_HOST,
      port: DB_PORT || 5432,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      ssl: DB_SSL ? {
        rejectUnauthorized: DB_SSL_REJECT_UNAUTHORIZED !== false
      } : false,
      connectionTimeoutMillis: DB_CONNECTION_TIMEOUT || 10000,
      idleTimeoutMillis: DB_IDLE_TIMEOUT || 30000,
      statementTimeout: DB_STATEMENT_TIMEOUT || 60000,
      max: DB_POOL_MAX || (this.isProduction() ? 20 : 10),
      min: DB_POOL_MIN || (this.isProduction() ? 5 : 2),
      maxLifetimeSeconds: Math.floor((DB_MAX_LIFETIME || 3600000) / 1000),
      application_name: this.get('SERVICE_NAME') || 'abyss-service'
    };
  }

  /**
   * Get database retry configuration for connection resilience
   */
  getDatabaseRetryConfig(): {
    attempts: number;
    delay: number;
    exponentialBackoff: boolean;
    maxDelay: number;
  } {
    const { DB_RETRY_ATTEMPTS, DB_RETRY_DELAY } = this.config;
    
    return {
      attempts: DB_RETRY_ATTEMPTS || 3,
      delay: DB_RETRY_DELAY || 1000,
      exponentialBackoff: true,
      maxDelay: (DB_RETRY_DELAY || 1000) * 10
    };
  }

  /**
   * Set configuration value (for testing)
   */
  set<K extends keyof FullConfig>(key: K, value: FullConfig[K]): void {
    this.config[key] = value;
  }

  /**
   * Reset configuration (for testing)
   */
  reset(): void {
    this.config = {};
    this.isLoaded = false;
  }
}

// ========================================
// Convenience Functions
// ========================================

// Create default instance
const configManager = ConfigManager.getInstance();

/**
 * Load configuration
 */
export async function loadConfig(envFilePath?: string): Promise<void> {
  await configManager.load(envFilePath);
}

/**
 * Get configuration value
 */
export function getConfig<K extends keyof FullConfig>(key: K): FullConfig[K] {
  return configManager.get(key);
}

/**
 * Get all configuration
 */
export function getAllConfig(): Partial<FullConfig> {
  return configManager.getAll();
}

/**
 * Environment checks
 */
export const isDevelopment = () => configManager.isDevelopment();
export const isTest = () => configManager.isTest();
export const isStaging = () => configManager.isStaging();
export const isProduction = () => configManager.isProduction();
export const getEnvironment = () => configManager.getEnvironment();

/**
 * Validate configuration
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
  return configManager.validate();
}

/**
 * Get database URL
 */
export function getDatabaseUrl(): string {
  return configManager.getDatabaseUrl();
}

/**
 * Get Redis config
 */
export function getRedisConfig(): { host: string; port: number; password?: string; db: number } {
  return configManager.getRedisConfig();
}

/**
 * Get service URLs
 */
export function getServiceUrls(): ServiceUrlsConfig {
  return configManager.getServiceUrls();
}

/**
 * Get database configuration for database clients
 */
export function getDatabaseConfig() {
  return configManager.getDatabaseConfig();
}

/**
 * Get database retry configuration
 */
export function getDatabaseRetryConfig() {
  return configManager.getDatabaseRetryConfig();
}

// Export configuration manager instance
export { configManager };

// Export database utilities
export * from './database';