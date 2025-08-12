/**
 * Multi-Tenancy Type Definitions
 */

export interface ITenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  subdomain?: string;
  plan: TenantPlan;
  status: TenantStatus;
  settings: ITenantSettings;
  limits: ITenantLimits;
  usage: ITenantUsage;
  database?: ITenantDatabase;
  features: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ITenantSettings {
  // Branding
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customCss?: string;
    favicon?: string;
  };

  // Localization
  locale: {
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    numberFormat: string;
  };

  // Security
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
    ipWhitelist: string[];
    allowedDomains: string[];
  };

  // Features
  features: {
    apiAccess: boolean;
    webhooks: boolean;
    customFields: boolean;
    advancedReporting: boolean;
    integrations: string[];
  };

  // Notifications
  notifications: {
    email: {
      fromAddress: string;
      fromName: string;
      replyTo?: string;
    };
    sms: {
      enabled: boolean;
      provider?: string;
    };
    webhooks: {
      enabled: boolean;
      endpoints: string[];
    };
  };
}

export interface ITenantLimits {
  users: number;
  storage: number; // bytes
  apiCalls: number; // per month
  bandwidth: number; // bytes per month
  projects: number;
  customFields: number;
  webhooks: number;
  integrations: number;
}

export interface ITenantUsage {
  users: number;
  storage: number; // bytes
  apiCalls: number; // current month
  bandwidth: number; // current month
  projects: number;
  customFields: number;
  webhooks: number;
  integrations: number;
  lastUpdated: string;
}

export interface ITenantDatabase {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  connectionTimeoutMs: number;
}

export enum TenantPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  PROVISIONING = 'PROVISIONING',
  MIGRATING = 'MIGRATING',
}

export enum TenantResolutionStrategy {
  SUBDOMAIN = 'SUBDOMAIN',
  DOMAIN = 'DOMAIN',
  HEADER = 'HEADER',
  PATH = 'PATH',
  QUERY_PARAM = 'QUERY_PARAM',
}

// Request/Response types
export type CreateTenantRequest = Omit<
  ITenant,
  'id' | 'usage' | 'createdAt' | 'updatedAt' | 'createdBy'
>;

export type UpdateTenantRequest = Partial<
  Omit<ITenant, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'createdBy'>
>;

export interface ITenantProvisioningRequest {
  name: string;
  slug: string;
  plan: TenantPlan;
  adminUser: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
  };
  domain?: string;
  subdomain?: string;
  settings?: Partial<ITenantSettings>;
  metadata?: Record<string, any>;
}

export interface ITenantProvisioningResult {
  tenant: ITenant;
  adminUser: {
    id: string;
    email: string;
    temporaryPassword?: string;
  };
  database?: {
    host: string;
    database: string;
    username: string;
    temporaryPassword?: string;
  };
  setupTasks: Array<{
    task: string;
    status: 'pending' | 'completed' | 'failed';
    error?: string;
  }>;
}

// Search and filter types
export interface ITenantSearchParams {
  query?: string;
  plan?: TenantPlan;
  status?: TenantStatus;
  domain?: string;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'plan';
  sortOrder?: 'asc' | 'desc';
}

// Analytics types
export interface ITenantAnalytics {
  tenantId: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    activeUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
    apiCalls: number;
    storageUsed: number;
    bandwidthUsed: number;
    features: Record<string, number>;
  };
  growth: {
    userGrowth: number;
    usageGrowth: number;
    revenueImpact: number;
  };
  alerts: Array<{
    type: 'limit' | 'usage' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    threshold: number;
    current: number;
  }>;
}

// Webhook types
export interface ITenantWebhook {
  eventType:
    | 'tenant.created'
    | 'tenant.updated'
    | 'tenant.suspended'
    | 'tenant.deleted'
    | 'tenant.limit.exceeded';
  tenant: ITenant;
  timestamp: string;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
}
