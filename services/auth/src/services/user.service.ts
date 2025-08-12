import { AuthRepository } from '../database/repository';
import {
  IUser,
  IUserCreateInput,
  IUserUpdateInput,
  IUserFilter,
  IBulkUserDeactivateInput,
  IBulkUserActionResult,
  IRolePreset,
} from '../models/user.model';
import { CorrelationId } from '@template/shared-types';
import { ApiError } from '@template/shared-utils';
import { logger } from '../utils/logger';
import { PasswordService } from './password.service';
import { RBACService } from './rbac.service';
import { AuditService } from './audit.service';
import { RolePresetService } from './role-preset.service';

export class UserService {
  private authRepository: AuthRepository;
  private passwordService: PasswordService;
  private rbacService: RBACService;
  private auditService: AuditService;
  private rolePresetService: RolePresetService;

  constructor() {
    this.authRepository = new AuthRepository();
    this.passwordService = new PasswordService();
    this.rbacService = new RBACService();
    this.auditService = new AuditService();
    this.rolePresetService = new RolePresetService(this.authRepository.pool);
  }

  async createUser(
    data: IUserCreateInput,
    createdBy: string,
    correlationId?: CorrelationId
  ): Promise<IUser> {
    try {
      // Validate email uniqueness
      const existingUserByEmail = await this.authRepository.findUserByEmail(
        data.email,
        correlationId
      );

      if (existingUserByEmail) {
        throw new ApiError('User with this email already exists', 400);
      }

      // Validate username uniqueness
      const existingUserByUsername = await this.authRepository.findUserByUsername(
        data.username,
        correlationId
      );

      if (existingUserByUsername) {
        throw new ApiError('Username is already taken', 400);
      }

      // Hash password
      const passwordHash = await this.passwordService.hashPassword(data.password);

      // Create user
      const user = await this.authRepository.createUser(
        {
          email: data.email,
          username: data.username,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          department: data.department,
          position: data.position,
          hireDate: data.hireDate,
          defaultHoursPerWeek: data.defaultHoursPerWeek,
          hourlyRate: data.hourlyRate,
          payType: data.payType,
          salaryAmount: data.salaryAmount,
          commissionRate: data.commissionRate,
          baseSalary: data.baseSalary,
          payFrequency: data.payFrequency,
          isActive: true,
          isVerified: false,
        },
        correlationId
      );

      // Handle role assignment and pay defaults
      if (data.rolePreset) {
        // Apply role preset
        const preset = await this.rolePresetService.getPresetByName(data.rolePreset);
        if (preset) {
          await this.rolePresetService.applyPresetToUser(user.id, data.rolePreset, createdBy);

          // Apply default pay settings if not provided
          if (!data.payType && preset.defaultPayType) {
            await this.updateUser(
              user.id,
              {
                payType: preset.defaultPayType,
                commissionRate: preset.defaultCommissionRate,
              },
              createdBy,
              correlationId
            );
          }
        }
      } else if (data.roles && data.roles.length > 0) {
        // Assign specific roles
        for (const roleName of data.roles) {
          const role = await this.rbacService.getRoleByName(roleName, correlationId);
          if (role) {
            await this.authRepository.assignRole(user.id, role.id, createdBy, correlationId);
          }
        }
      } else {
        // Assign default role
        const defaultRole = await this.rbacService.getRoleByName('employee', correlationId);
        if (defaultRole) {
          await this.authRepository.assignRole(user.id, defaultRole.id, createdBy, correlationId);
        }
      }

      // Get complete user with roles
      const completeUser = await this.getUser(user.id, correlationId);

      // Audit log
      await this.auditService.logAction({
        userId: createdBy,
        action: 'user.create',
        resourceType: 'user',
        resourceId: user.id,
        metadata: { email: data.email, roles: data.roles },
        correlationId,
      });

      // TODO: Send welcome email if requested
      if (data.sendWelcomeEmail) {
        logger.info('Welcome email would be sent here', {
          userId: user.id,
          email: user.email,
          correlationId,
        });
      }

      return completeUser!;
    } catch (error) {
      logger.error('Failed to create user', { error, data, correlationId });
      throw error;
    }
  }

