import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ApiError, ApiResponse } from '@template/shared-utils';
import { Pool } from 'pg';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
  correlationId?: string;
}

export class UserController {
  private userService: UserService;
  private pool: Pool;

  constructor() {
    this.userService = new UserService();
    // TODO: Get pool from dependency injection or config
    this.pool = new Pool();
  }

  // User Management Endpoints

  createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.createUser(req.body, req.user!.id, req.correlationId);

      res.status(201).json(ApiResponse.success(user, 'User created successfully'));
    } catch (error) {
      next(error);
    }
  };

  getUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getUser(req.params.userId, req.correlationId);

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      res.json(ApiResponse.success(user));
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.updateUser(
        req.params.userId,
        req.body,
        req.user!.id,
        req.correlationId
      );

      res.json(ApiResponse.success(user, 'User updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        roles,
        isActive,
        isVerified,
        department,
        hasSchedule,
      } = req.query;

      const filter = {
        search: search as string,
        roles: roles ? (Array.isArray(roles) ? roles : [roles]) : undefined,
        isActive: isActive === 'true',
        isVerified: isVerified === 'true',
        department: department as string,
        hasSchedule: hasSchedule === 'true',
      };

      const result = await this.userService.listUsers(
        filter,
        Number(page),
        Number(limit),
        req.correlationId
      );

      res.json(ApiResponse.paginated(result));
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.userService.deleteUser(req.params.userId, req.user!.id, req.correlationId);

      res.json(ApiResponse.success(null, 'User deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  activateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.activateUser(
        req.params.userId,
        req.user!.id,
        req.correlationId
      );

      res.json(ApiResponse.success(user, 'User activated successfully'));
    } catch (error) {
      next(error);
    }
  };

  deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.deactivateUser(
        req.params.userId,
        req.user!.id,
        req.correlationId
      );

      res.json(ApiResponse.success(user, 'User deactivated successfully'));
    } catch (error) {
      next(error);
    }
  };

  assignRoles = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roles } = req.body;

      const user = await this.userService.assignRoles(
        req.params.userId,
        roles,
        req.user!.id,
        req.correlationId
      );

      res.json(ApiResponse.success(user, 'Roles assigned successfully'));
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { newPassword } = req.body;

      await this.userService.resetPassword(
        req.params.userId,
        newPassword,
        req.user!.id,
        req.correlationId
      );

      res.json(ApiResponse.success(null, 'Password reset successfully'));
    } catch (error) {
      next(error);
    }
  };

  // Bulk Operations

  bulkDeactivateUsers = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.userService.bulkDeactivateUsers(
        req.body,
        req.user!.id,
        req.correlationId
      );

      res.json(
        ApiResponse.success(result, `Deactivated ${result.successCount} of ${result.total} users`)
      );
    } catch (error) {
      next(error);
    }
  };

  // Role Preset Endpoints

  getRolePresets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const presets = await this.userService.getRolePresets(req.correlationId);

      res.json(ApiResponse.success(presets));
    } catch (error) {
      next(error);
    }
  };

  getRolePresetsByDepartment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const presets = await this.userService.getRolePresetsByDepartment(
        req.params.department,
        req.correlationId
      );

      res.json(ApiResponse.success(presets));
    } catch (error) {
      next(error);
    }
  };
}
