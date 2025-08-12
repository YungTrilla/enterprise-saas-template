import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { healthRoutes } from './health.routes';
import { AuthService } from '../services/auth.service';
import { AuthMiddleware } from '../middleware/auth.middleware';

export function createRoutes(authService: AuthService, authMiddleware: AuthMiddleware): Router {
  const router = Router();

  // Health check routes (no auth required)
  router.use('/health', healthRoutes);

  // Authentication routes
  router.use('/auth', authRoutes(authService, authMiddleware));

  // User management routes
  router.use('/users', userRoutes);

  return router;
}
