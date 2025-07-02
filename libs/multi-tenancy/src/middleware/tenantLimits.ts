/**
 * Tenant Limits Middleware
 * 
 * Enforces tenant limits and quotas to prevent resource abuse
 * and ensure fair usage across all tenants.
 */

import { Request, Response, NextFunction } from 'express';
import { ITenantLimits, ITenantUsage } from '../types/tenant';

export interface TenantLimitsOptions {
  updateUsage?: boolean;
  updateUsageFunction?: (req: Request, resource: keyof ITenantLimits, amount: number) => Promise<void>;
  onLimitExceeded?: (req: Request, resource: keyof ITenantLimits, current: number, limit: number) => void;
  grace?: {
    enabled: boolean;
    percentage: number; // Allow up to this percentage over limit
  };
}

/**
 * Middleware to check if tenant is within specified resource limit
 */
export function checkTenantLimit(
  resource: keyof ITenantLimits,
  amount: number = 1,
  options: TenantLimitsOptions = {}
) {
  const {
    updateUsage = false,
    updateUsageFunction,
    onLimitExceeded,
    grace = { enabled: false, percentage: 0 }
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.tenantContext) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_MISSING',
            message: 'Tenant context is required for limit check'
          },
          timestamp: new Date().toISOString()
        });
      }

      const { limits, usage } = req.tenantContext;
      const currentUsage = usage[resource];
      const limit = limits[resource];
      const wouldExceed = (currentUsage + amount) > limit;

      // Check if grace period applies
      let allowWithGrace = false;
      if (grace.enabled && wouldExceed) {
        const graceLimit = limit + (limit * grace.percentage / 100);
        allowWithGrace = (currentUsage + amount) <= graceLimit;
      }

      if (wouldExceed && !allowWithGrace) {
        // Call limit exceeded callback if provided
        if (onLimitExceeded) {
          onLimitExceeded(req, resource, currentUsage, limit);
        }

        return res.status(429).json({
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: `${resource} limit exceeded`,
            details: {
              resource,
              current: currentUsage,
              limit,
              requested: amount,
              wouldBe: currentUsage + amount,
              remaining: Math.max(0, limit - currentUsage)
            }
          },
          timestamp: new Date().toISOString()
        });
      }

      // Update usage if requested and function provided
      if (updateUsage && updateUsageFunction) {
        await updateUsageFunction(req, resource, amount);
      }

      // Add usage info to response headers for monitoring
      res.setHeader('X-Resource-Usage', currentUsage.toString());
      res.setHeader('X-Resource-Limit', limit.toString());
      res.setHeader('X-Resource-Remaining', Math.max(0, limit - currentUsage).toString());

      if (allowWithGrace) {
        res.setHeader('X-Grace-Applied', 'true');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check multiple resource limits
 */
export function checkTenantLimits(
  checks: Array<{ resource: keyof ITenantLimits; amount: number }>,
  options: TenantLimitsOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.tenantContext) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_MISSING',
            message: 'Tenant context is required for limit check'
          },
          timestamp: new Date().toISOString()
        });
      }

      const { limits, usage } = req.tenantContext;
      const violations: Array<{
        resource: keyof ITenantLimits;
        current: number;
        limit: number;
        requested: number;
        wouldBe: number;
      }> = [];

      // Check all limits first
      for (const check of checks) {
        const { resource, amount } = check;
        const currentUsage = usage[resource];
        const limit = limits[resource];
        const wouldExceed = (currentUsage + amount) > limit;

        if (wouldExceed) {
          violations.push({
            resource,
            current: currentUsage,
            limit,
            requested: amount,
            wouldBe: currentUsage + amount
          });
        }
      }

      if (violations.length > 0) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'MULTIPLE_LIMITS_EXCEEDED',
            message: 'Multiple resource limits would be exceeded',
            details: { violations }
          },
          timestamp: new Date().toISOString()
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to track API call usage
 */
export function trackApiUsage(options: TenantLimitsOptions = {}) {
  return checkTenantLimit('apiCalls', 1, {
    ...options,
    updateUsage: true
  });
}

/**
 * Middleware to track storage usage
 */
export function trackStorageUsage(sizeInBytes: number, options: TenantLimitsOptions = {}) {
  return checkTenantLimit('storage', sizeInBytes, {
    ...options,
    updateUsage: true
  });
}

/**
 * Middleware to track bandwidth usage
 */
export function trackBandwidthUsage(options: TenantLimitsOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Estimate request size
    const requestSize = estimateRequestSize(req);
    
    // Track request bandwidth
    const checkRequest = checkTenantLimit('bandwidth', requestSize, options);
    await new Promise<void>((resolve, reject) => {
      checkRequest(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    // Track response bandwidth
    const originalSend = res.send;
    res.send = function(body: any) {
      const responseSize = estimateResponseSize(body);
      
      // Track response bandwidth (async, don't block response)
      if (options.updateUsageFunction) {
        options.updateUsageFunction(req, 'bandwidth', responseSize).catch(console.error);
      }
      
      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Middleware to check user limit before creating new users
 */
export function checkUserLimit(options: TenantLimitsOptions = {}) {
  return checkTenantLimit('users', 1, options);
}

/**
 * Middleware to check project limit before creating new projects
 */
export function checkProjectLimit(options: TenantLimitsOptions = {}) {
  return checkTenantLimit('projects', 1, options);
}

/**
 * Middleware to check webhook limit before creating new webhooks
 */
export function checkWebhookLimit(options: TenantLimitsOptions = {}) {
  return checkTenantLimit('webhooks', 1, options);
}

/**
 * Middleware to check integration limit before adding new integrations
 */
export function checkIntegrationLimit(options: TenantLimitsOptions = {}) {
  return checkTenantLimit('integrations', 1, options);
}

/**
 * Utility function to get current usage percentage for a resource
 */
export function getUsagePercentage(usage: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, (usage / limit) * 100);
}

/**
 * Utility function to check if usage is approaching limit
 */
export function isApproachingLimit(usage: number, limit: number, threshold: number = 80): boolean {
  return getUsagePercentage(usage, limit) >= threshold;
}

/**
 * Estimate request size in bytes
 */
function estimateRequestSize(req: Request): number {
  let size = 0;
  
  // Headers
  if (req.headers) {
    size += JSON.stringify(req.headers).length;
  }
  
  // Body
  if (req.body) {
    size += JSON.stringify(req.body).length;
  }
  
  // Query parameters
  if (req.query) {
    size += JSON.stringify(req.query).length;
  }
  
  // URL
  if (req.url) {
    size += req.url.length;
  }
  
  return size;
}

/**
 * Estimate response size in bytes
 */
function estimateResponseSize(body: any): number {
  if (!body) return 0;
  
  if (typeof body === 'string') {
    return body.length;
  }
  
  if (Buffer.isBuffer(body)) {
    return body.length;
  }
  
  try {
    return JSON.stringify(body).length;
  } catch {
    return 0;
  }
}