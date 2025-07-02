/**
 * Common types used across all Abyss Suite services
 * Following the data exchange standards from the roadmap
 */

// Core entity identifier type (UUIDv4 format)
export type EntityId = string;

// Correlation ID for request tracing
export type CorrelationId = string;

// Timestamp in ISO 8601 UTC format
export type Timestamp = string;

// Currency representation (integer cents + ISO 4217 code)
export interface ICurrency {
  amount: number; // Amount in smallest currency unit (e.g., cents)
  currency: string; // ISO 4217 currency code (e.g., 'USD', 'EUR')
}

// Standard API response wrapper
export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: IApiError;
  correlationId: CorrelationId;
  timestamp: Timestamp;
}

// Standard error response
export interface IApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string; // Only in development
}

// Pagination parameters
export interface IPaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Pagination metadata
export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response
export interface IPaginatedResponse<T> {
  items: T[];
  pagination: IPaginationMeta;
}

// Standard entity audit fields
export interface IAuditFields {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: EntityId;
  updatedBy?: EntityId;
}

// Standard enum types (UPPER_SNAKE_CASE format)
export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  CONFIRMED = 'CONFIRMED',
  IN_PREPARATION = 'IN_PREPARATION',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  IN_USE = 'IN_USE',
  PICKUP_SCHEDULED = 'PICKUP_SCHEDULED',
  OUT_FOR_PICKUP = 'OUT_FOR_PICKUP',
  RETURNED = 'RETURNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ItemStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  DAMAGED = 'DAMAGED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum EmployeeRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DISPATCHER = 'DISPATCHER',
  DRIVER = 'DRIVER',
  TECHNICIAN = 'TECHNICIAN',
  SALES = 'SALES',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  LITE = 'LITE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

// Log levels for structured logging
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Standard log entry structure
export interface ILogEntry {
  level: LogLevel;
  message: string;
  correlationId?: CorrelationId;
  timestamp: Timestamp;
  service: string;
  metadata?: Record<string, unknown>;
}

// Service health check response
export interface IHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Timestamp;
  version: string;
  uptime: number;
  dependencies?: Record<string, 'healthy' | 'unhealthy'>;
}

// Feature flag configuration
export interface IFeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  conditions?: Record<string, unknown>;
}

// User permissions for role-based access control
export interface IPermission {
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

// Address structure (standardized format)
export interface IAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2 country code
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Contact information structure
export interface IContactInfo {
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
}

// File/Document reference
export interface IFileReference {
  id: EntityId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Timestamp;
  uploadedBy: EntityId;
}

// Validation error structure
export interface IValidationError {
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

// Bulk operation result
export interface IBulkOperationResult<T = EntityId> {
  successful: T[];
  failed: Array<{
    item: T;
    error: IApiError;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}