/**
 * Notification Service Entry Point
 * Handles email, SMS, and push notifications for the platform
 */

import { bootstrapService } from '@template/service-bootstrap';
import { notificationRoutes } from './routes/notification.routes';
import { healthRoutes } from './routes/health.routes';

async function startNotificationService() {
  const service = await bootstrapService({
    serviceName: 'notification-service',
    port: 8002,
    routes: [
      { path: '/health', router: healthRoutes },
      { path: '/api/v1/notifications', router: notificationRoutes },
    ],
    enableCors: true,
    enableCompression: true,
    enableRateLimit: true,
    rateLimitConfig: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs for notifications
    },
  });

  console.log('🔔 Notification Service started successfully');
  return service;
}

// Start the service
startNotificationService().catch((error) => {
  console.error('Failed to start notification service:', error);
  process.exit(1);
});