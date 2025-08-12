/**
 * Auth Service Configuration
 * Environment-aware configuration with security-first defaults
 */

import { loadConfig, getConfig, ConfigManager, isProduction } from '@template/shared-config';
import { IAuthConfig } from '../types/auth';

/**
 * Load and validate auth service configuration
 */
export async function initializeAuthConfig(): Promise<IAuthConfig> {
  try {
    // Initialize shared configuration
    await loadConfig();

    const config = ConfigManager.getInstance();

    // Validate required auth configuration
    const validation = config.validate();
    if (!validation.isValid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Build auth-specific configuration
    const authConfig: IAuthConfig = {
      jwt: {
        secret: getConfig('JWT_SECRET'),
        accessTokenExpiration: getConfig('JWT_ACCESS_EXPIRATION'),
        refreshTokenExpiration: getConfig('JWT_REFRESH_EXPIRATION'),
        issuer: getConfig('JWT_ISSUER'),
        audience: getConfig('JWT_AUDIENCE'),
      },
      password: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        saltRounds: getConfig('BCRYPT_ROUNDS'),
      },
      security: {
        maxLoginAttempts: isProduction() ? 5 : 10,
        lockoutDuration: isProduction() ? 15 * 60 * 1000 : 5 * 60 * 1000, // 15/5 minutes
        sessionTimeout: isProduction() ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15min/1hour
        mfaRequired: getConfig('ENABLE_MFA'),
        passwordResetExpiration: getConfig('PASSWORD_RESET_EXPIRATION'),
        emailVerificationExpiration: 24 * 60 * 60 * 1000, // 24 hours
      },
      rateLimit: {
        windowMs: getConfig('RATE_LIMIT_WINDOW'),
        maxRequests: getConfig('RATE_LIMIT_MAX'),
        skipSuccessfulRequests: true,
      },
    };

    // Validate auth configuration
    validateAuthConfig(authConfig);

    return authConfig;
  } catch (error) {
    throw new Error(`Failed to initialize auth configuration: ${(error as Error).message}`);
  }
}

/**
 * Validate auth-specific configuration
 */
function validateAuthConfig(config: IAuthConfig): void {
  const errors: string[] = [];

  // JWT validation
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    errors.push('JWT secret must be at least 32 characters');
  }

  if (!config.jwt.issuer || !config.jwt.audience) {
    errors.push('JWT issuer and audience are required');
  }

  // Password policy validation
  if (config.password.minLength < 8) {
    errors.push('Password minimum length must be at least 8 characters');
  }

  if (config.password.saltRounds < 10) {
    errors.push('Password salt rounds must be at least 10');
  }

  // Security validation
  if (config.security.maxLoginAttempts < 3) {
    errors.push('Max login attempts must be at least 3');
  }

  if (config.security.lockoutDuration < 60000) {
    errors.push('Lockout duration must be at least 1 minute');
  }

  // Rate limiting validation
  if (config.rateLimit.maxRequests < 10) {
    errors.push('Rate limit max requests must be at least 10');
  }

  if (errors.length > 0) {
    throw new Error(`Auth configuration validation failed: ${errors.join(', ')}`);
  }
}

/**
 * Get auth service database configuration
 */
export function getAuthDatabaseConfig() {
  const config = ConfigManager.getInstance();
  return config.getDatabaseConfig();
}

/**
 * Get auth service Redis configuration
 */
export function getAuthRedisConfig() {
  const config = ConfigManager.getInstance();
  return config.getRedisConfig();
}

/**
 * Get service information
 */
export function getServiceInfo() {
  return {
    name: getConfig('SERVICE_NAME') || 'abyss-auth-service',
    version: getConfig('SERVICE_VERSION') || '0.1.0',
    port: getConfig('PORT') || 3001,
    environment: ConfigManager.getInstance().getEnvironment(),
    apiPrefix: getConfig('API_PREFIX') || '/api/v1',
  };
}
