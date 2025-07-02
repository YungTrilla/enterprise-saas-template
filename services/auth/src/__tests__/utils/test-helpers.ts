/**
 * Test Helper Utilities
 * Common test utilities and factories
 */

import { v4 as uuidv4 } from 'uuid';
import { EntityId, CorrelationId } from '@abyss/shared-types';
import {
  IUser,
  IRole,
  IPermission,
  IUserSession,
  ILoginRequest,
  IRegisterRequest,
  IAuthConfig,
} from '../../types/auth';

/**
 * Create a mock user
 */
export function createMockUser(overrides: Partial<IUser> = {}): IUser {
  const userId = (overrides.id || uuidv4()) as EntityId;
  const now = new Date().toISOString();

  return {
    id: userId,
    email: 'test@example.com',
    passwordHash: '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    firstName: 'Test',
    lastName: 'User',
    status: 'active',
    isEmailVerified: true,
    emailVerifiedAt: now,
    lastLoginAt: now,
    lastPasswordChangeAt: now,
    failedLoginAttempts: 0,
    mfaEnabled: false,
    timezone: 'UTC',
    locale: 'en',
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
    ...overrides,
  };
}

/**
 * Create a mock role
 */
export function createMockRole(overrides: Partial<IRole> = {}): IRole {
  const roleId = (overrides.id || uuidv4()) as EntityId;
  const now = new Date().toISOString();

  return {
    id: roleId,
    name: 'test-role',
    description: 'Test role',
    status: 'active',
    permissions: [],
    isSystem: false,
    createdAt: now,
    updatedAt: now,
    createdBy: roleId,
    updatedBy: roleId,
    ...overrides,
  };
}

/**
 * Create a mock permission
 */
export function createMockPermission(overrides: Partial<IPermission> = {}): IPermission {
  const permissionId = (overrides.id || uuidv4()) as EntityId;
  const now = new Date().toISOString();

  return {
    id: permissionId,
    resource: 'test-resource',
    action: 'read',
    description: 'Test permission',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: permissionId,
    updatedBy: permissionId,
    ...overrides,
  };
}

/**
 * Create a mock session
 */
export function createMockSession(overrides: Partial<IUserSession> = {}): IUserSession {
  const sessionId = (overrides.id || uuidv4()) as EntityId;
  const userId = (overrides.userId || uuidv4()) as EntityId;
  const now = new Date().toISOString();

  return {
    id: sessionId,
    userId,
    sessionToken: 'test-session-token',
    refreshToken: 'test-refresh-token',
    accessToken: 'test-access-token',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    isActive: true,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    lastAccessAt: now,
    correlationId: uuidv4() as CorrelationId,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
    ...overrides,
  };
}

/**
 * Create a mock login request
 */
export function createMockLoginRequest(overrides: Partial<ILoginRequest> = {}): ILoginRequest {
  return {
    email: 'test@example.com',
    password: 'Password123!',
    correlationId: uuidv4() as CorrelationId,
    ...overrides,
  };
}

/**
 * Create a mock register request
 */
export function createMockRegisterRequest(overrides: Partial<IRegisterRequest> = {}): IRegisterRequest {
  return {
    email: 'newuser@example.com',
    password: 'Password123!',
    firstName: 'New',
    lastName: 'User',
    timezone: 'UTC',
    locale: 'en',
    correlationId: uuidv4() as CorrelationId,
    ...overrides,
  };
}

/**
 * Create a mock auth config
 */
export function createMockAuthConfig(overrides: Partial<IAuthConfig> = {}): IAuthConfig {
  return {
    jwt: {
      secret: 'test-jwt-secret-that-is-at-least-32-characters-long',
      accessTokenExpiration: '15m',
      refreshTokenExpiration: '7d',
      issuer: 'test-issuer',
      audience: 'test-audience',
      ...overrides.jwt,
    },
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      saltRounds: 10,
      ...overrides.password,
    },
    security: {
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000,
      sessionTimeout: 15 * 60 * 1000,
      mfaRequired: false,
      passwordResetExpiration: 3600000,
      emailVerificationExpiration: 24 * 60 * 60 * 1000,
      ...overrides.security,
    },
    rateLimit: {
      windowMs: 900000,
      maxRequests: 100,
      skipSuccessfulRequests: true,
      ...overrides.rateLimit,
    },
  };
}

/**
 * Create a correlation ID for testing
 */
export function createCorrelationId(): CorrelationId {
  return uuidv4() as CorrelationId;
}