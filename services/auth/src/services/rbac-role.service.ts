/**
 * RBAC Role Management Service
 * Handles role assignment and management operations
 */

import { v4 as uuidv4 } from 'uuid';
import { EntityId, CorrelationId } from '@template/shared-types';
import { IRole } from '../types/auth';
import { AuthRepository } from '../database/repository';
import { CorrelatedLogger } from '../utils/logger';

export class RbacRoleService {
  private authRepository: AuthRepository;
  private logger: CorrelatedLogger;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
    this.logger = new CorrelatedLogger('rbac-role-service');
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: EntityId,
    roleName: string,
    assignedBy: EntityId,
    correlationId: CorrelationId,
    expiresAt?: Date
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      // Find role by name
      const role = await this.authRepository.getRoleByName(roleName, correlationId);
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      // Check if user already has this role
      const userRoles = await this.authRepository.getUserRoles(userId, correlationId);
      const hasRole = userRoles.some(ur => ur.role_id === role.id);

      if (hasRole) {
        throw new Error(`User already has role '${roleName}'`);
      }

      // Assign the role
      await this.authRepository.assignRole(userId, role.id, assignedBy, expiresAt, correlationId);

      this.logger.info('Role assigned to user', {
        userId,
        roleName,
        roleId: role.id,
        assignedBy,
        expiresAt,
      });
    } catch (error) {
      this.logger.error('Failed to assign role', {
        userId,
        roleName,
        assignedBy,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Revoke role from user
   */
  async revokeRole(
    userId: EntityId,
    roleName: string,
    revokedBy: EntityId,
    correlationId: CorrelationId
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      // Find role by name
      const role = await this.authRepository.getRoleByName(roleName, correlationId);
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      // Check if user has this role
      const userRoles = await this.authRepository.getUserRoles(userId, correlationId);
      const hasRole = userRoles.some(ur => ur.role_id === role.id);

      if (!hasRole) {
        throw new Error(`User does not have role '${roleName}'`);
      }

      // Revoke the role
      await this.authRepository.removeRole(userId, role.id, correlationId);

      this.logger.info('Role revoked from user', {
        userId,
        roleName,
        roleId: role.id,
        revokedBy,
      });
    } catch (error) {
      this.logger.error('Failed to revoke role', {
        userId,
        roleName,
        revokedBy,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Assign default role to new user
   */
  async assignDefaultRole(userId: EntityId, correlationId: CorrelationId): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const defaultRoleName = 'employee'; // Default role for new users
      await this.assignRole(userId, defaultRoleName, userId, correlationId);

      this.logger.info('Default role assigned to new user', {
        userId,
        defaultRole: defaultRoleName,
      });
    } catch (error) {
      this.logger.error('Failed to assign default role', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create new role
   */
  async createRole(
    name: string,
    description: string,
    permissions: string[],
    createdBy: EntityId,
    correlationId: CorrelationId
  ): Promise<IRole> {
    this.logger.setCorrelationId(correlationId);

    try {
      // Check if role already exists
      const existingRole = await this.authRepository.getRoleByName(name, correlationId);
      if (existingRole) {
        throw new Error(`Role '${name}' already exists`);
      }

      // Create role
      const role: IRole = {
        id: uuidv4() as EntityId,
        name,
        description,
        status: 'active',
        permissions,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy,
        updatedBy: createdBy,
      };

      await this.authRepository.createRole(role, correlationId);

      this.logger.info('Role created successfully', {
        roleId: role.id,
        name,
        permissionCount: permissions.length,
        createdBy,
      });

      return role;
    } catch (error) {
      this.logger.error('Failed to create role', {
        name,
        createdBy,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(
    roleId: EntityId,
    updates: Partial<IRole>,
    updatedBy: EntityId,
    correlationId: CorrelationId
  ): Promise<IRole> {
    this.logger.setCorrelationId(correlationId);

    try {
      const role = await this.authRepository.getRoleById(roleId, correlationId);
      if (!role) {
        throw new Error('Role not found');
      }

      if (role.isSystem) {
        throw new Error('Cannot modify system role');
      }

      const updatedRole = await this.authRepository.updateRole(
        roleId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy,
        },
        correlationId
      );

      this.logger.info('Role updated successfully', {
        roleId,
        updates: Object.keys(updates),
        updatedBy,
      });

      return updatedRole;
    } catch (error) {
      this.logger.error('Failed to update role', {
        roleId,
        updatedBy,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(
    roleId: EntityId,
    deletedBy: EntityId,
    correlationId: CorrelationId
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const role = await this.authRepository.getRoleById(roleId, correlationId);
      if (!role) {
        throw new Error('Role not found');
      }

      if (role.isSystem) {
        throw new Error('Cannot delete system role');
      }

      // Check if role is assigned to any users
      const roleAssignments = await this.authRepository.getRoleAssignmentCount(
        roleId,
        correlationId
      );
      if (roleAssignments > 0) {
        throw new Error(`Cannot delete role that is assigned to ${roleAssignments} users`);
      }

      await this.authRepository.deleteRole(roleId, correlationId);

      this.logger.info('Role deleted successfully', {
        roleId,
        roleName: role.name,
        deletedBy,
      });
    } catch (error) {
      this.logger.error('Failed to delete role', {
        roleId,
        deletedBy,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * List all roles
   */
  async listRoles(includeSystem: boolean, correlationId: CorrelationId): Promise<IRole[]> {
    this.logger.setCorrelationId(correlationId);

    try {
      const roles = await this.authRepository.listRoles(includeSystem, correlationId);

      this.logger.debug('Listed roles', {
        count: roles.length,
        includeSystem,
      });

      return roles;
    } catch (error) {
      this.logger.error('Failed to list roles', {
        includeSystem,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
