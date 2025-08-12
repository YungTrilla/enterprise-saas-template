import { Pool } from 'pg';
import { CorrelationId } from '@template/shared-types';
import { CorrelatedLogger } from '../utils/logger';
import { IRole, IUserRole } from '../types/auth';

export class RoleRepository {
  private pool: Pool;
  private logger: CorrelatedLogger;

  constructor(pool: Pool) {
    this.pool = pool;
    this.logger = new CorrelatedLogger('role-repository');
  }

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
        correlationId 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserRoles(userId: string, correlationId?: CorrelationId): Promise<IUserRole[]> {
    const query = `
      SELECT r.id as role_id, r.name as role_name, ur.assigned_at, ur.assigned_by
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
      ORDER BY ur.assigned_at DESC
    `;
    return await this.executeQuery<IUserRole>(query, [userId], correlationId);
  }

  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    correlationId?: CorrelationId
  ): Promise<void> {
    const query = `
      INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING
    `;
    await this.executeQuery(query, [userId, roleId, assignedBy], correlationId);
  }

  async removeRole(
    userId: string,
    roleId: string,
    correlationId?: CorrelationId
  ): Promise<void> {
    const query = 'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2';
    await this.executeQuery(query, [userId, roleId], correlationId);
  }

  async getRoleByName(roleName: string, correlationId?: CorrelationId): Promise<IRole | null> {
    const query = 'SELECT * FROM roles WHERE name = $1';
    const result = await this.executeQuery<IRole>(query, [roleName], correlationId);
    return result[0] || null;
  }

  async getUserPermissions(userId: string, correlationId?: CorrelationId): Promise<string[]> {
    const query = `
      SELECT DISTINCT p.resource || ':' || p.action as permission
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = $1
    `;
    const result = await this.executeQuery<{ permission: string }>(query, [userId], correlationId);
    return result.map(row => row.permission);
  }
}