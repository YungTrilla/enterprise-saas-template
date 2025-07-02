/**
 * Abyss Central - Shared Types Library
 *
 * This library contains all shared TypeScript type definitions used across
 * the Abyss Suite services and applications.
 *
 * Following the data exchange standards defined in the roadmap:
 * - JSON format for all data interchange
 * - camelCase field naming convention
 * - UUIDv4 for entity identifiers
 * - ISO 8601 timestamps in UTC
 * - UPPER_SNAKE_CASE for enum values
 * - Structured error responses with correlation IDs
 */
export * from './common';
export * from './inventory';
export * from './orders';
export type { IEmployee, IEmergencyContact, IEmployeeSkill, IEmployeeCertification, IEmployeeLicense, IAvailabilitySchedule, IDayAvailability, IVehicleInfo, ITimeEntry, IGpsLocation, ITimeOffRequest } from './employees';
export { EmploymentStatus, EmployeeType, PayFrequency, AccessLevel, ProficiencyLevel, LicenseType, FuelType, TimeEntryStatus } from './employees';
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type WithoutAuditFields<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type CreateRequest<T> = WithoutAuditFields<T>;
export type UpdateRequest<T> = Partial<WithoutAuditFields<T>>;
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
export interface IValidationResult {
    isValid: boolean;
    errors: Array<{
        field: string;
        code: string;
        message: string;
    }>;
}
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
export declare namespace DomainEvents {
    interface IInventoryItemCreated {
        itemId: string;
        name: string;
        sku: string;
        categoryId: string;
        totalQuantity: number;
    }
    interface IInventoryItemUpdated {
        itemId: string;
        changes: Record<string, unknown>;
        previousValues: Record<string, unknown>;
    }
    interface IInventoryItemReserved {
        itemId: string;
        orderId: string;
        quantity: number;
        startDate: string;
        endDate: string;
    }
    interface IInventoryItemReturned {
        itemId: string;
        orderId: string;
        quantity: number;
        condition: string;
        returnedAt: string;
    }
    interface IOrderCreated {
        orderId: string;
        orderNumber: string;
        customerId: string;
        totalAmount: {
            amount: number;
            currency: string;
        };
        items: Array<{
            itemId: string;
            quantity: number;
        }>;
    }
    interface IOrderStatusChanged {
        orderId: string;
        previousStatus: string;
        newStatus: string;
        changedBy: string;
        reason?: string;
    }
    interface IOrderCompleted {
        orderId: string;
        completedAt: string;
        totalRevenue: {
            amount: number;
            currency: string;
        };
    }
    interface IEmployeeCreated {
        employeeId: string;
        employeeNumber: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    }
    interface IEmployeeClockedIn {
        employeeId: string;
        timeEntryId: string;
        clockInTime: string;
        location?: {
            latitude: number;
            longitude: number;
        };
    }
    interface IEmployeeClockedOut {
        employeeId: string;
        timeEntryId: string;
        clockOutTime: string;
        totalHours: number;
    }
}
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
export interface IBaseSearchParams {
    query?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, unknown>;
}
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
export declare const VERSION = "0.1.0";
export declare const API_VERSION = "v1";
//# sourceMappingURL=index.d.ts.map