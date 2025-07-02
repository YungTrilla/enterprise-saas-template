/**
 * Notification Types
 * Types for the notification service
 */

// Notification template interface
export interface INotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject?: string; // For email notifications
  body: string;
  variables: string[]; // Available template variables
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

// Notification interface
export interface INotification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  priority: NotificationPriority;
  recipient: string;
  subject?: string;
  body: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
  batchId?: string; // For bulk notifications
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Notification recipient interface
export interface INotificationRecipient {
  id: string;
  userId?: string;
  email?: string;
  phone?: string;
  deviceToken?: string;
  preferences: INotificationPreferences;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Notification preferences interface
export interface INotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  preferences: {
    marketing: boolean;
    security: boolean;
    system: boolean;
    reminders: boolean;
  };
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Notification channel interface
export interface INotificationChannel {
  id: string;
  name: string;
  type: NotificationType;
  provider: string;
  configuration: Record<string, any>;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Enums
export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  WEBHOOK = 'WEBHOOK'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Request/Response types
export type CreateNotificationRequest = Omit<INotification, 
  'id' | 'status' | 'sentAt' | 'deliveredAt' | 'failedAt' | 'failureReason' | 
  'retryCount' | 'createdAt' | 'updatedAt' | 'createdBy'
>;

export type CreateNotificationTemplateRequest = Omit<INotificationTemplate,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;

export type UpdateNotificationTemplateRequest = Partial<Omit<INotificationTemplate,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>>;

export type CreateNotificationChannelRequest = Omit<INotificationChannel,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateNotificationChannelRequest = Partial<Omit<INotificationChannel,
  'id' | 'createdAt' | 'updatedAt'
>>;

export type UpdateNotificationPreferencesRequest = Partial<Omit<INotificationPreferences,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>>;

// Bulk operations
export interface IBulkNotificationRequest {
  notifications: CreateNotificationRequest[];
  batchSize?: number;
  delayBetweenBatches?: number; // milliseconds
}

export interface IBulkNotificationResponse {
  batchId: string;
  total: number;
  successful: number;
  failed: number;
  notifications: INotification[];
}

// Search and filter types
export interface INotificationSearchParams {
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  recipient?: string;
  templateId?: string;
  batchId?: string;
  scheduledAfter?: string;
  scheduledBefore?: string;
  sentAfter?: string;
  sentBefore?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'scheduledFor' | 'sentAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// Statistics types
export interface INotificationStats {
  total: number;
  byStatus: Record<NotificationStatus, number>;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  successRate: number;
  averageDeliveryTime: number; // milliseconds
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  failureRate: number;
  topFailureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

// Webhook payload types
export interface INotificationWebhookPayload {
  eventType: 'notification.sent' | 'notification.delivered' | 'notification.failed';
  notification: INotification;
  timestamp: string;
  signature: string; // HMAC signature for verification
}

// Provider-specific types
export interface IEmailNotificationData {
  to: string;
  from?: string;
  replyTo?: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface ISMSNotificationData {
  to: string;
  from?: string;
  body: string;
}

export interface IPushNotificationData {
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  icon?: string;
  image?: string;
}

export interface IWebhookNotificationData {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body: Record<string, any>;
  timeout?: number;
  retries?: number;
}