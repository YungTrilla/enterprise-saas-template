/**
 * Core RBAC Service
 * Handles permission checking and authorization logic
 */

import { EntityId, CorrelationId } from '@abyss/shared-types';
import {
  IPermissionCheck,
  IAuthorizationResult
} from '../types/auth';
import { AuthRepository } from '../database/repository';
import { CorrelatedLogger } from '../utils/logger';

export class RbacCoreService {
  private authRepository: AuthRepository;
  private logger: CorrelatedLogger;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
    this.logger = new CorrelatedLogger('rbac-core-service');
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: EntityId, correlationId: CorrelationId): Promise<string[]> {
    this.logger.setCorrelationId(correlationId);

    try {
      const userRoles = await this.authRepository.getUserRoles(userId, correlationId);
      const roleNames = userRoles.map(ur => ur.role_name);

      this.logger.debug('Retrieved user roles', {
        userId,
        roleCount: roleNames.length,
        roles: roleNames
      });

      return roleNames;

    } catch (error) {
      this.logger.error('Failed to get user roles', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get user permissions (direct and through roles)
   */
  async getUserPermissions(userId: EntityId, correlationId: CorrelationId): Promise<string[]> {
    this.logger.setCorrelationId(correlationId);

    try {
      const permissions = await this.authRepository.getUserPermissions(userId, correlationId);

      this.logger.debug('Retrieved user permissions', {
        userId,
        permissionCount: permissions.length
      });

      return permissions;

    } catch (error) {
      this.logger.error('Failed to get user permissions', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: EntityId,
    permissionCheck: IPermissionCheck,
    correlationId: CorrelationId
  ): Promise<IAuthorizationResult> {
    this.logger.setCorrelationId(correlationId);

    try {
      const userPermissions = await this.getUserPermissions(userId, correlationId);
      const requiredPermission = `${permissionCheck.resource}:${permissionCheck.action}`;

      // Check for exact permission match
      const hasExactPermission = userPermissions.includes(requiredPermission);

      // Check for wildcard permissions
      const resourceWildcard = `${permissionCheck.resource}:*`;
      const actionWildcard = `*:${permissionCheck.action}`;
      const allWildcard = '*:*';

      const hasWildcardPermission = userPermissions.some(permission =>
        permission === resourceWildcard ||
        permission === actionWildcard ||
        permission === allWildcard
      );

      const allowed = hasExactPermission || hasWildcardPermission;

      // Check conditions if provided
      if (allowed && permissionCheck.conditions) {
        // TODO: Implement condition checking logic
        // For now, we'll assume conditions are satisfied
      }

      this.logger.debug('Permission check completed', {
        userId,
        resource: permissionCheck.resource,
        action: permissionCheck.action,
        allowed,
        requiredPermission
      });

      return {
        allowed,
        reason: allowed ? 'Permission granted' : 'Insufficient permissions',
        requiredPermissions: allowed ? undefined : [requiredPermission]
      };

    } catch (error) {
      this.logger.error('Permission check failed', {
        userId,
        resource: permissionCheck.resource,
        action: permissionCheck.action,
        error: (error as Error).message
      });

      return {
        allowed: false,
        reason: 'Permission check error',
        requiredPermissions: [`${permissionCheck.resource}:${permissionCheck.action}`]
      };
    }
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(
    userId: EntityId,
    requiredRoles: string[],
    correlationId: CorrelationId
  ): Promise<boolean> {
    this.logger.setCorrelationId(correlationId);

    try {
      const userRoles = await this.getUserRoles(userId, correlationId);
      const hasRole = requiredRoles.some(role => userRoles.includes(role));

      this.logger.debug('Role check completed', {
        userId,
        requiredRoles,
        userRoles,
        hasRole
      });

      return hasRole;

    } catch (error) {
      this.logger.error('Role check failed', {
        userId,
        requiredRoles,
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Check if user has all of the specified roles
   */
  async hasAllRoles(
    userId: EntityId,
    requiredRoles: string[],
    correlationId: CorrelationId
  ): Promise<boolean> {
    this.logger.setCorrelationId(correlationId);

    try {
      const userRoles = await this.getUserRoles(userId, correlationId);
      const hasAllRoles = requiredRoles.every(role => userRoles.includes(role));

      this.logger.debug('All roles check completed', {
        userId,
        requiredRoles,
        userRoles,
        hasAllRoles
      });

      return hasAllRoles;

    } catch (error) {
      this.logger.error('All roles check failed', {
        userId,
        requiredRoles,
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Check multiple permissions with AND/OR logic
   */
  async hasPermissions(
    userId: EntityId,
    permissionChecks: IPermissionCheck[],
    requireAll: boolean,
    correlationId: CorrelationId
  ): Promise<IAuthorizationResult> {
    this.logger.setCorrelationId(correlationId);

    try {
      const results = await Promise.all(
        permissionChecks.map(check => this.hasPermission(userId, check, correlationId))
      );

      const allowed = requireAll
        ? results.every(r => r.allowed)
        : results.some(r => r.allowed);

      const failedPermissions = results
        .filter(r => !r.allowed)
        .flatMap(r => r.requiredPermissions || []);

      return {
        allowed,
        reason: allowed 
          ? 'Permission granted' 
          : requireAll 
            ? 'Missing one or more required permissions' 
            : 'None of the required permissions found',
        requiredPermissions: allowed ? undefined : failedPermissions
      };

    } catch (error) {
      this.logger.error('Multiple permission check failed', {
        userId,
        permissionCount: permissionChecks.length,
        error: (error as Error).message
      });

      return {
        allowed: false,
        reason: 'Permission check error',
        requiredPermissions: permissionChecks.map(
          check => `${check.resource}:${check.action}`
        )
      };
    }
  }
}