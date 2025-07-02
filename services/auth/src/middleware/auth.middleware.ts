/**
 * Authentication Middleware
 * Express middleware for JWT validation and user context
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/auth.service';
import { JwtService } from '../services/jwt.service';
import { RbacService } from '../services/rbac.service';
import { IAuthContext, IPermissionCheck } from '../types/auth';
import { CorrelationId } from '@abyss/shared-types';
import { CorrelatedLogger, SecurityLogger } from '../utils/logger';

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      auth?: IAuthContext;
      correlationId: CorrelationId;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;
  private jwtService: JwtService;
  private rbacService: RbacService;
  private logger: CorrelatedLogger;
  private securityLogger: SecurityLogger;

  constructor(
    authService: AuthService,
    jwtService: JwtService,
    rbacService: RbacService
  ) {
    this.authService = authService;
    this.jwtService = jwtService;
    this.rbacService = rbacService;
    this.logger = new CorrelatedLogger('auth-middleware');
    this.securityLogger = new SecurityLogger();
  }

  /**
   * Add correlation ID to all requests
   */
  correlationId() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Get correlation ID from header or generate new one
      req.correlationId = (req.headers['x-correlation-id'] as CorrelationId) || 
                         uuidv4() as CorrelationId;
      
      // Add to response header
      res.setHeader('x-correlation-id', req.correlationId);
      
      next();
    };
  }

  /**
   * Authenticate user and add auth context to request
   */
  authenticate(optional: boolean = false) {
    return async (req: Request, res: Response, next: NextFunction) => {
      this.logger.setCorrelationId(req.correlationId);

      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = this.jwtService.extractTokenFromHeader(authHeader);

        if (!token) {
          if (optional) {
            return next(); // Continue without auth context
          }
          
          return this.handleAuthError(
            req,
            res,
            'Missing or invalid authorization header',
            401
          );
        }

        // Get auth context from token
        const authContext = await this.authService.getAuthContext(token, req.correlationId);
        
        // Add auth context to request
        req.auth = authContext;

        this.logger.debug('User authenticated successfully', {
          userId: authContext.userId,
          email: authContext.email,
          roles: authContext.roles,
          sessionId: authContext.sessionId
        });

        next();

      } catch (error) {
        const errorMessage = (error as Error).message;
        
        this.securityLogger.logSecurityEvent(
          'INVALID_TOKEN',
          'MEDIUM',
          `Authentication failed: ${errorMessage}`,
          {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path
          },
          req.correlationId
        );

        if (optional) {
          return next(); // Continue without auth context
        }

        return this.handleAuthError(req, res, errorMessage, 401);
      }
    };
  }

  /**
   * Require authentication (convenience method)
   */
  requireAuth() {
    return this.authenticate(false);
  }

  /**
   * Optional authentication (convenience method)
   */
  optionalAuth() {
    return this.authenticate(true);
  }

  /**
   * Require specific roles
   */
  requireRoles(requiredRoles: string[], requireAll: boolean = false) {
    return async (req: Request, res: Response, next: NextFunction) => {
      this.logger.setCorrelationId(req.correlationId);

      try {
        if (!req.auth) {
          return this.handleAuthError(req, res, 'Authentication required', 401);
        }

        const hasRequiredRoles = requireAll
          ? await this.rbacService.hasAllRoles(req.auth.userId, requiredRoles, req.correlationId)
          : await this.rbacService.hasAnyRole(req.auth.userId, requiredRoles, req.correlationId);

        if (!hasRequiredRoles) {
          this.securityLogger.logSecurityEvent(
            'UNAUTHORIZED_ACCESS',
            'HIGH',
            `Insufficient roles for ${req.path}`,
            {
              userId: req.auth.userId,
              requiredRoles,
              userRoles: req.auth.roles,
              requireAll,
              ip: req.ip,
              endpoint: req.path
            },
            req.correlationId
          );

          return this.handleAuthError(
            req,
            res,
            `Insufficient roles. Required: ${requiredRoles.join(requireAll ? ' AND ' : ' OR ')}`,
            403
          );
        }

        this.logger.debug('Role check passed', {
          userId: req.auth.userId,
          requiredRoles,
          userRoles: req.auth.roles,
          requireAll
        });

        next();

      } catch (error) {
        this.logger.error('Role check failed', {
          userId: req.auth?.userId,
          requiredRoles,
          error: (error as Error).message
        });

        return this.handleAuthError(req, res, 'Role verification failed', 500);
      }
    };
  }

  /**
   * Require specific permissions
   */
  requirePermissions(permissionChecks: IPermissionCheck[] | IPermissionCheck, requireAll: boolean = true) {
    const checks = Array.isArray(permissionChecks) ? permissionChecks : [permissionChecks];

    return async (req: Request, res: Response, next: NextFunction) => {
      this.logger.setCorrelationId(req.correlationId);

      try {
        if (!req.auth) {
          return this.handleAuthError(req, res, 'Authentication required', 401);
        }

        const permissionResults = await Promise.all(
          checks.map(check => 
            this.rbacService.hasPermission(req.auth!.userId, check, req.correlationId)
          )
        );

        const hasPermissions = requireAll
          ? permissionResults.every(result => result.allowed)
          : permissionResults.some(result => result.allowed);

        if (!hasPermissions) {
          const deniedChecks = permissionResults
            .filter((result, index) => !result.allowed)
            .map((result, index) => ({
              check: checks[index],
              reason: result.reason
            }));

          this.securityLogger.logSecurityEvent(
            'UNAUTHORIZED_ACCESS',
            'HIGH',
            `Insufficient permissions for ${req.path}`,
            {
              userId: req.auth.userId,
              requiredPermissions: checks,
              deniedChecks,
              userPermissions: req.auth.permissions,
              ip: req.ip,
              endpoint: req.path
            },
            req.correlationId
          );

          return this.handleAuthError(
            req,
            res,
            `Insufficient permissions. Required: ${checks.map(c => `${c.resource}:${c.action}`).join(requireAll ? ' AND ' : ' OR ')}`,
            403
          );
        }

        this.logger.debug('Permission check passed', {
          userId: req.auth.userId,
          requiredPermissions: checks,
          userPermissions: req.auth.permissions
        });

        next();

      } catch (error) {
        this.logger.error('Permission check failed', {
          userId: req.auth?.userId,
          requiredPermissions: checks,
          error: (error as Error).message
        });

        return this.handleAuthError(req, res, 'Permission verification failed', 500);
      }
    };
  }

  /**
   * Require admin role (convenience method)
   */
  requireAdmin() {
    return this.requireRoles(['admin']);
  }

  /**
   * Require user to be the owner of the resource or admin
   */
  requireOwnershipOrAdmin(userIdParam: string = 'userId') {
    return async (req: Request, res: Response, next: NextFunction) => {
      this.logger.setCorrelationId(req.correlationId);

      try {
        if (!req.auth) {
          return this.handleAuthError(req, res, 'Authentication required', 401);
        }

        const resourceUserId = req.params[userIdParam];
        const isOwner = req.auth.userId === resourceUserId;
        const isAdmin = await this.rbacService.hasAnyRole(
          req.auth.userId,
          ['admin', 'super-admin'],
          req.correlationId
        );

        if (!isOwner && !isAdmin) {
          this.securityLogger.logSecurityEvent(
            'UNAUTHORIZED_ACCESS',
            'HIGH',
            `Attempted access to resource belonging to another user`,
            {
              userId: req.auth.userId,
              resourceUserId,
              endpoint: req.path,
              ip: req.ip
            },
            req.correlationId
          );

          return this.handleAuthError(
            req,
            res,
            'You can only access your own resources',
            403
          );
        }

        this.logger.debug('Ownership check passed', {
          userId: req.auth.userId,
          resourceUserId,
          isOwner,
          isAdmin
        });

        next();

      } catch (error) {
        this.logger.error('Ownership check failed', {
          userId: req.auth?.userId,
          userIdParam,
          error: (error as Error).message
        });

        return this.handleAuthError(req, res, 'Ownership verification failed', 500);
      }
    };
  }

  /**
   * Rate limiting middleware
   */
  rateLimit(windowMs: number, maxRequests: number, message?: string) {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.auth?.userId || req.ip;
      const now = Date.now();
      const resetTime = Math.floor(now / windowMs) * windowMs + windowMs;

      if (!requests.has(key)) {
        requests.set(key, { count: 1, resetTime });
        return next();
      }

      const requestData = requests.get(key)!;

      // Reset counter if window has passed
      if (now >= requestData.resetTime) {
        requests.set(key, { count: 1, resetTime });
        return next();
      }

      // Check if limit exceeded
      if (requestData.count >= maxRequests) {
        this.securityLogger.logSecurityEvent(
          'BRUTE_FORCE_ATTEMPT',
          'HIGH',
          'Rate limit exceeded',
          {
            userId: req.auth?.userId,
            ip: req.ip,
            endpoint: req.path,
            requestCount: requestData.count,
            windowMs,
            maxRequests
          },
          req.correlationId
        );

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: message || 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString()
        });
      }

      // Increment counter
      requestData.count++;
      requests.set(key, requestData);

      next();
    };
  }

  /**
   * Handle authentication/authorization errors
   */
  private handleAuthError(req: Request, res: Response, message: string, statusCode: number) {
    this.logger.warn('Authentication/authorization failed', {
      message,
      statusCode,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 401 ? 'AUTHENTICATION_REQUIRED' : 'AUTHORIZATION_FAILED',
        message
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
}

// Export convenience middleware functions
let authMiddlewareInstance: AuthMiddleware;

export function initializeAuthMiddleware(
  authService: AuthService,
  jwtService: JwtService,
  rbacService: RbacService
) {
  authMiddlewareInstance = new AuthMiddleware(authService, jwtService, rbacService);
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  if (!authMiddlewareInstance) {
    throw new Error('Auth middleware not initialized');
  }
  return authMiddlewareInstance.requireAuth()(req, res, next);
}

export function authorize(permissions: string[]) {
  if (!authMiddlewareInstance) {
    throw new Error('Auth middleware not initialized');
  }
  
  // Convert string permissions to IPermissionCheck format
  const permissionChecks = permissions.map(perm => {
    const [resource, action] = perm.split(':');
    return { resource, action };
  });
  
  return authMiddlewareInstance.requirePermissions(permissionChecks);
}