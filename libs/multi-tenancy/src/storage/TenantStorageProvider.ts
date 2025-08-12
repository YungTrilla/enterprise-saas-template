/**
 * Base Tenant Storage Provider
 *
 * Abstract base class for tenant storage implementations.
 * Provides common functionality and interface definition.
 */

import { ITenant } from '../types/tenant';
import { ITenantStorageProvider, ICacheEntry } from '../types/storage';

export abstract class TenantStorageProvider implements ITenantStorageProvider {
  protected cache = new Map<string, ICacheEntry<ITenant>>();
  protected cacheEnabled: boolean;
  protected cacheTtl: number;
  protected maxCacheEntries: number;

  constructor(
    options: {
      cacheEnabled?: boolean;
      cacheTtl?: number;
      maxCacheEntries?: number;
    } = {}
  ) {
    this.cacheEnabled = options.cacheEnabled ?? true;
    this.cacheTtl = options.cacheTtl ?? 300000; // 5 minutes
    this.maxCacheEntries = options.maxCacheEntries ?? 1000;
  }

  // Abstract methods to be implemented by concrete providers
  abstract getTenantById(tenantId: string): Promise<ITenant | null>;
  abstract getTenantBySlug(slug: string): Promise<ITenant | null>;
  abstract getTenantByDomain(domain: string): Promise<ITenant | null>;
  abstract getTenantBySubdomain(subdomain: string): Promise<ITenant | null>;
  abstract createTenant(tenant: Omit<ITenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<ITenant>;
  abstract updateTenant(tenantId: string, updates: Partial<ITenant>): Promise<ITenant | null>;
  abstract deleteTenant(tenantId: string): Promise<boolean>;
  abstract listTenants(options: {
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
  abstract healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>;

  /**
   * Cache tenant data
   */
  async cacheTenant(tenant: ITenant, ttlSeconds?: number): Promise<void> {
    if (!this.cacheEnabled) return;

    const ttl = (ttlSeconds || this.cacheTtl / 1000) * 1000;
    const now = Date.now();

    // Clean up expired entries if cache is full
    if (this.cache.size >= this.maxCacheEntries) {
      this.cleanupExpiredEntries();
    }

    // If still full, remove oldest entries
    if (this.cache.size >= this.maxCacheEntries) {
      this.removeOldestEntries(Math.floor(this.maxCacheEntries * 0.1));
    }

    const cacheEntry: ICacheEntry<ITenant> = {
      data: tenant,
      ttl,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    };

    // Cache by multiple keys for fast lookup
    this.cache.set(`id:${tenant.id}`, cacheEntry);
    this.cache.set(`slug:${tenant.slug}`, cacheEntry);

    if (tenant.domain) {
      this.cache.set(`domain:${tenant.domain}`, cacheEntry);
    }

    if (tenant.subdomain) {
      this.cache.set(`subdomain:${tenant.subdomain}`, cacheEntry);
    }
  }

  /**
   * Get cached tenant
   */
  async getCachedTenant(key: string): Promise<ITenant | null> {
    if (!this.cacheEnabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();

    // Check if expired
    if (now - entry.createdAt > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  /**
   * Clear tenant cache
   */
  async clearTenantCache(tenantId: string): Promise<void> {
    if (!this.cacheEnabled) return;

    // Find and remove all cache entries for this tenant
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.data.id === tenantId) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      tenantId: string;
      accessCount: number;
      age: number;
      ttl: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      tenantId: entry.data.id,
      accessCount: entry.accessCount,
      age: now - entry.createdAt,
      ttl: entry.ttl,
    }));

    // Calculate hit rate (simplified)
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const hitRate = entries.length > 0 ? totalAccesses / entries.length : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxCacheEntries,
      hitRate,
      entries,
    };
  }

  /**
   * Clean up expired cache entries
   */
  protected cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Remove oldest cache entries
   */
  protected removeOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
      .slice(0, count);

    for (const [key] of entries) {
      this.cache.delete(key);
    }
  }

  /**
   * Helper method to create cache key
   */
  protected createCacheKey(type: string, value: string): string {
    return `${type}:${value}`;
  }

  /**
   * Helper method to validate tenant data
   */
  protected validateTenant(tenant: Partial<ITenant>): void {
    if (!tenant.name || tenant.name.trim().length === 0) {
      throw new Error('Tenant name is required');
    }

    if (!tenant.slug || tenant.slug.trim().length === 0) {
      throw new Error('Tenant slug is required');
    }

    // Validate slug format
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(tenant.slug)) {
      throw new Error('Tenant slug must contain only lowercase letters, numbers, and hyphens');
    }

    if (tenant.slug.length < 3 || tenant.slug.length > 63) {
      throw new Error('Tenant slug must be between 3 and 63 characters');
    }

    if (tenant.slug.startsWith('-') || tenant.slug.endsWith('-')) {
      throw new Error('Tenant slug cannot start or end with a hyphen');
    }

    if (tenant.slug.includes('--')) {
      throw new Error('Tenant slug cannot contain consecutive hyphens');
    }
  }

  /**
   * Helper method to sanitize tenant data for storage
   */
  protected sanitizeTenant(tenant: Partial<ITenant>): Partial<ITenant> {
    const sanitized = { ...tenant };

    // Ensure slug is lowercase
    if (sanitized.slug) {
      sanitized.slug = sanitized.slug.toLowerCase();
    }

    // Ensure domain is lowercase
    if (sanitized.domain) {
      sanitized.domain = sanitized.domain.toLowerCase();
    }

    // Ensure subdomain is lowercase
    if (sanitized.subdomain) {
      sanitized.subdomain = sanitized.subdomain.toLowerCase();
    }

    return sanitized;
  }
}
