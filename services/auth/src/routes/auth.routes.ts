/**
 * Authentication Routes
 * All authentication and authorization endpoints
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { createLogger } from '../utils/logger';
import { userRoutes } from './user.routes';

const logger = createLogger('auth-routes');

export function authRoutes(authService: AuthService, authMiddleware: AuthMiddleware): Router {
  const router = Router();

  /**
   * Validation middleware
   */
  const handleValidationErrors = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors.array(),
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };

  /**
   * POST /login
   * Authenticate user with email and password
   */
  router.post(
    '/login',
    [
      body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
      body('password').isLength({ min: 1 }).withMessage('Password is required'),
      body('mfaCode')
        .optional()
        .isLength({ min: 6, max: 8 })
        .withMessage('Invalid MFA code format'),
      body('deviceFingerprint').optional().isString(),
    ],
    handleValidationErrors,
    authMiddleware.rateLimit(15 * 60 * 1000, 5, 'Too many login attempts'), // 5 attempts per 15 minutes
    async (req, res) => {
      try {
        const { email, password, mfaCode, deviceFingerprint } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent') || '';

        const result = await authService.login(
          { email, password, mfaCode, deviceFingerprint, correlationId: req.correlationId },
          ipAddress,
          userAgent,
          req.correlationId
        );

        res.json({
          success: true,
          data: result,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Login failed', {
          error: (error as Error).message,
          correlationId: req.correlationId,
        });

        res.status(401).json({
          success: false,
          error: {
            code: 'LOGIN_FAILED',
            message: (error as Error).message,
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * POST /register
   * Register new user account
   */
  router.post(
    '/register',
    [
      body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
      body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
      body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
      body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
      body('timezone').optional().isString(),
      body('locale').optional().isString(),
    ],
    handleValidationErrors,
    authMiddleware.rateLimit(60 * 60 * 1000, 3, 'Too many registration attempts'), // 3 attempts per hour
    async (req, res) => {
      try {
        const { email, password, firstName, lastName, timezone, locale } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent') || '';

        const result = await authService.register(
          {
            email,
            password,
            firstName,
            lastName,
            timezone,
            locale,
            correlationId: req.correlationId,
          },
          ipAddress,
          userAgent,
          req.correlationId
        );

        res.status(201).json({
          success: true,
          data: result,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Registration failed', {
          error: (error as Error).message,
          correlationId: req.correlationId,
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: (error as Error).message,
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * POST /refresh
   * Refresh authentication tokens
   */
  router.post(
    '/refresh',
    [body('refreshToken').isString().isLength({ min: 1 }).withMessage('Refresh token is required')],
    handleValidationErrors,
    authMiddleware.rateLimit(15 * 60 * 1000, 10), // 10 attempts per 15 minutes
    async (req, res) => {
      try {
        const { refreshToken } = req.body;
        const ipAddress = req.ip;

        const result = await authService.refreshTokens(refreshToken, ipAddress, req.correlationId);

        res.json({
          success: true,
          data: result,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Token refresh failed', {
          error: (error as Error).message,
          correlationId: req.correlationId,
        });

        res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_FAILED',
            message: (error as Error).message,
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * POST /logout
   * Logout and invalidate session
   */
  router.post('/logout', authMiddleware.requireAuth(), async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.substring(7) || '';

      await authService.logout(accessToken, req.correlationId);

      res.json({
        success: true,
        message: 'Logged out successfully',
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Logout failed', {
        error: (error as Error).message,
        correlationId: req.correlationId,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: (error as Error).message,
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /me
   * Get current user profile
   */
  router.get('/me', authMiddleware.requireAuth(), async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          userId: req.auth!.userId,
          email: req.auth!.email,
          roles: req.auth!.roles,
          permissions: req.auth!.permissions,
          sessionId: req.auth!.sessionId,
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get user profile failed', {
        error: (error as Error).message,
        correlationId: req.correlationId,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_FETCH_FAILED',
          message: 'Failed to get user profile',
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /mfa/setup
   * Setup MFA for user
   */
  router.post('/mfa/setup', authMiddleware.requireAuth(), async (req, res) => {
    try {
      const result = await authService.setupMfa(req.auth!.userId, req.correlationId);

      res.json({
        success: true,
        data: result,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('MFA setup failed', {
        error: (error as Error).message,
        correlationId: req.correlationId,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'MFA_SETUP_FAILED',
          message: (error as Error).message,
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /mfa/verify
   * Verify and enable MFA
   */
  router.post(
    '/mfa/verify',
    [
      body('code')
        .isString()
        .isLength({ min: 6, max: 8 })
        .withMessage('Valid MFA code is required'),
    ],
    handleValidationErrors,
    authMiddleware.requireAuth(),
    async (req, res) => {
      try {
        const { code } = req.body;

        await authService.verifyAndEnableMfa(
          req.auth!.userId,
          { code, correlationId: req.correlationId },
          req.correlationId
        );

        res.json({
          success: true,
          message: 'MFA enabled successfully',
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('MFA verification failed', {
          error: (error as Error).message,
          correlationId: req.correlationId,
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'MFA_VERIFICATION_FAILED',
            message: (error as Error).message,
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * POST /verify-token
   * Verify access token validity
   */
  router.post('/verify-token', authMiddleware.requireAuth(), async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          valid: true,
          userId: req.auth!.userId,
          email: req.auth!.email,
          roles: req.auth!.roles,
          permissions: req.auth!.permissions,
          sessionId: req.auth!.sessionId,
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        data: {
          valid: false,
        },
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token is invalid or expired',
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /permissions/check
   * Check if user has specific permission
   */
  router.get(
    '/permissions/check',
    [
      body('resource').isString().isLength({ min: 1 }).withMessage('Resource is required'),
      body('action').isString().isLength({ min: 1 }).withMessage('Action is required'),
      body('conditions').optional().isObject(),
    ],
    handleValidationErrors,
    authMiddleware.requireAuth(),
    async (req, res) => {
      try {
        // This would integrate with RbacService to check permissions
        res.json({
          success: true,
          data: {
            allowed: false, // Placeholder
            message: 'Permission check not implemented',
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: {
            code: 'PERMISSION_CHECK_FAILED',
            message: 'Failed to check permissions',
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // User management routes
  router.use('/users', userRoutes);

  return router;
}
