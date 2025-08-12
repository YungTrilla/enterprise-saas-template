/**
 * RBAC Core Service Unit Tests
 */

import { RbacCoreService } from '../rbac-core.service';
import { AuthRepository } from '../../database/repository';
import { createCorrelationId } from '../../__tests__/utils/test-helpers';
import { IPermissionCheck } from '../../types/auth';

describe('RbacCoreService', () => {
  let rbacCoreService: RbacCoreService;
  let mockAuthRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    mockAuthRepository = {
      getUserRoles: jest.fn(),
      getUserPermissions: jest.fn(),
    } as any;

    rbacCoreService = new RbacCoreService(mockAuthRepository);
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const mockRoles = [
        { role_id: 'role-1', role_name: 'admin' },
        { role_id: 'role-2', role_name: 'user' },
      ];

      mockAuthRepository.getUserRoles.mockResolvedValue(mockRoles as any);

      const roles = await rbacCoreService.getUserRoles(userId, correlationId);

      expect(roles).toEqual(['admin', 'user']);
      expect(mockAuthRepository.getUserRoles).toHaveBeenCalledWith(userId, correlationId);
    });

    it('should handle empty roles', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();

      mockAuthRepository.getUserRoles.mockResolvedValue([]);

      const roles = await rbacCoreService.getUserRoles(userId, correlationId);

      expect(roles).toEqual([]);
    });

    it('should handle errors', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();

      mockAuthRepository.getUserRoles.mockRejectedValue(new Error('Database error'));

      await expect(rbacCoreService.getUserRoles(userId, correlationId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const mockPermissions = ['users:read', 'users:write', 'orders:read'];

      mockAuthRepository.getUserPermissions.mockResolvedValue(mockPermissions);

      const permissions = await rbacCoreService.getUserPermissions(userId, correlationId);

      expect(permissions).toEqual(mockPermissions);
      expect(mockAuthRepository.getUserPermissions).toHaveBeenCalledWith(userId, correlationId);
    });

    it('should handle empty permissions', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();

      mockAuthRepository.getUserPermissions.mockResolvedValue([]);

      const permissions = await rbacCoreService.getUserPermissions(userId, correlationId);

      expect(permissions).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    it('should allow exact permission match', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const permissionCheck: IPermissionCheck = {
        resource: 'users',
        action: 'read',
      };

      mockAuthRepository.getUserPermissions.mockResolvedValue(['users:read', 'orders:write']);

      const result = await rbacCoreService.hasPermission(userId, permissionCheck, correlationId);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Permission granted');
      expect(result.requiredPermissions).toBeUndefined();
    });

    it('should allow resource wildcard permission', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const permissionCheck: IPermissionCheck = {
        resource: 'users',
        action: 'delete',
      };

      mockAuthRepository.getUserPermissions.mockResolvedValue(['users:*']);

      const result = await rbacCoreService.hasPermission(userId, permissionCheck, correlationId);

      expect(result.allowed).toBe(true);
    });

    it('should allow action wildcard permission', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const permissionCheck: IPermissionCheck = {
        resource: 'orders',
        action: 'read',
      };

      mockAuthRepository.getUserPermissions.mockResolvedValue(['*:read']);

      const result = await rbacCoreService.hasPermission(userId, permissionCheck, correlationId);

      expect(result.allowed).toBe(true);
    });

    it('should allow global wildcard permission', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const permissionCheck: IPermissionCheck = {
        resource: 'anything',
        action: 'everything',
      };

      mockAuthRepository.getUserPermissions.mockResolvedValue(['*:*']);

      const result = await rbacCoreService.hasPermission(userId, permissionCheck, correlationId);

      expect(result.allowed).toBe(true);
    });

    it('should deny when permission not found', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const permissionCheck: IPermissionCheck = {
        resource: 'users',
        action: 'delete',
      };

      mockAuthRepository.getUserPermissions.mockResolvedValue(['users:read', 'users:write']);

      const result = await rbacCoreService.hasPermission(userId, permissionCheck, correlationId);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Insufficient permissions');
      expect(result.requiredPermissions).toEqual(['users:delete']);
    });

    it('should handle errors gracefully', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const permissionCheck: IPermissionCheck = {
        resource: 'users',
        action: 'read',
      };

      mockAuthRepository.getUserPermissions.mockRejectedValue(new Error('Database error'));

      const result = await rbacCoreService.hasPermission(userId, permissionCheck, correlationId);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Permission check error');
      expect(result.requiredPermissions).toEqual(['users:read']);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has any required role', async () => {
      const userId = 'user-123';
      const requiredRoles = ['admin', 'manager'];
      const correlationId = createCorrelationId();

      const mockUserRoles = [
        { role_id: 'role-1', role_name: 'user' },
        { role_id: 'role-2', role_name: 'manager' },
      ];

      mockAuthRepository.getUserRoles.mockResolvedValue(mockUserRoles as any);

      const hasRole = await rbacCoreService.hasAnyRole(userId, requiredRoles, correlationId);

      expect(hasRole).toBe(true);
    });

    it('should return false if user has none of the required roles', async () => {
      const userId = 'user-123';
      const requiredRoles = ['admin', 'manager'];
      const correlationId = createCorrelationId();

      const mockUserRoles = [
        { role_id: 'role-1', role_name: 'user' },
        { role_id: 'role-2', role_name: 'guest' },
      ];

      mockAuthRepository.getUserRoles.mockResolvedValue(mockUserRoles as any);

      const hasRole = await rbacCoreService.hasAnyRole(userId, requiredRoles, correlationId);

      expect(hasRole).toBe(false);
    });

    it('should handle empty required roles', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();

      const hasRole = await rbacCoreService.hasAnyRole(userId, [], correlationId);

      expect(hasRole).toBe(false);
    });

    it('should handle errors and return false', async () => {
      const userId = 'user-123';
      const requiredRoles = ['admin'];
      const correlationId = createCorrelationId();

      mockAuthRepository.getUserRoles.mockRejectedValue(new Error('Database error'));

      const hasRole = await rbacCoreService.hasAnyRole(userId, requiredRoles, correlationId);

      expect(hasRole).toBe(false);
    });
  });

  describe('hasAllRoles', () => {
    it('should return true if user has all required roles', async () => {
      const userId = 'user-123';
      const requiredRoles = ['user', 'manager'];
      const correlationId = createCorrelationId();

      const mockUserRoles = [
        { role_id: 'role-1', role_name: 'user' },
        { role_id: 'role-2', role_name: 'manager' },
        { role_id: 'role-3', role_name: 'admin' },
      ];

      mockAuthRepository.getUserRoles.mockResolvedValue(mockUserRoles as any);

      const hasAllRoles = await rbacCoreService.hasAllRoles(userId, requiredRoles, correlationId);

      expect(hasAllRoles).toBe(true);
    });

    it('should return false if user missing any required role', async () => {
      const userId = 'user-123';
      const requiredRoles = ['admin', 'manager'];
      const correlationId = createCorrelationId();

      const mockUserRoles = [
        { role_id: 'role-1', role_name: 'user' },
        { role_id: 'role-2', role_name: 'manager' },
      ];

      mockAuthRepository.getUserRoles.mockResolvedValue(mockUserRoles as any);

      const hasAllRoles = await rbacCoreService.hasAllRoles(userId, requiredRoles, correlationId);

      expect(hasAllRoles).toBe(false);
    });

    it('should return true for empty required roles', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();

      const hasAllRoles = await rbacCoreService.hasAllRoles(userId, [], correlationId);

      expect(hasAllRoles).toBe(true);
    });
  });

  describe('hasPermissions', () => {
    it('should check multiple permissions with AND logic', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const permissionChecks: IPermissionCheck[] = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
      ];

      mockAuthRepository.getUserPermissions.mockResolvedValue(['users:read', 'users:write']);

      const result = await rbacCoreService.hasPermissions(
        userId,
        permissionChecks,
        true, // requireAll
        correlationId
      );

      expect(result.allowed).toBe(true);
    });

    it('should check multiple permissions with OR logic', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const permissionChecks: IPermissionCheck[] = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'delete' },
      ];

      mockAuthRepository.getUserPermissions.mockResolvedValue(['users:read']);

      const result = await rbacCoreService.hasPermissions(
        userId,
        permissionChecks,
        false, // requireAll
        correlationId
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Permission granted');
    });

    it('should fail AND check when missing permissions', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const permissionChecks: IPermissionCheck[] = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'delete' },
      ];

      mockAuthRepository.getUserPermissions.mockResolvedValue(['users:read']);

      const result = await rbacCoreService.hasPermissions(
        userId,
        permissionChecks,
        true, // requireAll
        correlationId
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing one or more required permissions');
      expect(result.requiredPermissions).toContain('users:delete');
    });

    it('should fail OR check when no permissions match', async () => {
      const userId = 'user-123';
      const correlationId = createCorrelationId();
      const permissionChecks: IPermissionCheck[] = [
        { resource: 'users', action: 'delete' },
        { resource: 'orders', action: 'delete' },
      ];

      mockAuthRepository.getUserPermissions.mockResolvedValue(['users:read', 'orders:read']);

      const result = await rbacCoreService.hasPermissions(
        userId,
        permissionChecks,
        false, // requireAll
        correlationId
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('None of the required permissions found');
      expect(result.requiredPermissions).toEqual(['users:delete', 'orders:delete']);
    });
  });
});
