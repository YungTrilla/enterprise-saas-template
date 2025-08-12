/**
 * Auth Routes Integration Tests
 */

import express from 'express';
import request from 'supertest';
import { authRoutes } from '../auth.routes';
import { AuthService } from '../../services/auth.service';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import {
  createMockUser,
  createMockAuthConfig,
  createCorrelationId,
} from '../../__tests__/utils/test-helpers';
import { ILoginRequest } from '../../types/auth';

describe('Auth Routes', () => {
  let app: express.Application;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockAuthMiddleware: jest.Mocked<AuthMiddleware>;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock auth service
    mockAuthService = {
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshToken: jest.fn(),
      changePassword: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      resetPassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      setupMfa: jest.fn(),
      verifyAndEnableMfa: jest.fn(),
      disableMfa: jest.fn(),
    } as any;

    // Mock auth middleware
    mockAuthMiddleware = {
      authenticate: jest.fn((req, res, next) => {
        req.user = { id: 'user-123', email: 'test@example.com' };
        next();
      }),
      authorize: jest.fn(permissions => (req, res, next) => next()),
      requireMfa: jest.fn((req, res, next) => next()),
      correlationId: jest.fn((req, res, next) => {
        req.correlationId = createCorrelationId();
        next();
      }),
    } as any;

    // Set up routes
    app.use(mockAuthMiddleware.correlationId);
    app.use('/api/v1/auth', authRoutes(mockAuthService, mockAuthMiddleware));
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginRequest: ILoginRequest = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockResponse = {
        user: createMockUser(),
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 900,
          tokenType: 'Bearer',
          sessionId: 'session-123',
        },
        requiresMfa: false,
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const response = await request(app).post('/api/v1/auth/login').send(loginRequest).expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: expect.objectContaining({
            id: mockResponse.user.id,
            email: mockResponse.user.email,
          }),
          tokens: mockResponse.tokens,
          requiresMfa: false,
        },
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(
        expect.objectContaining(loginRequest),
        expect.any(String), // IP address
        expect.stringContaining('node-superagent'), // User agent
        expect.any(String) // Correlation ID
      );
    });

    it('should handle login errors', async () => {
      const loginRequest: ILoginRequest = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      mockAuthService.login.mockRejectedValue(new Error('Invalid email or password'));

      const response = await request(app).post('/api/v1/auth/login').send(loginRequest).expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid email or password',
        },
      });
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'short',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logged out successfully',
      });

      expect(mockAuthService.logout).toHaveBeenCalledWith(
        'user-123',
        undefined,
        expect.any(String)
      );
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register new user successfully', async () => {
      const registerRequest = {
        email: 'newuser@example.com',
        password: 'StrongPassword123!',
        firstName: 'New',
        lastName: 'User',
      };

      const mockResponse = {
        user: createMockUser(registerRequest),
        message: 'Registration successful',
        emailVerificationRequired: true,
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerRequest)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: mockResponse,
      });
    });

    it('should validate registration data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'weak',
          firstName: '',
          lastName: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        sessionId: 'session-123',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockTokens);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockTokens,
      });
    });

    it('should handle invalid refresh token', async () => {
      mockAuthService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: 'Invalid refresh token',
        },
      });
    });
  });

  describe('Protected routes', () => {
    it('should require authentication for change password', async () => {
      mockAuthMiddleware.authenticate.mockImplementationOnce((req, res, next) => {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'No token provided' },
        });
      });

      await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          currentPassword: 'old',
          newPassword: 'new',
        })
        .expect(401);
    });

    it('should change password when authenticated', async () => {
      mockAuthService.changePassword.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password changed successfully',
      });

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        }),
        expect.any(String)
      );
    });
  });

  describe('MFA routes', () => {
    it('should setup MFA for authenticated user', async () => {
      const mockMfaResponse = {
        secret: 'mfa-secret',
        qrCodeUrl: 'data:image/png;base64,...',
        backupCodes: ['code1', 'code2', 'code3'],
      };

      mockAuthService.setupMfa.mockResolvedValue(mockMfaResponse);

      const response = await request(app)
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockMfaResponse,
      });
    });

    it('should verify and enable MFA', async () => {
      mockAuthService.verifyAndEnableMfa.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/v1/auth/mfa/verify')
        .set('Authorization', 'Bearer valid-token')
        .send({ code: '123456' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'MFA enabled successfully',
      });
    });

    it('should disable MFA with password', async () => {
      mockAuthService.disableMfa.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/v1/auth/mfa/disable')
        .set('Authorization', 'Bearer valid-token')
        .send({ password: 'Password123!' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'MFA disabled successfully',
      });
    });
  });
});
