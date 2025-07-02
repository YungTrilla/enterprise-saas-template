export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject?: string; // For email
  body: string;
  variables: string[]; // List of template variables
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRequest {
  type: NotificationType;
  recipient: string; // email, phone, or device token
  templateId?: string;
  subject?: string; // Override template subject
  body?: string; // Override template body or use for custom messages
  variables?: Record<string, string>; // Template variable values
  priority?: NotificationPriority;
  scheduledFor?: string; // ISO date string for scheduled notifications
  metadata?: Record<string, any>;
}

export interface NotificationResponse {
  id: string;
  status: NotificationStatus;
  type: NotificationType;
  recipient: string;
  subject?: string;
  body: string;
  priority: NotificationPriority;
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'email' | 'sms' | 'push';

export type NotificationStatus = 
  | 'pending' 
  | 'scheduled' 
  | 'sending' 
  | 'sent' 
  | 'delivered' 
  | 'failed' 
  | 'cancelled';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface EmailProvider {
  name: string;
  sendEmail(notification: EmailNotification): Promise<void>;
}

export interface SMSProvider {
  name: string;
  sendSMS(notification: SMSNotification): Promise<void>;
}

export interface PushProvider {
  name: string;
  sendPush(notification: PushNotification): Promise<void>;
}

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SMSNotification {
  to: string;
  body: string;
  from?: string;
}

export interface PushNotification {
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
}

export interface NotificationStats {
  total: number;
  byStatus: Record<NotificationStatus, number>;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  successRate: number;
  averageDeliveryTime: number; // in milliseconds
}

export interface BulkNotificationRequest {
  notifications: NotificationRequest[];
  batchSize?: number;
  delayBetweenBatches?: number; // in milliseconds
}

export interface BulkNotificationResponse {
  batchId: string;
  total: number;
  successful: number;
  failed: number;
  notifications: NotificationResponse[];
}