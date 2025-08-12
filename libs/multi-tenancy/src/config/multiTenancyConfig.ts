/**
 * Multi-Tenancy Configuration
 *
 * Configuration options for the multi-tenancy system
 */

import { TenantResolutionStrategy, TenantPlan } from '../types/tenant';

export interface IMultiTenancyConfig {
  // Resolution strategy configuration
  resolution: {
    strategies: TenantResolutionStrategy[];
    headerName: string;
    queryParam: string;
    pathPattern: string;
    required: boolean;
    fallbackToDefault: boolean;
    defaultTenantId?: string;
  };

  // Caching configuration
  cache: {
    enabled: boolean;
    ttl: number; // seconds
    maxEntries: number;
    provider: 'memory' | 'redis';
  };

  // Storage configuration
  storage: {
    provider: 'database' | 'redis' | 'hybrid';
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
    redis?: {
      host: string;
      port: number;
      password?: string;
      db: number;
      keyPrefix: string;
    };
  };

  // Default tenant limits by plan
  defaultLimits: Record<
    TenantPlan,
    {
      users: number;
      storage: number; // bytes
      apiCalls: number; // per month
      bandwidth: number; // bytes per month
      projects: number;
      customFields: number;
      webhooks: number;
      integrations: number;
    }
  >;

  // Default tenant features by plan
  defaultFeatures: Record<TenantPlan, string[]>;

  // Default tenant settings
  defaultSettings: {
    branding: {
      primaryColor: string;
      secondaryColor: string;
    };
    locale: {
      language: string;
      timezone: string;
      currency: string;
      dateFormat: string;
      numberFormat: string;
    };
    security: {
      passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSymbols: boolean;
        maxAge: number; // days
      };
      sessionTimeout: number; // minutes
      mfaRequired: boolean;
    };
    features: {
      apiAccess: boolean;
      webhooks: boolean;
      customFields: boolean;
      advancedReporting: boolean;
    };
  };

  // Usage tracking configuration
  usage: {
    enabled: boolean;
    updateInterval: number; // seconds
    aggregationInterval: number; // seconds
    retentionDays: number;
  };

  // Provisioning configuration
  provisioning: {
    autoProvision: boolean;
    requireApproval: boolean;
    defaultPlan: TenantPlan;
    createAdminUser: boolean;
    sendWelcomeEmail: boolean;
    setupTasks: string[];
  };

  // Limits enforcement configuration
  limits: {
    enforceStrict: boolean;
    gracePeriodPercentage: number;
    warningThresholds: number[]; // percentage thresholds for warnings
    blockOnExceed: boolean;
  };

  // Database per tenant configuration
  isolation: {
    strategy: 'shared' | 'separate_db' | 'separate_schema';
    autoCreateDatabase: boolean;
    databasePrefix: string;
    schemaPrefix: string;
    migrationStrategy: 'auto' | 'manual';
  };

  // Security configuration
  security: {
    validateTenantAccess: boolean;
    allowCrossTenantAccess: boolean;
    auditTenantAccess: boolean;
    encryptTenantData: boolean;
  };

  // Monitoring and alerting
  monitoring: {
    enabled: boolean;
    trackUsage: boolean;
    trackPerformance: boolean;
    alertOnLimitApproach: boolean;
    alertThreshold: number; // percentage
    webhookUrl?: string;
  };
}

/**
 * Default multi-tenancy configuration
 */
