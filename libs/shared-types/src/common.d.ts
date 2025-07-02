/**
 * Common types used across all Abyss Suite services
 * Following the data exchange standards from the roadmap
 */
export type EntityId = string;
export type CorrelationId = string;
export type Timestamp = string;
export interface ICurrency {
    amount: number;
    currency: string;
}
export interface IApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: IApiError;
    correlationId: CorrelationId;
    timestamp: Timestamp;
}
export interface IApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
}
export interface IPaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface IPaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface IPaginatedResponse<T> {
    items: T[];
    pagination: IPaginationMeta;
}
export interface IAuditFields {
    id: EntityId;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy?: EntityId;
    updatedBy?: EntityId;
}
export declare enum OrderStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    CONFIRMED = "CONFIRMED",
    IN_PREPARATION = "IN_PREPARATION",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    IN_USE = "IN_USE",
    PICKUP_SCHEDULED = "PICKUP_SCHEDULED",
    OUT_FOR_PICKUP = "OUT_FOR_PICKUP",
    RETURNED = "RETURNED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum ItemStatus {
    AVAILABLE = "AVAILABLE",
    RESERVED = "RESERVED",
    RENTED = "RENTED",
    MAINTENANCE = "MAINTENANCE",
    DAMAGED = "DAMAGED",
    OUT_OF_SERVICE = "OUT_OF_SERVICE"
}
export declare enum EmployeeRole {
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    DISPATCHER = "DISPATCHER",
    DRIVER = "DRIVER",
    TECHNICIAN = "TECHNICIAN",
    SALES = "SALES",
    CUSTOMER_SERVICE = "CUSTOMER_SERVICE"
}
export declare enum SubscriptionTier {
    FREE = "FREE",
    LITE = "LITE",
    PRO = "PRO",
    ENTERPRISE = "ENTERPRISE"
}
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
export interface ILogEntry {
    level: LogLevel;
    message: string;
    correlationId?: CorrelationId;
    timestamp: Timestamp;
    service: string;
    metadata?: Record<string, unknown>;
}
export interface IHealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: Timestamp;
    version: string;
    uptime: number;
    dependencies?: Record<string, 'healthy' | 'unhealthy'>;
}
export interface IFeatureFlag {
    key: string;
    enabled: boolean;
    description?: string;
    rolloutPercentage?: number;
    conditions?: Record<string, unknown>;
}
export interface IPermission {
    resource: string;
    action: string;
    conditions?: Record<string, unknown>;
}
export interface IAddress {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}
export interface IContactInfo {
    email?: string;
    phone?: string;
    mobile?: string;
    fax?: string;
}
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
export interface IValidationError {
    field: string;
    code: string;
    message: string;
    value?: unknown;
}
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
//# sourceMappingURL=common.d.ts.map