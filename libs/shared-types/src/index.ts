/**
 * Enterprise SaaS Template - Shared Types Library
 *
 * This library contains all shared TypeScript type definitions used across
 * the Enterprise SaaS Template services and applications.
 *
 * Following the data exchange standards:
 * - JSON format for all data interchange
 * - camelCase field naming convention
 * - UUIDv4 for entity identifiers
 * - ISO 8601 timestamps in UTC
 * - UPPER_SNAKE_CASE for enum values
 * - Structured error responses with correlation IDs
 */

// Export all common types
export * from './common';

// Export template-specific types
export * from './examples';
export * from './notifications';

// Export types for commonly needed entities
export type {
  IUser,
  IRole,
  IPermission,
  IUserSession,
  IUserProfile,
  IUserPreferences,
} from './common';

export { UserStatus, UserType, RoleType, PermissionScope } from './common';

// Type utilities and helpers
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type WithoutAuditFields<T> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;
export type CreateRequest<T> = WithoutAuditFields<T>;
export type UpdateRequest<T> = Partial<WithoutAuditFields<T>>;

// API response type helpers
export type ApiSuccess<T> = {
  success: true;
  data: T;
  error?: never;
} & {
  correlationId: string;
  timestamp: string;
};

export type ApiError = {
  success: false;
  data?: never;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
} & {
  correlationId: string;
  timestamp: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Pagination types
export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: IPaginationMeta;
}

// Validation helpers
export interface IValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}

// Event types for inter-service communication
export interface IServiceEvent<T = unknown> {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventVersion: number;
  occurredAt: string;
  correlationId?: string;
  causationId?: string;
  payload: T;
  metadata?: Record<string, unknown>;
}

// Domain events
export namespace DomainEvents {
  // User events
  export interface IUserCreated {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
  }

  export interface IUserUpdated {
    userId: string;
    changes: Record<string, unknown>;
    previousValues: Record<string, unknown>;
  }

  export interface IUserLoggedIn {
    userId: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    loginAt: string;
  }

  export interface IUserLoggedOut {
    userId: string;
    sessionId: string;
    logoutAt: string;
  }

  // Example events
  export interface IExampleCreated {
    exampleId: string;
    title: string;
    category: string;
    createdBy: string;
  }

  export interface IExampleUpdated {
    exampleId: string;
    changes: Record<string, unknown>;
    previousValues: Record<string, unknown>;
    updatedBy: string;
  }

  export interface IExampleStatusChanged {
    exampleId: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    reason?: string;
  }

  // Notification events
  export interface INotificationSent {
    notificationId: string;
    type: string;
    recipient: string;
    sentAt: string;
  }

  export interface INotificationDelivered {
    notificationId: string;
    deliveredAt: string;
  }

  export interface INotificationFailed {
    notificationId: string;
    failedAt: string;
    reason: string;
    retryCount: number;
  }
}

// Configuration types
export interface IServiceConfig {
  serviceName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  port: number;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
  };
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  jwt: {
    secret: string;
    expirationTime: string;
    issuer: string;
  };
  logging: {
    level: string;
    format: 'json' | 'text';
    enableConsole: boolean;
    enableFile: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    enableTracing: boolean;
    enableHealthCheck: boolean;
  };
}

// External service integration types
export interface IThirdPartyIntegration {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  configuration: Record<string, unknown>;
  credentials: Record<string, unknown>;
  lastSyncAt?: string;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

// Webhook types
export interface IWebhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number;
  };
  lastTriggeredAt?: string;
  successCount: number;
  failureCount: number;
}

// Search and filtering base types
export interface IBaseSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// Audit log types
export interface IAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes: Record<string, unknown>;
  previousValues: Record<string, unknown>;
  performedBy: string;
  performedAt: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// File upload types
export interface IFileUpload {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: Record<string, any>;
}

// Multi-tenancy types
export interface ITenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  subdomain?: string;
  plan: string;
  status: TenantStatus;
  settings: Record<string, any>;
  features: string[];
  limits: {
    users: number;
    storage: number; // in bytes
    apiCalls: number;
  };
  usage: {
    users: number;
    storage: number;
    apiCalls: number;
  };
  createdAt: string;
  updatedAt: string;
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  CANCELLED = 'CANCELLED',
}

// Version info
export const VERSION = '1.0.0';
export const API_VERSION = 'v1';
