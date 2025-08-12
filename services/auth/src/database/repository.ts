/**
 * Database Repository Layer
 * Centralized database operations for auth service
 */

import { Pool, PoolClient } from 'pg';
import { EntityId, CorrelationId } from '@template/shared-types';
import { getDatabaseConfig } from '@template/shared-config';
import {
  IUser,
  IRole,
  IPermission,
  IUserSession,
  IAuthAuditLog,
  ISecurityEvent,
  AuthAuditAction,
  SecurityEventType,
  SecuritySeverity,
  ILoginCredentials,
  IRegistrationData,
  IPermissionCheck,
  IPermissionResult,
  IUserFilter,
  IUserCreateData,
  ISchedule,
  IScheduleCreateData,
  ITimeOffRequest,
  ITimeOffRequestData,
  IUserRole,
} from '../types/auth';
import { CorrelatedLogger } from '../utils/logger';
import { UserRepository } from './user.repository';
import { RoleRepository } from './role.repository';
import { ScheduleRepository } from './schedule.repository';
import { TimeOffRepository } from './timeoff.repository';

export class AuthRepository {
  private pool: Pool;
  private logger: CorrelatedLogger;

  // Delegated repositories
  public readonly userRepo: UserRepository;
  public readonly roleRepo: RoleRepository;
  public readonly scheduleRepo: ScheduleRepository;
  public readonly timeOffRepo: TimeOffRepository;

  constructor() {
    this.logger = new CorrelatedLogger('auth-repository');
    this.initializeDatabase();

    // Initialize sub-repositories
    this.userRepo = new UserRepository(this.pool);
    this.roleRepo = new RoleRepository(this.pool);
    this.scheduleRepo = new ScheduleRepository(this.pool);
    this.timeOffRepo = new TimeOffRepository(this.pool);
  }

  private initializeDatabase() {
    const dbConfig = getDatabaseConfig();

    this.pool = new Pool({
      host: dbConfig.DB_HOST,
      port: dbConfig.DB_PORT,
      database: dbConfig.DB_NAME,
      user: dbConfig.DB_USER,
      password: dbConfig.DB_PASSWORD,
      ssl: dbConfig.DB_SSL_ENABLED
        ? {
            rejectUnauthorized: dbConfig.DB_SSL_REJECT_UNAUTHORIZED,
            ca: dbConfig.DB_SSL_CA,
            cert: dbConfig.DB_SSL_CERT,
            key: dbConfig.DB_SSL_KEY,
          }
        : false,
      max: dbConfig.DB_POOL_MAX,
      min: dbConfig.DB_POOL_MIN,
      idleTimeoutMillis: dbConfig.DB_POOL_IDLE_TIMEOUT,
      connectionTimeoutMillis: dbConfig.DB_CONNECTION_TIMEOUT,
      query_timeout: dbConfig.DB_QUERY_TIMEOUT,
    });

    // Handle pool errors
    this.pool.on('error', err => {
      this.logger.error('Database pool error', {
        error: err.message,
        stack: err.stack,
      });
    });
  }

  // Delegate user methods to UserRepository
  async findUserById(userId: string, correlationId?: CorrelationId): Promise<IUser | null> {
    return this.userRepo.findUserById(userId, correlationId);
  }

  async findUserByEmail(email: string, correlationId?: CorrelationId): Promise<IUser | null> {
    return this.userRepo.findUserByEmail(email, correlationId);
  }

  async createUser(userData: IUserCreateData, correlationId?: CorrelationId): Promise<IUser> {
    return this.userRepo.createUser(userData, correlationId);
  }

  async updateUser(
    userId: string,
    data: Partial<IUser>,
    correlationId?: CorrelationId
  ): Promise<IUser> {
    return this.userRepo.updateUser(userId, data, correlationId);
  }

  async deleteUser(userId: string, correlationId?: CorrelationId): Promise<void> {
    return this.userRepo.deleteUser(userId, correlationId);
  }

