/**
 * Tenant Context Types
 */

import { ITenant, ITenantLimits, ITenantUsage } from './tenant';

export interface ITenantContext {
  tenant: ITenant;
  user?: ITenantUser;
  permissions: string[];
  limits: ITenantLimits;
  usage: ITenantUsage;
  isWithinLimits: (resource: keyof ITenantLimits) => boolean;
  canAccess: (feature: string) => boolean;
  getRemainingQuota: (resource: keyof ITenantLimits) => number;
  getUsagePercentage: (resource: keyof ITenantLimits) => number;
}

export interface ITenantUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: ITenantRole[];
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITenantRole {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ITenantSession {
  id: string;
  tenantId: string;
  userId: string;
  correlationId: string;
  ipAddress: string;
  userAgent: string;
  startedAt: string;
  lastActivityAt: string;
  expiresAt: string;
  metadata: Record<string, any>;
}

// Express request extension
declare global {
  namespace Express {
    interface Request {
      tenantContext?: ITenantContext;
      tenant?: ITenant;
      tenantUser?: ITenantUser;
    }
  }
}