export const defaultMultiTenancyConfig: IMultiTenancyConfig = {
  resolution: {
    strategies: [TenantResolutionStrategy.SUBDOMAIN, TenantResolutionStrategy.HEADER],
    headerName: 'X-Tenant-ID',
    queryParam: 'tenant',
    pathPattern: '/tenant/:slug',
    required: true,
    fallbackToDefault: false,
  },

  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    maxEntries: 1000,
    provider: 'memory',
  },

  storage: {
    provider: 'database',
  },

  defaultLimits: {
    [TenantPlan.FREE]: {
      users: 5,
      storage: 1024 * 1024 * 100, // 100MB
      apiCalls: 1000,
      bandwidth: 1024 * 1024 * 1024, // 1GB
      projects: 1,
      customFields: 5,
      webhooks: 1,
      integrations: 2,
    },
    [TenantPlan.STARTER]: {
      users: 25,
      storage: 1024 * 1024 * 1024 * 5, // 5GB
      apiCalls: 10000,
      bandwidth: 1024 * 1024 * 1024 * 10, // 10GB
      projects: 10,
      customFields: 50,
      webhooks: 5,
      integrations: 10,
    },
    [TenantPlan.PROFESSIONAL]: {
      users: 100,
      storage: 1024 * 1024 * 1024 * 50, // 50GB
      apiCalls: 100000,
      bandwidth: 1024 * 1024 * 1024 * 100, // 100GB
      projects: 100,
      customFields: 500,
      webhooks: 25,
      integrations: 50,
    },
    [TenantPlan.ENTERPRISE]: {
      users: 1000,
      storage: 1024 * 1024 * 1024 * 500, // 500GB
      apiCalls: 1000000,
      bandwidth: 1024 * 1024 * 1024 * 1000, // 1TB
      projects: 1000,
      customFields: 5000,
      webhooks: 100,
      integrations: 200,
    },
    [TenantPlan.CUSTOM]: {
      users: -1, // unlimited
      storage: -1,
      apiCalls: -1,
      bandwidth: -1,
      projects: -1,
      customFields: -1,
      webhooks: -1,
      integrations: -1,
    },
  },

  defaultFeatures: {
    [TenantPlan.FREE]: ['basic_dashboard', 'basic_reports', 'email_support'],
    [TenantPlan.STARTER]: [
      'basic_dashboard',
      'basic_reports',
      'advanced_reports',
      'email_support',
      'api_access',
      'webhooks',
    ],
    [TenantPlan.PROFESSIONAL]: [
      'basic_dashboard',
      'basic_reports',
      'advanced_reports',
      'custom_fields',
      'email_support',
      'phone_support',
      'api_access',
      'webhooks',
      'integrations',
      'custom_branding',
    ],
    [TenantPlan.ENTERPRISE]: [
      'basic_dashboard',
      'basic_reports',
      'advanced_reports',
      'custom_fields',
      'email_support',
      'phone_support',
      'priority_support',
      'api_access',
      'webhooks',
      'integrations',
      'custom_branding',
      'sso',
      'audit_logs',
      'advanced_security',
    ],
    [TenantPlan.CUSTOM]: [
      'basic_dashboard',
      'basic_reports',
      'advanced_reports',
      'custom_fields',
      'email_support',
      'phone_support',
      'priority_support',
      'dedicated_support',
      'api_access',
      'webhooks',
      'integrations',
      'custom_branding',
      'sso',
      'audit_logs',
      'advanced_security',
      'custom_features',
    ],
  },

  defaultSettings: {
    branding: {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
    },
    locale: {
      language: 'en',
      timezone: 'UTC',
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      numberFormat: 'en-US',
    },
    security: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false,
        maxAge: 90,
      },
      sessionTimeout: 480, // 8 hours
      mfaRequired: false,
    },
    features: {
      apiAccess: true,
      webhooks: false,
      customFields: false,
      advancedReporting: false,
    },
  },

  usage: {
    enabled: true,
    updateInterval: 60, // 1 minute
    aggregationInterval: 3600, // 1 hour
    retentionDays: 90,
  },

  provisioning: {
    autoProvision: false,
    requireApproval: true,
    defaultPlan: TenantPlan.FREE,
    createAdminUser: true,
    sendWelcomeEmail: true,
    setupTasks: [
      'create_database',
      'run_migrations',
      'create_admin_user',
      'setup_default_roles',
      'send_welcome_email',
    ],
  },

  limits: {
    enforceStrict: true,
    gracePeriodPercentage: 10,
    warningThresholds: [70, 85, 95],
    blockOnExceed: true,
  },

  isolation: {
    strategy: 'shared',
    autoCreateDatabase: false,
    databasePrefix: 'tenant_',
    schemaPrefix: 'tenant_',
    migrationStrategy: 'manual',
  },

  security: {
    validateTenantAccess: true,
    allowCrossTenantAccess: false,
    auditTenantAccess: true,
    encryptTenantData: false,
  },

  monitoring: {
    enabled: true,
    trackUsage: true,
    trackPerformance: true,
    alertOnLimitApproach: true,
    alertThreshold: 85,
  },
};

/**
 * Load configuration from environment variables
 */
export function loadMultiTenancyConfig(): IMultiTenancyConfig {
  const config = { ...defaultMultiTenancyConfig };

  // Override with environment variables
  if (process.env.MT_CACHE_ENABLED) {
    config.cache.enabled = process.env.MT_CACHE_ENABLED === 'true';
  }

  if (process.env.MT_CACHE_TTL) {
    config.cache.ttl = parseInt(process.env.MT_CACHE_TTL, 10);
  }

  if (process.env.MT_STORAGE_PROVIDER) {
    config.storage.provider = process.env.MT_STORAGE_PROVIDER as any;
  }

  if (process.env.MT_ENFORCE_STRICT_LIMITS) {
    config.limits.enforceStrict = process.env.MT_ENFORCE_STRICT_LIMITS === 'true';
  }

  if (process.env.MT_ISOLATION_STRATEGY) {
    config.isolation.strategy = process.env.MT_ISOLATION_STRATEGY as any;
  }

  return config;
}
