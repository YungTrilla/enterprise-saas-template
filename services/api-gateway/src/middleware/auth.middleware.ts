/**
 * Authentication Middleware for API Gateway
 * Validates JWT tokens and forwards auth context
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { getServiceRegistry } from '../config';
import { createLogger } from '../utils/logger';

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        roles: string[];
        permissions: string[];
        sessionId: string;
      };
    }
  }
}

export class GatewayAuthMiddleware {
  private logger = createLogger('gateway-auth-middleware');
  private authServiceUrl: string;

  constructor() {
    const serviceRegistry = getServiceRegistry();
    this.authServiceUrl = serviceRegistry.auth.url;
  }

  /**
   * Verify JWT token with auth service
   */
  async verifyToken() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Skip auth for health checks and public endpoints
      if (this.isPublicEndpoint(req.path)) {
        return next();
      }

      try {
        const token = this.extractToken(req);
        
        if (!token) {
          return this.handleAuthError(
            res,
            'Missing authentication token',
            401,
            req.correlationId
          );
        }

        // Verify token with auth service
        const response = await axios.post(
          `${this.authServiceUrl}/api/v1/verify-token`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Correlation-ID': req.correlationId
            },
            timeout: 5000,
            validateStatus: () => true
          }
        );

        if (response.status !== 200 || !response.data.success) {
          return this.handleAuthError(
            res,
            'Invalid or expired token',
            401,
            req.correlationId
          );
        }

        // Add auth context to request
        req.auth = response.data.data;

        // Forward auth headers for downstream services
        req.headers['x-user-id'] = req.auth.userId;
        req.headers['x-user-email'] = req.auth.email;
        req.headers['x-user-roles'] = req.auth.roles.join(',');
        req.headers['x-user-permissions'] = req.auth.permissions.join(',');
        req.headers['x-session-id'] = req.auth.sessionId;

        this.logger.debug('Token verified successfully', {
          userId: req.auth.userId,
          correlationId: req.correlationId
        });

        next();

      } catch (error) {
        this.logger.error('Token verification failed', {
          error: (error as Error).message,
          correlationId: req.correlationId
        });

        if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
          return res.status(503).json({
            success: false,
            error: {
              code: 'AUTH_SERVICE_UNAVAILABLE',
              message: 'Authentication service is temporarily unavailable'
            },
            correlationId: req.correlationId,
            timestamp: new Date().toISOString()
          });
        }

        return this.handleAuthError(
          res,
          'Authentication failed',
          500,
          req.correlationId
        );
      }
    };
  }

  /**
   * Check if user has required roles
   */
  requireRoles(requiredRoles: string[], requireAll: boolean = false) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.auth) {
        return this.handleAuthError(
          res,
          'Authentication required',
          401,
          req.correlationId
        );
      }

      const hasRequiredRoles = requireAll
        ? requiredRoles.every(role => req.auth!.roles.includes(role))
        : requiredRoles.some(role => req.auth!.roles.includes(role));

      if (!hasRequiredRoles) {
        this.logger.warn('Insufficient roles', {
          userId: req.auth.userId,
          requiredRoles,
          userRoles: req.auth.roles,
          correlationId: req.correlationId
        });

        return this.handleAuthError(
          res,
          `Insufficient roles. Required: ${requiredRoles.join(requireAll ? ' AND ' : ' OR ')}`,
          403,
          req.correlationId
        );
      }

      next();
    };
  }

  /**
   * Check if user has required permissions
   */
  requirePermissions(requiredPermissions: string[], requireAll: boolean = true) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.auth) {
        return this.handleAuthError(
          res,
          'Authentication required',
          401,
          req.correlationId
        );
      }

      const hasRequiredPermissions = requireAll
        ? requiredPermissions.every(permission => req.auth!.permissions.includes(permission))
        : requiredPermissions.some(permission => req.auth!.permissions.includes(permission));

      if (!hasRequiredPermissions) {
        this.logger.warn('Insufficient permissions', {
          userId: req.auth.userId,
          requiredPermissions,
          userPermissions: req.auth.permissions,
          correlationId: req.correlationId
        });

        return this.handleAuthError(
          res,
          `Insufficient permissions. Required: ${requiredPermissions.join(requireAll ? ' AND ' : ' OR ')}`,
          403,
          req.correlationId
        );
      }

      next();
    };
  }

  /**
   * Extract token from request
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check for token in cookie (if needed)
    if (req.cookies && req.cookies.access_token) {
      return req.cookies.access_token;
    }

    return null;
  }

  /**
   * Check if endpoint is public (no auth required)
   */
  private isPublicEndpoint(path: string): boolean {
    const publicPaths = [
      '/health',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/refresh',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/docs',
      '/api/v1/openapi.json'
    ];

    return publicPaths.some(publicPath => 
      path === publicPath || path.startsWith(publicPath + '/')
    );
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(
    res: Response,
    message: string,
    statusCode: number,
    correlationId: string
  ): void {
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 401 ? 'AUTHENTICATION_REQUIRED' : 'AUTHORIZATION_FAILED',
        message
      },
      correlationId,
      timestamp: new Date().toISOString()
    });
  }
}