  async updateUser(
    userId: string,
    data: IUserUpdateInput,
    updatedBy: string,
    correlationId?: CorrelationId
  ): Promise<IUser> {
    try {
      // Check if user exists
      const existingUser = await this.getUser(userId, correlationId);
      if (!existingUser) {
        throw new ApiError('User not found', 404);
      }

      // Update user
      const user = await this.authRepository.updateUser(userId, data, correlationId);

      // Audit log
      await this.auditService.logAction({
        userId: updatedBy,
        action: 'user.update',
        resourceType: 'user',
        resourceId: userId,
        metadata: { changes: data },
        correlationId,
      });

      return user;
    } catch (error) {
      logger.error('Failed to update user', { error, userId, data, correlationId });
      throw error;
    }
  }

  async getUser(userId: string, correlationId?: CorrelationId): Promise<IUser | null> {
    try {
      const user = await this.authRepository.findUserById(userId, correlationId);
      if (!user) {
        return null;
      }

      // Get roles and permissions
      const roles = await this.authRepository.getUserRoles(userId, correlationId);
      const permissions = await this.rbacService.getUserPermissions(userId, correlationId);

      return {
        ...user,
        roles,
        permissions,
      };
    } catch (error) {
      logger.error('Failed to get user', { error, userId, correlationId });
      throw error;
    }
  }

  async listUsers(
    filter: IUserFilter,
    page: number = 1,
    limit: number = 20,
    correlationId?: CorrelationId
  ): Promise<{
    items: IUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const result = await this.authRepository.listUsers(filter, page, limit, correlationId);

      // Enrich users with roles and permissions
      const enrichedUsers = await Promise.all(
        result.items.map(async user => {
          const roles = await this.authRepository.getUserRoles(user.id, correlationId);
          const permissions = await this.rbacService.getUserPermissions(user.id, correlationId);
          return {
            ...user,
            roles,
            permissions,
          };
        })
      );

      return {
        items: enrichedUsers,
        total: result.total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to list users', { error, filter, correlationId });
      throw error;
    }
  }

  async bulkDeactivateUsers(
    data: IBulkUserDeactivateInput,
    deactivatedBy: string,
    correlationId?: CorrelationId
  ): Promise<IBulkUserActionResult> {
    try {
      const result: IBulkUserActionResult = {
        successful: [],
        failed: [],
        total: data.userIds.length,
        successCount: 0,
        failureCount: 0,
      };

      // Validate that users exist and can be deactivated
      for (const userId of data.userIds) {
        try {
          const user = await this.getUser(userId, correlationId);
          if (!user) {
            result.failed.push({
              userId,
              reason: 'User not found',
            });
            result.failureCount++;
            continue;
          }

          // Don't deactivate already inactive users
          if (!user.isActive) {
            result.failed.push({
              userId,
              reason: 'User is already inactive',
            });
            result.failureCount++;
            continue;
          }

          // Don't allow deactivating yourself
          if (userId === deactivatedBy) {
            result.failed.push({
              userId,
              reason: 'Cannot deactivate your own account',
            });
            result.failureCount++;
            continue;
          }

          result.successful.push(userId);
          result.successCount++;
        } catch (error) {
          result.failed.push({
            userId,
            reason: 'Failed to validate user',
          });
          result.failureCount++;
        }
      }

      // Perform bulk deactivation
      if (result.successful.length > 0) {
        const deactivatedCount = await this.authRepository.bulkDeactivateUsers(
          result.successful,
          deactivatedBy,
          data.reason,
          data.effectiveDate,
          correlationId
        );

        // Audit log for each deactivated user
        for (const userId of result.successful) {
          await this.auditService.logAction({
            userId: deactivatedBy,
            action: 'user.deactivate',
            resourceType: 'user',
            resourceId: userId,
            success: true,
            metadata: {
              reason: data.reason,
              effectiveDate: data.effectiveDate,
            },
            correlationId,
          });
        }
      }

      return result;
    } catch (error) {
      logger.error('Failed to bulk deactivate users', { error, data, correlationId });
      throw error;
    }
  }

