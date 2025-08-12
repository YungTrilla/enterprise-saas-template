/**
 * Storage Provider Types
 */

import { ITenant } from './tenant';

export interface ITenantStorageProvider {
  /**
   * Get tenant by ID
   */
  getTenantById(tenantId: string): Promise<ITenant | null>;

  /**
   * Get tenant by slug
   */
  getTenantBySlug(slug: string): Promise<ITenant | null>;

  /**
   * Get tenant by domain
   */
  getTenantByDomain(domain: string): Promise<ITenant | null>;

  /**
   * Get tenant by subdomain
   */
  getTenantBySubdomain(subdomain: string): Promise<ITenant | null>;

  /**
   * Create new tenant
   */
  createTenant(tenant: Omit<ITenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<ITenant>;

  /**
   * Update existing tenant
   */
  updateTenant(tenantId: string, updates: Partial<ITenant>): Promise<ITenant | null>;

  /**
   * Delete tenant
   */
  deleteTenant(tenantId: string): Promise<boolean>;

  /**
   * List tenants with pagination
   */
  listTenants(options: {
    page?: number;
    limit?: number;
    filter?: Record<string, any>;
    sort?: { field: string; order: 'asc' | 'desc' };
  }): Promise<{
    data: ITenant[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;

  /**
   * Cache tenant data
   */
  cacheTenant(tenant: ITenant, ttlSeconds?: number): Promise<void>;

  /**
   * Get cached tenant
   */
  getCachedTenant(tenantId: string): Promise<ITenant | null>;

  /**
   * Clear tenant cache
   */
  clearTenantCache(tenantId: string): Promise<void>;

  /**
   * Health check
   */
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>;
}

export interface IStorageConfig {
  // Database configuration
  database?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
    connectionTimeoutMs: number;
  };

  // Redis configuration
  redis?: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    ttl: number;
  };

  // Cache configuration
  cache?: {
    enabled: boolean;
    ttl: number;
    maxEntries: number;
  };
}

export interface ICacheEntry<T> {
  data: T;
  ttl: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface IStorageMetrics {
  totalTenants: number;
  activeTenants: number;
  cacheHitRate: number;
  averageResponseTime: number;
  errorRate: number;
  lastUpdated: string;
}
