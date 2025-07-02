import { v4 as uuidv4 } from 'uuid';
import {
  NotificationRequest,
  NotificationResponse,
  NotificationTemplate,
  NotificationStats,
  BulkNotificationRequest,
  BulkNotificationResponse,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from '../types/notification';

// Mock in-memory storage (replace with actual database in production)
const notifications = new Map<string, NotificationResponse>();
const templates = new Map<string, NotificationTemplate>();

export class NotificationService {
  
  /**
   * Send a single notification
   */
  async sendNotification(request: NotificationRequest): Promise<NotificationResponse> {
    const notification: NotificationResponse = {
      id: uuidv4(),
      status: request.scheduledFor ? 'scheduled' : 'pending',
      type: request.type,
      recipient: request.recipient,
      subject: request.subject,
      body: request.body || '',
      priority: request.priority || 'normal',
      scheduledFor: request.scheduledFor,
      retryCount: 0,
      maxRetries: this.getMaxRetries(request.priority || 'normal'),
      metadata: request.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If using a template, merge template content
    if (request.templateId) {
      const template = templates.get(request.templateId);
      if (template && template.isActive) {
        notification.subject = request.subject || template.subject;
        notification.body = this.processTemplate(template.body, request.variables || {});
      }
    }

    // Store notification
    notifications.set(notification.id, notification);

    // Simulate async processing
    if (!request.scheduledFor) {
      this.processNotificationAsync(notification.id);
    }

    return notification;
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(request: BulkNotificationRequest): Promise<BulkNotificationResponse> {
    const batchId = uuidv4();
    const results: NotificationResponse[] = [];
    let successful = 0;
    let failed = 0;

    // Process notifications in batches
    const batchSize = request.batchSize || 10;
    const delay = request.delayBetweenBatches || 1000;

    for (let i = 0; i < request.notifications.length; i += batchSize) {
      const batch = request.notifications.slice(i, i + batchSize);
      
      // Process batch
      for (const notificationRequest of batch) {
        try {
          const notification = await this.sendNotification(notificationRequest);
          results.push(notification);
          successful++;
        } catch (error) {
          failed++;
          // Create failed notification record
          const failedNotification: NotificationResponse = {
            id: uuidv4(),
            status: 'failed',
            type: notificationRequest.type,
            recipient: notificationRequest.recipient,
            subject: notificationRequest.subject,
            body: notificationRequest.body || '',
            priority: notificationRequest.priority || 'normal',
            failedAt: new Date().toISOString(),
            failureReason: error instanceof Error ? error.message : 'Unknown error',
            retryCount: 0,
            maxRetries: 0,
            metadata: notificationRequest.metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          results.push(failedNotification);
        }
      }

      // Delay between batches (except for the last batch)
      if (i + batchSize < request.notifications.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      batchId,
      total: request.notifications.length,
      successful,
      failed,
      notifications: results,
    };
  }

  /**
   * Get notification by ID
   */
  async getNotification(id: string): Promise<NotificationResponse | null> {
    return notifications.get(id) || null;
  }

  /**
   * Get notifications with pagination and filtering
   */
  async getNotifications(
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: string;
      type?: string;
      priority?: string;
      recipient?: string;
    } = {}
  ): Promise<{
    data: NotificationResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    let filteredNotifications = Array.from(notifications.values());

    // Apply filters
    if (filters.status) {
      filteredNotifications = filteredNotifications.filter(n => n.status === filters.status);
    }
    if (filters.type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === filters.type);
    }
    if (filters.priority) {
      filteredNotifications = filteredNotifications.filter(n => n.priority === filters.priority);
    }
    if (filters.recipient) {
      filteredNotifications = filteredNotifications.filter(n => 
        n.recipient.toLowerCase().includes(filters.recipient!.toLowerCase())
      );
    }

    // Sort by creation date (newest first)
    filteredNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const total = filteredNotifications.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = filteredNotifications.slice(offset, offset + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(id: string): Promise<boolean> {
    const notification = notifications.get(id);
    if (!notification || notification.status !== 'scheduled') {
      return false;
    }

    notification.status = 'cancelled';
    notification.updatedAt = new Date().toISOString();
    notifications.set(id, notification);

    return true;
  }

  /**
   * Retry failed notification
   */
  async retryNotification(id: string): Promise<NotificationResponse | null> {
    const notification = notifications.get(id);
    if (!notification || notification.status !== 'failed' || notification.retryCount >= notification.maxRetries) {
      return null;
    }

    notification.status = 'pending';
    notification.retryCount++;
    notification.updatedAt = new Date().toISOString();
    notifications.set(id, notification);

    // Process retry async
    this.processNotificationAsync(id);

    return notification;
  }

  /**
   * Get notification statistics
   */
  async getStats(startDate?: string, endDate?: string): Promise<NotificationStats> {
    let notificationsList = Array.from(notifications.values());

    // Filter by date range if provided
    if (startDate) {
      notificationsList = notificationsList.filter(n => 
        new Date(n.createdAt) >= new Date(startDate)
      );
    }
    if (endDate) {
      notificationsList = notificationsList.filter(n => 
        new Date(n.createdAt) <= new Date(endDate)
      );
    }

    const total = notificationsList.length;
    const byStatus: Record<NotificationStatus, number> = {
      pending: 0,
      scheduled: 0,
      sending: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0,
    };
    const byType: Record<NotificationType, number> = {
      email: 0,
      sms: 0,
      push: 0,
    };
    const byPriority: Record<NotificationPriority, number> = {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
    };

    let totalDeliveryTime = 0;
    let deliveredCount = 0;

    notificationsList.forEach(notification => {
      byStatus[notification.status]++;
      byType[notification.type]++;
      byPriority[notification.priority]++;

      if (notification.deliveredAt && notification.sentAt) {
        const deliveryTime = new Date(notification.deliveredAt).getTime() - 
                            new Date(notification.sentAt).getTime();
        totalDeliveryTime += deliveryTime;
        deliveredCount++;
      }
    });

    const successfulCount = byStatus.sent + byStatus.delivered;
    const successRate = total > 0 ? (successfulCount / total) * 100 : 0;
    const averageDeliveryTime = deliveredCount > 0 ? totalDeliveryTime / deliveredCount : 0;

    return {
      total,
      byStatus,
      byType,
      byPriority,
      successRate,
      averageDeliveryTime,
    };
  }

  // Template management methods
  async createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    const template: NotificationTemplate = {
      ...templateData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    templates.set(template.id, template);
    return template;
  }

  async getTemplates(filters: { type?: string; isActive?: boolean } = {}): Promise<NotificationTemplate[]> {
    let templatesList = Array.from(templates.values());

    if (filters.type) {
      templatesList = templatesList.filter(t => t.type === filters.type);
    }
    if (filters.isActive !== undefined) {
      templatesList = templatesList.filter(t => t.isActive === filters.isActive);
    }

    return templatesList.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTemplate(id: string): Promise<NotificationTemplate | null> {
    return templates.get(id) || null;
  }

  async updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
    const template = templates.get(id);
    if (!template) {
      return null;
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      id: template.id, // Preserve ID
      createdAt: template.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
    };

    templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return templates.delete(id);
  }

  // Private helper methods
  private getMaxRetries(priority: NotificationPriority): number {
    switch (priority) {
      case 'urgent': return 5;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, value);
    });
    return processed;
  }

  private async processNotificationAsync(notificationId: string): Promise<void> {
    // Simulate async processing with random delay
    setTimeout(async () => {
      const notification = notifications.get(notificationId);
      if (!notification) return;

      try {
        // Simulate sending process
        notification.status = 'sending';
        notification.updatedAt = new Date().toISOString();
        notifications.set(notificationId, notification);

        // Simulate random success/failure (90% success rate)
        const success = Math.random() > 0.1;

        if (success) {
          notification.status = 'sent';
          notification.sentAt = new Date().toISOString();
          
          // Simulate delivery confirmation after a short delay
          setTimeout(() => {
            const currentNotification = notifications.get(notificationId);
            if (currentNotification && currentNotification.status === 'sent') {
              currentNotification.status = 'delivered';
              currentNotification.deliveredAt = new Date().toISOString();
              currentNotification.updatedAt = new Date().toISOString();
              notifications.set(notificationId, currentNotification);
            }
          }, Math.random() * 5000 + 1000); // 1-6 seconds delay

        } else {
          notification.status = 'failed';
          notification.failedAt = new Date().toISOString();
          notification.failureReason = 'Simulated network error';
        }

        notification.updatedAt = new Date().toISOString();
        notifications.set(notificationId, notification);

      } catch (error) {
        notification.status = 'failed';
        notification.failedAt = new Date().toISOString();
        notification.failureReason = error instanceof Error ? error.message : 'Unknown error';
        notification.updatedAt = new Date().toISOString();
        notifications.set(notificationId, notification);
      }
    }, Math.random() * 2000 + 500); // 0.5-2.5 seconds delay
  }
}