import { BaseServiceClient } from './base-service';
import { ApiResponse, ServiceConfig } from '../types';
import { IEmployee, IPermission } from '@template/shared-types';

// Role interface (temporary until added to shared-types)
export interface IRole {
  id: string;
  name: string;
  description?: string;
  permissions: IPermission[];
  createdAt: string;
  updatedAt: string;
}

// Auth-specific types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: IEmployee;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  permissions: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateUserRoleRequest {
  userId: string;
  roleId: string;
}

/**
 * Auth Service Client
 * Handles authentication, authorization, user management, and RBAC operations
 */
export class AuthServiceClient extends BaseServiceClient {
  constructor(config: ServiceConfig) {
    super('auth-service', config);
  }

  // ========================================
  // Authentication Operations
  // ========================================

  /**
   * User login with email and password
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await this.post<LoginResponse>('/auth/login', credentials, {
      skipAuth: true, // Login doesn't require existing auth
    });

    // Store tokens after successful login
    if (response.success && response.data) {
      this.setAuthTokens(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.expiresAt
      );
    }

    return response;
  }

  /**
   * User logout
   */
  async logout(): Promise<ApiResponse<void>> {
    const response = await this.post<void>('/auth/logout');

    // Clear tokens after logout
    this.clearAuthTokens();

    return response;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> {
    const response = await this.post<RefreshTokenResponse>('/auth/refresh', request, {
      skipAuth: true,
    });

    // Update stored tokens
    if (response.success && response.data) {
      this.setAuthTokens(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.expiresAt
      );
    }

    return response;
  }

  /**
   * Verify current token and get user info
   */
  async verifyToken(): Promise<ApiResponse<{ user: IUser; permissions: string[] }>> {
    return this.get('/auth/verify');
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/auth/reset-password', request, { skipAuth: true });
  }

  /**
   * Change user password
   */
  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/auth/change-password', request);
  }

  // ========================================
  // User Management Operations
  // ========================================

  /**
   * Register new user
   */
  async registerUser(request: RegisterUserRequest): Promise<ApiResponse<IUser>> {
    return this.post<IUser>('/users', request);
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<ApiResponse<IUser>> {
    return this.get<IUser>(`/users/${userId}`);
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<IUser>> {
    return this.get<IUser>('/users/me');
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<IUser>): Promise<ApiResponse<IUser>> {
    return this.patch<IUser>(`/users/${userId}`, updates);
  }

  /**
   * Update current user profile
   */
  async updateCurrentUser(updates: Partial<IUser>): Promise<ApiResponse<IUser>> {
    return this.patch<IUser>('/users/me', updates);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/users/${userId}`);
  }

  /**
   * Get all users with pagination
   */
  async getUsers(
    page?: number,
    limit?: number,
    filters?: Record<string, any>
  ): Promise<ApiResponse<IUser[]>> {
    return this.getPaginated<IUser>('/users', page, limit, filters);
  }

  /**
   * Search users
   */
  async searchUsers(query: string, filters?: Record<string, any>): Promise<ApiResponse<IUser[]>> {
    return this.search<IUser>('/users', query, filters);
  }

  // ========================================
  // Role-Based Access Control (RBAC)
  // ========================================

  /**
   * Create new role
   */
  async createRole(request: CreateRoleRequest): Promise<ApiResponse<IRole>> {
    return this.post<IRole>('/roles', request);
  }

  /**
   * Get role by ID
   */
  async getRole(roleId: string): Promise<ApiResponse<IRole>> {
    return this.get<IRole>(`/roles/${roleId}`);
  }

  /**
   * Update role
   */
  async updateRole(roleId: string, updates: Partial<IRole>): Promise<ApiResponse<IRole>> {
    return this.patch<IRole>(`/roles/${roleId}`, updates);
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/roles/${roleId}`);
  }

  /**
   * Get all roles
   */
  async getRoles(): Promise<ApiResponse<IRole[]>> {
    return this.get<IRole[]>('/roles');
  }

  /**
   * Assign role to user
   */
  async assignUserRole(request: UpdateUserRoleRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/users/assign-role', request);
  }

  /**
   * Remove role from user
   */
  async removeUserRole(request: UpdateUserRoleRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/users/remove-role', request);
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<ApiResponse<IRole[]>> {
    return this.get<IRole[]>(`/users/${userId}/roles`);
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string): Promise<ApiResponse<string[]>> {
    return this.get<string[]>(`/users/${userId}/permissions`);
  }

  // ========================================
  // Permission Management
  // ========================================

  /**
   * Get all available permissions
   */
  async getPermissions(): Promise<ApiResponse<IPermission[]>> {
    return this.get<IPermission[]>('/permissions');
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(userId: string, permission: string): Promise<ApiResponse<boolean>> {
    return this.get<boolean>(`/users/${userId}/permissions/${permission}/check`);
  }

  /**
   * Check if current user has specific permission
   */
  async checkCurrentUserPermission(permission: string): Promise<ApiResponse<boolean>> {
    return this.get<boolean>(`/users/me/permissions/${permission}/check`);
  }

  // ========================================
  // Multi-Factor Authentication
  // ========================================

  /**
   * Enable MFA for user
   */
  async enableMFA(): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
    return this.post('/auth/mfa/enable');
  }

  /**
   * Verify MFA setup
   */
  async verifyMFA(token: string): Promise<ApiResponse<{ recoveryCodes: string[] }>> {
    return this.post('/auth/mfa/verify', { token });
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(token: string): Promise<ApiResponse<void>> {
    return this.post('/auth/mfa/disable', { token });
  }
}