  async deleteUser(
    userId: string,
    deletedBy: string,
    correlationId?: CorrelationId
  ): Promise<void> {
    try {
      // Check if user exists
      const user = await this.getUser(userId, correlationId);
      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Soft delete user
      await this.authRepository.deleteUser(userId, correlationId);

      // Audit log
      await this.auditService.logAction({
        userId: deletedBy,
        action: 'user.delete',
        resourceType: 'user',
        resourceId: userId,
        metadata: { email: user.email },
        correlationId,
      });
    } catch (error) {
      logger.error('Failed to delete user', { error, userId, correlationId });
      throw error;
    }
  }

  async activateUser(
    userId: string,
    activatedBy: string,
    correlationId?: CorrelationId
  ): Promise<IUser> {
    return this.updateUser(userId, { isActive: true }, activatedBy, correlationId);
  }

  async deactivateUser(
    userId: string,
    deactivatedBy: string,
    correlationId?: CorrelationId
  ): Promise<IUser> {
    return this.updateUser(userId, { isActive: false }, deactivatedBy, correlationId);
  }

  async assignRoles(
    userId: string,
    roleNames: string[],
    assignedBy: string,
    correlationId?: CorrelationId
  ): Promise<IUser> {
    try {
      // Get user
      const user = await this.getUser(userId, correlationId);
      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Get current roles
      const currentRoles = await this.authRepository.getUserRoles(userId, correlationId);
      const currentRoleNames = currentRoles.map(r => r.roleName);

      // Remove roles that are no longer in the list
      for (const currentRole of currentRoles) {
        if (!roleNames.includes(currentRole.roleName)) {
          await this.authRepository.removeRole(userId, currentRole.roleId, correlationId);
        }
      }

      // Add new roles
      for (const roleName of roleNames) {
        if (!currentRoleNames.includes(roleName)) {
          const role = await this.rbacService.getRoleByName(roleName, correlationId);
          if (role) {
            await this.authRepository.assignRole(userId, role.id, assignedBy, correlationId);
          }
        }
      }

      // Audit log
      await this.auditService.logAction({
        userId: assignedBy,
        action: 'user.assign_roles',
        resourceType: 'user',
        resourceId: userId,
        metadata: { roles: roleNames },
        correlationId,
      });

      // Return updated user
      return (await this.getUser(userId, correlationId))!;
    } catch (error) {
      logger.error('Failed to assign roles', { error, userId, roleNames, correlationId });
      throw error;
    }
  }

  async resetPassword(
    userId: string,
    newPassword: string,
    resetBy: string,
    correlationId?: CorrelationId
  ): Promise<void> {
    try {
      // Get user
      const user = await this.getUser(userId, correlationId);
      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Hash new password
      const passwordHash = await this.passwordService.hashPassword(newPassword);

      // Update password
      await this.authRepository.updateUserPassword(userId, passwordHash, correlationId);

      // Audit log
      await this.auditService.logAction({
        userId: resetBy,
        action: 'user.reset_password',
        resourceType: 'user',
        resourceId: userId,
        metadata: { email: user.email },
        correlationId,
      });
    } catch (error) {
      logger.error('Failed to reset password', { error, userId, correlationId });
      throw error;
    }
  }

  async getRolePresets(correlationId?: CorrelationId): Promise<IRolePreset[]> {
    try {
      return await this.rolePresetService.getAllPresets();
    } catch (error) {
      logger.error('Failed to get role presets', { error, correlationId });
      throw error;
    }
  }

  async getRolePresetsByDepartment(
    department: string,
    correlationId?: CorrelationId
  ): Promise<IRolePreset[]> {
    try {
      return await this.rolePresetService.getPresetsByDepartment(department);
    } catch (error) {
      logger.error('Failed to get role presets by department', {
        error,
        department,
        correlationId,
      });
      throw error;
    }
  }
}
