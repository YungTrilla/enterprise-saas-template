/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock logger to reduce test output noise
jest.mock('../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
  CorrelatedLogger: jest.fn().mockImplementation(() => ({
    setCorrelationId: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  SecurityLogger: jest.fn().mockImplementation(() => ({
    logSecurityEvent: jest.fn(),
    logFailedLogin: jest.fn(),
    logSuspiciousActivity: jest.fn(),
  })),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';
process.env.JWT_ISSUER = 'test-issuer';
process.env.JWT_AUDIENCE = 'test-audience';
process.env.BCRYPT_ROUNDS = '10';
process.env.ENABLE_MFA = 'false';
process.env.PASSWORD_RESET_EXPIRATION = '3600000';
process.env.RATE_LIMIT_WINDOW = '900000';
process.env.RATE_LIMIT_MAX = '100';

// Increase test timeout for async operations
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});