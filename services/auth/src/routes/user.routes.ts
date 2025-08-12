import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '@template/shared-utils/validation';
import { userValidation, paramValidation, bulkValidation } from '../validation/user.validation';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

// User Management Routes

// List users
router.get(
  '/',
  authorize(['users:list']),
  validateQuery(userValidation.listUsers),
  userController.listUsers
);

// Create user
router.post(
  '/',
  authorize(['users:create']),
  validate(userValidation.createUser),
  userController.createUser
);

// Get user by ID
router.get(
  '/:userId',
  authorize(['users:read']),
  validateParams(paramValidation.userId),
  userController.getUser
);

// Update user
router.put(
  '/:userId',
  authorize(['users:update']),
  validateParams(paramValidation.userId),
  validate(userValidation.updateUser),
  userController.updateUser
);

// Delete user
router.delete(
  '/:userId',
  authorize(['users:delete']),
  validateParams(paramValidation.userId),
  userController.deleteUser
);

// Activate user
router.post(
  '/:userId/activate',
  authorize(['users:update']),
  validateParams(paramValidation.userId),
  userController.activateUser
);

// Deactivate user
router.post(
  '/:userId/deactivate',
  authorize(['users:update']),
  validateParams(paramValidation.userId),
  userController.deactivateUser
);

// Bulk deactivate users
router.post(
  '/bulk/deactivate',
  authorize(['users:update']),
  validate(bulkValidation.bulkDeactivate),
  userController.bulkDeactivateUsers
);

// Assign roles
router.post(
  '/:userId/roles',
  authorize(['roles:assign']),
  validateParams(paramValidation.userId),
  validate(userValidation.assignRoles),
  userController.assignRoles
);

// Reset password
router.post(
  '/:userId/reset-password',
  authorize(['users:update']),
  validateParams(paramValidation.userId),
  validate(userValidation.resetPassword),
  userController.resetPassword
);

// Role Preset Routes

// Get all role presets
router.get(
  '/role-presets',
  authorize(['roles:read']),
  userController.getRolePresets
);

// Get role presets by department
router.get(
  '/role-presets/department/:department',
  authorize(['roles:read']),
  userController.getRolePresetsByDepartment
);

export const userRoutes = router;