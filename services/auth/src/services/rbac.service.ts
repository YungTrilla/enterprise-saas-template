/**
 * RBAC Service Facade
 * Orchestrates role-based access control operations across specialized services
 */

import { EntityId, CorrelationId } from '@template/shared-types';
import {
  IRole,
  IPermission,
  IPermissionCheck,
  IAuthorizationResult
} from '../types/auth';
import { AuthRepository } from '../database/repository';
import { RbacCoreService } from './rbac-core.service';
import { RbacRoleService } from './rbac-role.service';
import { RbacPermissionService } from './rbac-permission.service';

export class RbacService {
  private rbacCoreService: RbacCoreService;
  private rbacRoleService: RbacRoleService;
  private rbacPermissionService: RbacPermissionService;

  constructor() {
    const authRepository = new AuthRepository();
    
    // Initialize specialized services
    this.rbacCoreService = new RbacCoreService(authRepository);
    this.rbacRoleService = new RbacRoleService(authRepository);
    this.rbacPermissionService = new RbacPermissionService(authRepository);
  }

  // Core authorization operations
  async getUserRoles(userId: EntityId, correlationId: CorrelationId): Promise<string[]> {
    return this.rbacCoreService.getUserRoles(userId, correlationId);
  }

  async getUserPermissions(userId: EntityId, correlationId: CorrelationId): Promise<string[]> {
    return this.rbacCoreService.getUserPermissions(userId, correlationId);
  }

  async hasPermission(
    userId: EntityId,
    permissionCheck: IPermissionCheck,
    correlationId: CorrelationId
  ): Promise<IAuthorizationResult> {
    return this.rbacCoreService.hasPermission(userId, permissionCheck, correlationId);
  }

  async hasAnyRole(
    userId: EntityId,
    requiredRoles: string[],
    correlationId: CorrelationId
  ): Promise<boolean> {
    return this.rbacCoreService.hasAnyRole(userId, requiredRoles, correlationId);
  }

  async hasAllRoles(
    userId: EntityId,
    requiredRoles: string[],
    correlationId: CorrelationId
  ): Promise<boolean> {
    return this.rbacCoreService.hasAllRoles(userId, requiredRoles, correlationId);
  }

  async hasPermissions(
    userId: EntityId,
    permissionChecks: IPermissionCheck[],
    requireAll: boolean,
    correlationId: CorrelationId
  ): Promise<IAuthorizationResult> {
    return this.rbacCoreService.hasPermissions(userId, permissionChecks, requireAll, correlationId);
  }

  // Role management operations
  async assignRole(
    userId: EntityId,
    roleName: string,
    assignedBy: EntityId,
    correlationId: CorrelationId,
    expiresAt?: Date
  ): Promise<void> {
    return this.rbacRoleService.assignRole(userId, roleName, assignedBy, correlationId, expiresAt);
  }

  async revokeRole(
    userId: EntityId,
    roleName: string,
    revokedBy: EntityId,
    correlationId: CorrelationId
  ): Promise<void> {
    return this.rbacRoleService.revokeRole(userId, roleName, revokedBy, correlationId);
  }

  async assignDefaultRole(userId: EntityId, correlationId: CorrelationId): Promise<void> {
    return this.rbacRoleService.assignDefaultRole(userId, correlationId);
  }

  async createRole(
    name: string,
    description: string,
    permissions: string[],
    createdBy: EntityId,
    correlationId: CorrelationId
  ): Promise<IRole> {
    return this.rbacRoleService.createRole(name, description, permissions, createdBy, correlationId);
  }

  async updateRole(
    roleId: EntityId,
    updates: Partial<IRole>,
    updatedBy: EntityId,
    correlationId: CorrelationId
  ): Promise<IRole> {
    return this.rbacRoleService.updateRole(roleId, updates, updatedBy, correlationId);
  }

  async deleteRole(
    roleId: EntityId,
    deletedBy: EntityId,
    correlationId: CorrelationId
  ): Promise<void> {
    return this.rbacRoleService.deleteRole(roleId, deletedBy, correlationId);
  }

  async listRoles(
    includeSystem: boolean,
    correlationId: CorrelationId
  ): Promise<IRole[]> {
    return this.rbacRoleService.listRoles(includeSystem, correlationId);
  }

  // Permission management operations
  async createPermission(
    resource: string,
    action: string,
    description: string,
    createdBy: EntityId,
    correlationId: CorrelationId
  ): Promise<IPermission> {
    return this.rbacPermissionService.createPermission(
      resource,
      action,
      description,
      createdBy,
      correlationId
    );
  }

  async updatePermission(
    permissionId: EntityId,
    updates: Partial<IPermission>,
    updatedBy: EntityId,
    correlationId: CorrelationId
  ): Promise<IPermission> {
    return this.rbacPermissionService.updatePermission(
      permissionId,
      updates,
      updatedBy,
      correlationId
    );
  }

  async deletePermission(
    permissionId: EntityId,
    deletedBy: EntityId,
    correlationId: CorrelationId
  ): Promise<void> {
    return this.rbacPermissionService.deletePermission(permissionId, deletedBy, correlationId);
  }

  async listPermissions(correlationId: CorrelationId): Promise<IPermission[]> {
    return this.rbacPermissionService.listPermissions(correlationId);
  }

  async getPermissionsByResource(
    resource: string,
    correlationId: CorrelationId
  ): Promise<IPermission[]> {
    return this.rbacPermissionService.getPermissionsByResource(resource, correlationId);
  }

  async createResourcePermissions(
    resource: string,
    actions: string[],
    createdBy: EntityId,
    correlationId: CorrelationId
  ): Promise<IPermission[]> {
    return this.rbacPermissionService.createResourcePermissions(
      resource,
      actions,
      createdBy,
      correlationId
    );
  }

  async getPermissionResources(correlationId: CorrelationId): Promise<string[]> {
    return this.rbacPermissionService.getPermissionResources(correlationId);
  }
}