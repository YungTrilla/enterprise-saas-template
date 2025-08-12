import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { ApiResponse } from '@template/shared-utils';
import {
  NotificationRequest,
  NotificationResponse,
  BulkNotificationRequest,
  NotificationTemplate,
} from '../types/notification';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Send a single notification
   */
  sendNotification = async (req: Request, res: Response) => {
    try {
      const notificationRequest: NotificationRequest = req.body;
      const notification = await this.notificationService.sendNotification(notificationRequest);

      const response: ApiResponse<NotificationResponse> = {
        success: true,
        data: notification,
        message: 'Notification queued successfully',
        timestamp: new Date().toISOString(),
      };

      res.status(202).json(response); // 202 Accepted for async processing
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'NOTIFICATION_SEND_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send notification',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
    }
  };

  /**
   * Send bulk notifications
   */
  sendBulkNotifications = async (req: Request, res: Response) => {
    try {
      const bulkRequest: BulkNotificationRequest = req.body;
      const result = await this.notificationService.sendBulkNotifications(bulkRequest);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: `Bulk notification batch queued: ${result.successful}/${result.total} successful`,
        timestamp: new Date().toISOString(),
      };

      res.status(202).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'BULK_NOTIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send bulk notifications',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
    }
  };

  /**
   * Get notification by ID
   */
  getNotification = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.getNotification(id);

      if (!notification) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<NotificationResponse> = {
        success: true,
        data: notification,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'NOTIFICATION_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch notification',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };

  /**
   * Get notifications with pagination and filtering
   */
  getNotifications = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, status, type, priority, recipient } = req.query;

      const filters = {
        status: status as string,
        type: type as string,
        priority: priority as string,
        recipient: recipient as string,
      };

      const result = await this.notificationService.getNotifications(
        Number(page),
        Number(limit),
        filters
      );

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'NOTIFICATIONS_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch notifications',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };

  /**
   * Cancel scheduled notification
   */
  cancelNotification = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.notificationService.cancelNotification(id);

      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: {
            code: 'NOTIFICATION_CANCEL_FAILED',
            message: 'Cannot cancel notification (not found or already processed)',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(response);
      }

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Notification cancelled successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'NOTIFICATION_CANCEL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to cancel notification',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };

  /**
   * Retry failed notification
   */
  retryNotification = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.retryNotification(id);

      if (!notification) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: {
            code: 'NOTIFICATION_RETRY_FAILED',
            message: 'Cannot retry notification (not found, not failed, or max retries exceeded)',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(response);
      }

      const response: ApiResponse<NotificationResponse> = {
        success: true,
        data: notification,
        message: 'Notification retry queued successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'NOTIFICATION_RETRY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retry notification',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };

  /**
   * Get notification statistics
   */
  getStats = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await this.notificationService.getStats(startDate as string, endDate as string);

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'STATS_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch statistics',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };

  // Template management methods
  createTemplate = async (req: Request, res: Response) => {
    try {
      const templateData = req.body;
      const template = await this.notificationService.createTemplate(templateData);

      const response: ApiResponse<NotificationTemplate> = {
        success: true,
        data: template,
        message: 'Template created successfully',
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'TEMPLATE_CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create template',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
    }
  };

  getTemplates = async (req: Request, res: Response) => {
    try {
      const { type, isActive } = req.query;
      const templates = await this.notificationService.getTemplates({
        type: type as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      const response: ApiResponse<NotificationTemplate[]> = {
        success: true,
        data: templates,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'TEMPLATES_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch templates',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };

  getTemplate = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const template = await this.notificationService.getTemplate(id);

      if (!template) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<NotificationTemplate> = {
        success: true,
        data: template,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'TEMPLATE_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch template',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };

  updateTemplate = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const template = await this.notificationService.updateTemplate(id, updates);

      if (!template) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<NotificationTemplate> = {
        success: true,
        data: template,
        message: 'Template updated successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'TEMPLATE_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update template',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
    }
  };

  deleteTemplate = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.notificationService.deleteTemplate(id);

      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Template deleted successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'TEMPLATE_DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete template',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };

  // Test endpoints (development only)
  testEmail = async (req: Request, res: Response) => {
    try {
      // Mock test email sending
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Test email sent successfully (mock)',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
      });
    }
  };

  testSMS = async (req: Request, res: Response) => {
    try {
      // Mock test SMS sending
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Test SMS sent successfully (mock)',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to send test SMS',
      });
    }
  };

  testPush = async (req: Request, res: Response) => {
    try {
      // Mock test push notification sending
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Test push notification sent successfully (mock)',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to send test push notification',
      });
    }
  };
}
