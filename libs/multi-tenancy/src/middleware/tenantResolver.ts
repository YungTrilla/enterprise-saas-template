/**
 * Tenant Resolver Middleware
 * 
 * Resolves tenant information from request based on configured strategy:
 * - Subdomain (app.example.com)
 * - Domain (custom-domain.com)  
 * - Header (X-Tenant-ID)
 * - Path (/tenant/:slug)
 * - Query parameter (?tenant=slug)
 */

import { Request, Response, NextFunction } from 'express';
import { ITenantStorageProvider } from '../types/storage';
import { ITenant, TenantResolutionStrategy } from '../types/tenant';
import { ApiError } from '@template/shared-utils';
import { extractTenantFromRequest } from '../utils/tenantExtractor';

export interface TenantResolverOptions {
  storageProvider: ITenantStorageProvider;
  strategy: TenantResolutionStrategy | TenantResolutionStrategy[];
  headerName?: string;
  queryParam?: string;
  pathPattern?: string;
  required?: boolean;
  cache?: {
    enabled: boolean;
    ttl: number;
  };
  onTenantNotFound?: (req: Request, identifier: string) => Promise<ITenant | null>;
  onError?: (error: Error, req: Request) => void;
}

export function createTenantResolverMiddleware(options: TenantResolverOptions) {
  const {
    storageProvider,
    strategy,
    headerName = 'X-Tenant-ID',
    queryParam = 'tenant',
    pathPattern = '/tenant/:slug',
    required = true,
    cache = { enabled: true, ttl: 300 },
    onTenantNotFound,
    onError
  } = options;

  const strategies = Array.isArray(strategy) ? strategy : [strategy];

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let tenant: ITenant | null = null;
      let identifier: string | null = null;

      // Try each strategy until we find a tenant
      for (const currentStrategy of strategies) {
        const extractedIdentifier = extractTenantFromRequest(req, {
          strategy: currentStrategy,
          headerName,
          queryParam,
          pathPattern
        });

        if (extractedIdentifier) {
          identifier = extractedIdentifier;
          tenant = await resolveTenant(storageProvider, currentStrategy, identifier, cache);
          
          if (tenant) {
            break;
          }
        }
      }

      // Try custom resolver if tenant not found but identifier exists
      if (!tenant && identifier && onTenantNotFound) {
        tenant = await onTenantNotFound(req, identifier);
      }

      // Handle tenant not found
      if (!tenant && required) {
        throw new ApiError(
          'TENANT_NOT_FOUND',
          'Tenant not found or not accessible',
          404,
          { identifier, strategies: strategies.join(', ') }
        );
      }

      // Attach tenant to request
      if (tenant) {
        req.tenant = tenant;
        
        // Add tenant info to response headers for debugging (development only)
        if (process.env.NODE_ENV === 'development') {
          res.setHeader('X-Tenant-ID', tenant.id);
          res.setHeader('X-Tenant-Slug', tenant.slug);
        }
      }

      next();
    } catch (error) {
      if (onError) {
        onError(error as Error, req);
      }
      
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          },
          timestamp: new Date().toISOString()
        });
      }

      next(error);
    }
  };
}

async function resolveTenant(
  storageProvider: ITenantStorageProvider,
  strategy: TenantResolutionStrategy,
  identifier: string,
  cache: { enabled: boolean; ttl: number }
): Promise<ITenant | null> {
  // Try cache first if enabled
  if (cache.enabled) {
    try {
      const cached = await storageProvider.getCachedTenant(identifier);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.warn('Cache lookup failed:', error);
    }
  }

  let tenant: ITenant | null = null;

  // Resolve tenant based on strategy
  switch (strategy) {
    case TenantResolutionStrategy.SUBDOMAIN:
      tenant = await storageProvider.getTenantBySubdomain(identifier);
      break;
    case TenantResolutionStrategy.DOMAIN:
      tenant = await storageProvider.getTenantByDomain(identifier);
      break;
    case TenantResolutionStrategy.HEADER:
    case TenantResolutionStrategy.PATH:
    case TenantResolutionStrategy.QUERY_PARAM:
      // For these strategies, identifier could be ID or slug
      tenant = await storageProvider.getTenantById(identifier);
      if (!tenant) {
        tenant = await storageProvider.getTenantBySlug(identifier);
      }
      break;
  }

  // Cache the result if found and caching is enabled
  if (tenant && cache.enabled) {
    try {
      await storageProvider.cacheTenant(tenant, cache.ttl);
    } catch (error) {
      console.warn('Failed to cache tenant:', error);
    }
  }

  return tenant;
}

/**
 * Middleware to require tenant resolution
 * Use this after tenantResolver to ensure tenant is present
 */
export function requireTenant() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant identification is required for this endpoint'
        },
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
}

/**
 * Middleware to check tenant status
 */
export function checkTenantStatus(allowedStatuses: string[] = ['ACTIVE']) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return next();
    }

    if (!allowedStatuses.includes(req.tenant.status)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_INACTIVE',
          message: `Tenant is ${req.tenant.status.toLowerCase()} and cannot access this resource`,
          details: { status: req.tenant.status, allowedStatuses }
        },
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}