  async listUsers(
    filter: IUserFilter,
    page: number,
    limit: number,
    correlationId?: CorrelationId
  ): Promise<{ items: IUser[]; total: number }> {
    return this.userRepo.listUsers(filter, page, limit, correlationId);
  }

  async updateUserPassword(
    userId: string,
    passwordHash: string,
    correlationId?: CorrelationId
  ): Promise<void> {
    return this.userRepo.updateUserPassword(userId, passwordHash, correlationId);
  }

  async getUserById(userId: string, correlationId?: CorrelationId): Promise<IUser | null> {
    return this.userRepo.findUserById(userId, correlationId);
  }

  async getUserByEmail(email: string, correlationId?: CorrelationId): Promise<IUser | null> {
    return this.userRepo.findUserByEmail(email, correlationId);
  }

  async getUserByPasswordResetToken(
    token: string,
    correlationId?: CorrelationId
  ): Promise<IUser | null> {
    const query = 'SELECT * FROM users WHERE password_reset_token = $1 AND deleted_at IS NULL';
    const result = await this.executeQuery<IUser>(query, [token], correlationId);
    return result[0] || null;
  }

  async getUserByEmailVerificationToken(
    token: string,
    correlationId?: CorrelationId
  ): Promise<IUser | null> {
    const query = 'SELECT * FROM users WHERE email_verification_token = $1 AND deleted_at IS NULL';
    const result = await this.executeQuery<IUser>(query, [token], correlationId);
    return result[0] || null;
  }

  async revokeAllUserSessions(
    userId: string,
    revokedBy: string,
    reason: string,
    correlationId?: CorrelationId
  ): Promise<void> {
    const query = `
      UPDATE user_sessions 
      SET is_active = false, revoked_at = NOW(), revoked_by = $2, revocation_reason = $3
      WHERE user_id = $1 AND is_active = true
    `;
    await this.executeQuery(query, [userId, revokedBy, reason], correlationId);
  }

