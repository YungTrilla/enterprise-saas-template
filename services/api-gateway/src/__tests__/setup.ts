/**
 * Vitest Test Setup for API Gateway
 * Global test configuration and utilities
 */

import { vi } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock logger to reduce test output noise
vi.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
process.env.SERVICE_DISCOVERY = JSON.stringify({
  auth: 'http://localhost:3001',
  inventory: 'http://localhost:3020',
  orders: 'http://localhost:3021',
});
process.env.RATE_LIMIT_WINDOW = '900000';
process.env.RATE_LIMIT_MAX = '100';
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
