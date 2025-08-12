/**
 * Multi-Tenancy Library
 *
 * Provides middleware, utilities, and services for implementing
 * multi-tenant architecture in the Enterprise SaaS Template.
 *
 * Features:
 * - Tenant identification from subdomain, domain, or header
 * - Tenant context management throughout request lifecycle
 * - Database connection per tenant
 * - Tenant-aware caching
 * - Usage tracking and limits enforcement
 * - Tenant provisioning and management
 */

// Core exports
export * from './middleware/tenantResolver';
export * from './middleware/tenantContext';
export * from './middleware/tenantLimits';

// Services
export * from './services/TenantService';
export * from './services/TenantProvisioningService';
export * from './services/TenantUsageService';

// Storage providers
export * from './storage/TenantStorageProvider';
export * from './storage/RedisStorageProvider';
export * from './storage/DatabaseStorageProvider';

// Types and interfaces
export * from './types/tenant';
export * from './types/context';
export * from './types/storage';

// Utilities
export * from './utils/tenantExtractor';
export * from './utils/tenantValidator';
export * from './utils/databaseRouter';

// Configuration
export * from './config/multiTenancyConfig';
