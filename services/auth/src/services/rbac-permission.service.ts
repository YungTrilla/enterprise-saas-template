/**
 * RBAC Permission Management Service
 * Handles permission creation and management
 */

import { v4 as uuidv4 } from 'uuid';
import { EntityId, CorrelationId } from '@template/shared-types';
import { IPermission } from '../types/auth';
import { AuthRepository } from '../database/repository';
import { CorrelatedLogger } from '../utils/logger';

export class RbacPermissionService {
  private authRepository: AuthRepository;
  private logger: CorrelatedLogger;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
    this.logger = new CorrelatedLogger('rbac-permission-service');
  }

  /**
   * Create new permission
   */
  async createPermission(
    resource: string,
    action: string,
    description: string,
    createdBy: EntityId,
    correlationId: CorrelationId
  ): Promise<IPermission> {
    this.logger.setCorrelationId(correlationId);

    try {
      // Check if permission already exists
      const existingPermission = await this.authRepository.getPermissionByResourceAction(
        resource,
        action,
        correlationId
      );
      
      if (existingPermission) {
        throw new Error(`Permission '${resource}:${action}' already exists`);
      }

      // Create permission
      const permission: IPermission = {
        id: uuidv4() as EntityId,
        resource,
        action,
        description,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy,
        updatedBy: createdBy
      };

      await this.authRepository.createPermission(permission, correlationId);

      this.logger.info('Permission created successfully', {
        permissionId: permission.id,
        resource,
        action,
        createdBy
      });

      return permission;

    } catch (error) {
      this.logger.error('Failed to create permission', {
        resource,
        action,
        createdBy,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * List all permissions
   */
  async listPermissions(correlationId: CorrelationId): Promise<IPermission[]> {
    this.logger.setCorrelationId(correlationId);

    try {
      const permissions = await this.authRepository.listPermissions(correlationId);

      this.logger.debug('Listed permissions', {
        count: permissions.length
      });

      return permissions;

    } catch (error) {
      this.logger.error('Failed to list permissions', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(
    resource: string,
    correlationId: CorrelationId
  ): Promise<IPermission[]> {
    this.logger.setCorrelationId(correlationId);

    try {
      const permissions = await this.authRepository.getPermissionsByResource(
        resource,
        correlationId
      );

      this.logger.debug('Retrieved permissions by resource', {
        resource,
        count: permissions.length
      });

      return permissions;

    } catch (error) {
      this.logger.error('Failed to get permissions by resource', {
        resource,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Update permission
   */
  async updatePermission(
    permissionId: EntityId,
    updates: Partial<IPermission>,
    updatedBy: EntityId,
    correlationId: CorrelationId
  ): Promise<IPermission> {
    this.logger.setCorrelationId(correlationId);

    try {
      const permission = await this.authRepository.getPermissionById(
        permissionId,
        correlationId
      );
      
      if (!permission) {
        throw new Error('Permission not found');
      }

      const updatedPermission = await this.authRepository.updatePermission(
        permissionId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy
        },
        correlationId
      );

      this.logger.info('Permission updated successfully', {
        permissionId,
        updates: Object.keys(updates),
        updatedBy
      });

      return updatedPermission;

    } catch (error) {
      this.logger.error('Failed to update permission', {
        permissionId,
        updatedBy,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Delete permission
   */
  async deletePermission(
    permissionId: EntityId,
    deletedBy: EntityId,
    correlationId: CorrelationId
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const permission = await this.authRepository.getPermissionById(
        permissionId,
        correlationId
      );
      
      if (!permission) {
        throw new Error('Permission not found');
      }

      // Check if permission is assigned to any roles
      const assignmentCount = await this.authRepository.getPermissionAssignmentCount(
        permissionId,
        correlationId
      );
      
      if (assignmentCount > 0) {
        throw new Error(`Cannot delete permission that is assigned to ${assignmentCount} roles`);
      }

      await this.authRepository.deletePermission(permissionId, correlationId);

      this.logger.info('Permission deleted successfully', {
        permissionId,
        resource: permission.resource,
        action: permission.action,
        deletedBy
      });

    } catch (error) {
      this.logger.error('Failed to delete permission', {
        permissionId,
        deletedBy,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Bulk create permissions for a resource
   */
  async createResourcePermissions(
    resource: string,
    actions: string[],
    createdBy: EntityId,
    correlationId: CorrelationId
  ): Promise<IPermission[]> {
    this.logger.setCorrelationId(correlationId);

    try {
      const permissions: IPermission[] = [];

      for (const action of actions) {
        try {
          const permission = await this.createPermission(
            resource,
            action,
            `${action} permission for ${resource}`,
            createdBy,
            correlationId
          );
          permissions.push(permission);
        } catch (error) {
          this.logger.warn('Failed to create permission', {
            resource,
            action,
            error: (error as Error).message
          });
        }
      }

      this.logger.info('Resource permissions created', {
        resource,
        createdCount: permissions.length,
        requestedCount: actions.length,
        createdBy
      });

      return permissions;

    } catch (error) {
      this.logger.error('Failed to create resource permissions', {
        resource,
        actions,
        createdBy,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get all unique resources with permissions
   */
  async getPermissionResources(correlationId: CorrelationId): Promise<string[]> {
    this.logger.setCorrelationId(correlationId);

    try {
      const resources = await this.authRepository.getDistinctPermissionResources(
        correlationId
      );

      this.logger.debug('Retrieved permission resources', {
        count: resources.length
      });

      return resources;

    } catch (error) {
      this.logger.error('Failed to get permission resources', {
        error: (error as Error).message
      });
      throw error;
    }
  }
}