  // Delegate role methods to RoleRepository
  async getUserRoles(userId: string, correlationId?: CorrelationId): Promise<IUserRole[]> {
    return this.roleRepo.getUserRoles(userId, correlationId);
  }

  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    correlationId?: CorrelationId
  ) {
    return this.roleRepo.assignRole(userId, roleId, assignedBy, correlationId);
  }

  async removeRole(userId: string, roleId: string, correlationId?: CorrelationId) {
    return this.roleRepo.removeRole(userId, roleId, correlationId);
  }

  async getRoleByName(roleName: string, correlationId?: CorrelationId): Promise<IRole | null> {
    return this.roleRepo.getRoleByName(roleName, correlationId);
  }

  async getUserPermissions(userId: string, correlationId?: CorrelationId): Promise<string[]> {
    return this.roleRepo.getUserPermissions(userId, correlationId);
  }

  // Delegate schedule methods to ScheduleRepository
  async createSchedule(
    data: IScheduleCreateData,
    correlationId?: CorrelationId
  ): Promise<ISchedule> {
    return this.scheduleRepo.createSchedule(data, correlationId);
  }

  async updateSchedule(
    scheduleId: string,
    data: Partial<ISchedule>,
    correlationId?: CorrelationId
  ): Promise<ISchedule> {
    return this.scheduleRepo.updateSchedule(scheduleId, data, correlationId);
  }

  async getSchedule(scheduleId: string, correlationId?: CorrelationId): Promise<ISchedule | null> {
    return this.scheduleRepo.getSchedule(scheduleId, correlationId);
  }

  async deleteSchedule(scheduleId: string, correlationId?: CorrelationId): Promise<void> {
    return this.scheduleRepo.deleteSchedule(scheduleId, correlationId);
  }

  async updateScheduleStatus(scheduleId: string, status: string, correlationId?: CorrelationId) {
    return this.scheduleRepo.updateScheduleStatus(scheduleId, status, correlationId);
  }

  async getUserSchedules(
    userId: string,
    startDate: Date,
    endDate: Date,
    correlationId?: CorrelationId
  ): Promise<ISchedule[]> {
    return this.scheduleRepo.getUserSchedules(userId, startDate, endDate, correlationId);
  }

  async getSchedulesByDate(
    date: Date,
    department?: string,
    correlationId?: CorrelationId
  ): Promise<ISchedule[]> {
    return this.scheduleRepo.getSchedulesByDate(date, department, correlationId);
  }

  async getSchedulesByDateRange(
    startDate: Date,
    endDate: Date,
    department?: string,
    correlationId?: CorrelationId
  ): Promise<ISchedule[]> {
    return this.scheduleRepo.getSchedulesByDateRange(startDate, endDate, department, correlationId);
  }

  // Delegate time off methods to TimeOffRepository
  async createTimeOffRequest(
    data: ITimeOffRequestData,
    correlationId?: CorrelationId
  ): Promise<ITimeOffRequest> {
    return this.timeOffRepo.createTimeOffRequest(data, correlationId);
  }

  async getTimeOffRequests(
    userId: string,
    startDate: Date,
    endDate: Date,
    correlationId?: CorrelationId
  ): Promise<ITimeOffRequest[]> {
    return this.timeOffRepo.getTimeOffRequests(userId, startDate, endDate, correlationId);
  }

  async updateTimeOffStatus(
    requestId: string,
    status: string,
    approvedBy: string,
    correlationId?: CorrelationId
  ): Promise<ITimeOffRequest> {
    return this.timeOffRepo.updateTimeOffStatus(requestId, status, approvedBy, correlationId);
  }

  async getTimeOffRequest(
    requestId: string,
    correlationId?: CorrelationId
  ): Promise<ITimeOffRequest | null> {
    return this.timeOffRepo.getTimeOffRequest(requestId, correlationId);
  }

  async getUserTimeOffRequests(
    userId: string,
    year?: number,
    correlationId?: CorrelationId
  ): Promise<ITimeOffRequest[]> {
    return this.timeOffRepo.getUserTimeOffRequests(userId, correlationId);
  }

  async getPendingTimeOffRequests(
    department?: string,
    correlationId?: CorrelationId
  ): Promise<ITimeOffRequest[]> {
    return this.timeOffRepo.getPendingTimeOffRequests(department, correlationId);
  }

  // Additional RBAC methods
  async getRoleById(roleId: string, correlationId?: CorrelationId): Promise<IRole | null> {
    const query = 'SELECT * FROM roles WHERE id = $1';
    const result = await this.executeQuery<IRole>(query, [roleId], correlationId);
    return result[0] || null;
  }

  async createRole(role: IRole, correlationId?: CorrelationId): Promise<void> {
    const query = `
      INSERT INTO roles (id, name, description, status, is_system, created_at, updated_at, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7)
    `;
    await this.executeQuery(
      query,
      [
        role.id,
        role.name,
        role.description,
        role.status || 'active',
        role.isSystem || false,
        role.createdBy,
        role.updatedBy,
      ],
      correlationId
    );
  }

  async updateRole(
    roleId: string,
    updates: Partial<IRole>,
    correlationId?: CorrelationId
  ): Promise<IRole> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    fields.push('updated_at = NOW()');
    values.push(roleId);

    const query = `
      UPDATE roles 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.executeQuery<IRole>(query, values, correlationId);
    return result[0];
  }

  async deleteRole(roleId: string, correlationId?: CorrelationId): Promise<void> {
    const query = 'DELETE FROM roles WHERE id = $1 AND is_system = false';
    await this.executeQuery(query, [roleId], correlationId);
  }

  async listRoles(includeSystem: boolean, correlationId?: CorrelationId): Promise<IRole[]> {
    const query = includeSystem
      ? 'SELECT * FROM roles ORDER BY name'
      : 'SELECT * FROM roles WHERE is_system = false ORDER BY name';
    return this.executeQuery<IRole>(query, [], correlationId);
  }

  async getRoleAssignmentCount(roleId: string, correlationId?: CorrelationId): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1';
    const result = await this.executeQuery<{ count: string }>(query, [roleId], correlationId);
    return parseInt(result[0].count, 10);
  }

  // Permission methods
  async getPermissionById(
    permissionId: string,
    correlationId?: CorrelationId
  ): Promise<IPermission | null> {
    const query = 'SELECT * FROM permissions WHERE id = $1';
    const result = await this.executeQuery<IPermission>(query, [permissionId], correlationId);
    return result[0] || null;
  }

  async getPermissionByResourceAction(
    resource: string,
    action: string,
    correlationId?: CorrelationId
  ): Promise<IPermission | null> {
    const query = 'SELECT * FROM permissions WHERE resource = $1 AND action = $2';
    const result = await this.executeQuery<IPermission>(query, [resource, action], correlationId);
    return result[0] || null;
  }

  async createPermission(permission: IPermission, correlationId?: CorrelationId): Promise<void> {
    const query = `
      INSERT INTO permissions (id, resource, action, description, is_active, created_at, updated_at, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7)
    `;
    await this.executeQuery(
      query,
      [
        permission.id,
        permission.resource,
        permission.action,
        permission.description,
        permission.isActive,
        permission.createdBy,
        permission.updatedBy,
      ],
      correlationId
    );
  }

  async updatePermission(
    permissionId: string,
    updates: Partial<IPermission>,
    correlationId?: CorrelationId
  ): Promise<IPermission> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    fields.push('updated_at = NOW()');
    values.push(permissionId);

    const query = `
      UPDATE permissions 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.executeQuery<IPermission>(query, values, correlationId);
    return result[0];
  }

  async deletePermission(permissionId: string, correlationId?: CorrelationId): Promise<void> {
    const query = 'DELETE FROM permissions WHERE id = $1';
    await this.executeQuery(query, [permissionId], correlationId);
  }

  async listPermissions(correlationId?: CorrelationId): Promise<IPermission[]> {
    const query = 'SELECT * FROM permissions ORDER BY resource, action';
    return this.executeQuery<IPermission>(query, [], correlationId);
  }

  async getPermissionsByResource(
    resource: string,
    correlationId?: CorrelationId
  ): Promise<IPermission[]> {
    const query = 'SELECT * FROM permissions WHERE resource = $1 ORDER BY action';
    return this.executeQuery<IPermission>(query, [resource], correlationId);
  }

  async getPermissionAssignmentCount(
    permissionId: string,
    correlationId?: CorrelationId
  ): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = $1';
    const result = await this.executeQuery<{ count: string }>(query, [permissionId], correlationId);
    return parseInt(result[0].count, 10);
  }

  async getDistinctPermissionResources(correlationId?: CorrelationId): Promise<string[]> {
    const query = 'SELECT DISTINCT resource FROM permissions ORDER BY resource';
    const result = await this.executeQuery<{ resource: string }>(query, [], correlationId);
    return result.map(r => r.resource);
  }

  /**
   * Health check for database connectivity
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number }> {
    const startTime = Date.now();

    try {
      await this.executeQuery('SELECT 1');
      const latency = Date.now() - startTime;
      return { status: 'healthy', latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.logger.error('Database health check failed', {
        error: (error as Error).message,
        latency,
      });
      return { status: 'unhealthy', latency };
    }
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info('Database connections closed');
  }

  // Keep executeQuery method for internal use
  private async executeQuery<T = unknown>(
    query: string,
    values: unknown[] = [],
    correlationId?: CorrelationId
  ): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(query, values);
      return result.rows;
    } catch (error) {
      this.logger.error('Query execution failed', {
        error: (error as Error).message,
        correlationId,
      });
      throw error;
    } finally {
      client.release();
    }
  }
}
