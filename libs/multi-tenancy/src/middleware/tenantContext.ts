/**
 * Tenant Context Middleware
 *
 * Creates and manages tenant context throughout the request lifecycle.
 * Provides utilities for checking permissions, limits, and usage.
 */

import { Request, Response, NextFunction } from 'express';
import { ITenantContext, ITenantUser } from '../types/context';
import { ITenant, ITenantLimits, ITenantUsage } from '../types/tenant';
import { ApiError } from '@template/shared-utils';

export interface TenantContextOptions {
  loadUser?: boolean;
  loadPermissions?: boolean;
  loadUsage?: boolean;
  getUserFromRequest?: (req: Request) => Promise<ITenantUser | null>;
  getPermissionsForUser?: (user: ITenantUser, tenant: ITenant) => Promise<string[]>;
  getUsageForTenant?: (tenant: ITenant) => Promise<ITenantUsage>;
}

/**
 * Creates tenant context middleware
 */
export function createTenantContextMiddleware(options: TenantContextOptions = {}) {
  const {
    loadUser = true,
    loadPermissions = true,
    loadUsage = true,
    getUserFromRequest,
    getPermissionsForUser,
    getUsageForTenant,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Tenant must be resolved first
      if (!req.tenant) {
        return next();
      }

      const tenant = req.tenant;
      let user: ITenantUser | null = null;
      let permissions: string[] = [];
      let usage: ITenantUsage = createDefaultUsage();

      // Load user if requested and function provided
      if (loadUser && getUserFromRequest) {
        user = await getUserFromRequest(req);
        req.tenantUser = user;
      }

      // Load permissions if requested and user exists
      if (loadPermissions && user && getPermissionsForUser) {
        permissions = await getPermissionsForUser(user, tenant);
      }

      // Load usage if requested
      if (loadUsage && getUsageForTenant) {
        usage = await getUsageForTenant(tenant);
      }

      // Create tenant context
      const context: ITenantContext = {
        tenant,
        user: user || undefined,
        permissions,
        limits: tenant.limits,
        usage,

        isWithinLimits: (resource: keyof ITenantLimits) => {
          return usage[resource] < tenant.limits[resource];
        },

        canAccess: (feature: string) => {
          return tenant.features.includes(feature) || permissions.includes(feature);
        },

        getRemainingQuota: (resource: keyof ITenantLimits) => {
          return Math.max(0, tenant.limits[resource] - usage[resource]);
        },

        getUsagePercentage: (resource: keyof ITenantLimits) => {
          if (tenant.limits[resource] === 0) return 0;
          return Math.min(100, (usage[resource] / tenant.limits[resource]) * 100);
        },
      };

      req.tenantContext = context;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to require tenant context
 */
export function requireTenantContext() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantContext) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_CONTEXT_MISSING',
          message: 'Tenant context is required but not available',
        },
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };
}

/**
 * Middleware to require authenticated tenant user
 */
export function requireTenantUser() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantContext?.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TENANT_USER_REQUIRED',
          message: 'Authenticated tenant user is required',
        },
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };
}

/**
 * Middleware to check tenant feature access
 */
export function requireTenantFeature(feature: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantContext) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_CONTEXT_MISSING',
          message: 'Tenant context is required for feature check',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!req.tenantContext.canAccess(feature)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: `Feature '${feature}' is not available for this tenant`,
          details: {
            feature,
            availableFeatures: req.tenantContext.tenant.features,
            userPermissions: req.tenantContext.permissions,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Middleware to check user permissions
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantContext) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_CONTEXT_MISSING',
          message: 'Tenant context is required for permission check',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!req.tenantContext.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required for permission check',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!req.tenantContext.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Permission '${permission}' is required`,
          details: {
            required: permission,
            userPermissions: req.tenantContext.permissions,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Middleware to check multiple permissions (any of them)
 */
export function requireAnyPermission(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantContext) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_CONTEXT_MISSING',
          message: 'Tenant context is required for permission check',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!req.tenantContext.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required for permission check',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const hasPermission = permissions.some(permission =>
      req.tenantContext!.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `One of the following permissions is required: ${permissions.join(', ')}`,
          details: {
            required: permissions,
            userPermissions: req.tenantContext.permissions,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Middleware to check multiple permissions (all of them)
 */
export function requireAllPermissions(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantContext) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_CONTEXT_MISSING',
          message: 'Tenant context is required for permission check',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!req.tenantContext.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required for permission check',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const missingPermissions = permissions.filter(
      permission => !req.tenantContext!.permissions.includes(permission)
    );

    if (missingPermissions.length > 0) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Missing required permissions: ${missingPermissions.join(', ')}`,
          details: {
            required: permissions,
            missing: missingPermissions,
            userPermissions: req.tenantContext.permissions,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Create default usage object
 */
function createDefaultUsage(): ITenantUsage {
  return {
    users: 0,
    storage: 0,
    apiCalls: 0,
    bandwidth: 0,
    projects: 0,
    customFields: 0,
    webhooks: 0,
    integrations: 0,
    lastUpdated: new Date().toISOString(),
  };
}
