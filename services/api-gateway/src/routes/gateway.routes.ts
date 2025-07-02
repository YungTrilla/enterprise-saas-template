/**
 * Gateway Routes
 * Main routing configuration for API Gateway
 */

import { Router } from 'express';
import { proxyService } from '../services/proxy.service';
import { GatewayAuthMiddleware } from '../middleware/auth.middleware';
import { validateRequest, commonSchemas } from '../middleware/request-validation.middleware';
import Joi from 'joi';

export function createGatewayRoutes(): Router {
  const router = Router();
  const authMiddleware = new GatewayAuthMiddleware();

  /**
   * Auth Service Routes (Public)
   * No authentication required for these endpoints
   */
  router.use('/auth/login', 
    validateRequest({
      body: Joi.object({
        email: commonSchemas.email.required(),
        password: Joi.string().required(),
        mfaCode: Joi.string().optional(),
        deviceFingerprint: Joi.string().optional()
      })
    }),
    proxyService.createServiceProxy('auth')
  );

  router.use('/auth/register',
    validateRequest({
      body: Joi.object({
        email: commonSchemas.email.required(),
        password: Joi.string().min(8).required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        timezone: Joi.string().optional(),
        locale: Joi.string().optional()
      })
    }),
    proxyService.createServiceProxy('auth')
  );

  router.use('/auth/refresh',
    validateRequest({
      body: Joi.object({
        refreshToken: Joi.string().required()
      })
    }),
    proxyService.createServiceProxy('auth')
  );

  /**
   * Auth Service Routes (Protected)
   * Require authentication
   */
  router.use('/auth/logout',
    authMiddleware.verifyToken(),
    proxyService.createServiceProxy('auth')
  );

  router.use('/auth/me',
    authMiddleware.verifyToken(),
    proxyService.createServiceProxy('auth')
  );

  router.use('/auth/mfa',
    authMiddleware.verifyToken(),
    proxyService.createServiceProxy('auth')
  );

  router.use('/auth/verify-token',
    authMiddleware.verifyToken(),
    proxyService.createServiceProxy('auth')
  );

  router.use('/auth/permissions',
    authMiddleware.verifyToken(),
    proxyService.createServiceProxy('auth')
  );

  /**
   * Example Service Routes
   * All require authentication
   */
  router.use('/api/v1/examples',
    authMiddleware.verifyToken(),
    proxyService.createServiceProxy('example', {
      preserveHeaders: ['x-user-id', 'x-user-roles', 'x-user-permissions']
    })
  );

  /**
   * Users Service Routes
   * All require authentication
   */
  router.use('/api/v1/users',
    authMiddleware.verifyToken(),
    proxyService.createServiceProxy('users', {
      preserveHeaders: ['x-user-id', 'x-user-roles', 'x-user-permissions']
    })
  );

  /**
   * Notifications Service Routes
   * All require authentication
   */
  router.use('/api/v1/notifications',
    authMiddleware.verifyToken(),
    proxyService.createServiceProxy('notification', {
      preserveHeaders: ['x-user-id', 'x-user-roles', 'x-user-permissions']
    })
  );

  /**
   * Admin Routes
   * Require admin role
   */
  router.use('/admin',
    authMiddleware.verifyToken(),
    authMiddleware.requireRoles(['admin', 'super-admin']),
    (req, res, next) => {
      // Route to appropriate admin service based on path
      const pathParts = req.path.split('/').filter(Boolean);
      
      if (pathParts.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Admin endpoint not found'
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString()
        });
      }

      const adminService = pathParts[0];
      
      // Map admin paths to services
      const serviceMap: { [key: string]: string } = {
        'users': 'auth',
        'roles': 'auth',
        'permissions': 'auth',
        'examples': 'example',
        'notifications': 'notification'
      };

      const targetService = serviceMap[adminService];
      
      if (!targetService) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Admin service ${adminService} not found`
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString()
        });
      }

      // Use proxy service for the mapped service
      proxyService.createServiceProxy(targetService, {
        preserveHeaders: ['x-user-id', 'x-user-roles', 'x-user-permissions'],
        transformRequest: (req) => {
          // Remove /admin/{service} prefix from path
          req.url = req.url.replace(/^\/admin\/[^\/]+/, '');
          return req.body;
        }
      })(req, res, next);
    }
  );

  /**
   * Catch-all route for undefined endpoints
   */
  router.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ENDPOINT_NOT_FOUND',
        message: 'The requested endpoint does not exist'
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  });

  return router;
}