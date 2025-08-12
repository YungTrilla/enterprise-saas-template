import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { validateRequest } from '@template/shared-utils';
import Joi from 'joi';

const router = Router();
const notificationController = new NotificationController();

// Validation schemas
const sendNotificationSchema = Joi.object({
  type: Joi.string().valid('email', 'sms', 'push').required(),
  recipient: Joi.string().required(),
  templateId: Joi.string().optional(),
  subject: Joi.string().optional(),
  body: Joi.string().optional(),
  variables: Joi.object().optional(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  scheduledFor: Joi.string().isoDate().optional(),
  metadata: Joi.object().optional(),
});

const bulkNotificationSchema = Joi.object({
  notifications: Joi.array().items(sendNotificationSchema).min(1).max(1000).required(),
  batchSize: Joi.number().min(1).max(100).default(10),
  delayBetweenBatches: Joi.number().min(0).max(60000).default(1000),
});

const templateSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('email', 'sms', 'push').required(),
  subject: Joi.string().when('type', {
    is: 'email',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  body: Joi.string().required(),
  variables: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true),
});

// Send single notification
router.post(
  '/send',
  validateRequest({ body: sendNotificationSchema }),
  notificationController.sendNotification
);

// Send bulk notifications
router.post(
  '/send-bulk',
  validateRequest({ body: bulkNotificationSchema }),
  notificationController.sendBulkNotifications
);

// Get notification by ID
router.get('/:id', notificationController.getNotification);

// Get notifications with pagination and filtering
router.get('/', notificationController.getNotifications);

// Cancel scheduled notification
router.post('/:id/cancel', notificationController.cancelNotification);

// Retry failed notification
router.post('/:id/retry', notificationController.retryNotification);

// Get notification statistics
router.get('/stats/summary', notificationController.getStats);

// Template management routes
router.post(
  '/templates',
  validateRequest({ body: templateSchema }),
  notificationController.createTemplate
);

router.get('/templates', notificationController.getTemplates);
router.get('/templates/:id', notificationController.getTemplate);

router.put(
  '/templates/:id',
  validateRequest({ body: templateSchema.fork(['name', 'type'], schema => schema.optional()) }),
  notificationController.updateTemplate
);

router.delete('/templates/:id', notificationController.deleteTemplate);

// Test notification endpoints (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test/email', notificationController.testEmail);
  router.post('/test/sms', notificationController.testSMS);
  router.post('/test/push', notificationController.testPush);
}

export { router as notificationRoutes };
