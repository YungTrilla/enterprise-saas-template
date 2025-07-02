import { Pool, PoolClient } from 'pg';
import { CorrelationId } from '@abyss/shared-types';
import { CorrelatedLogger } from '../utils/logger';
import { IUserFilter } from '../models/user.model';
import { IUser, IUserCreateData } from '../types/auth';

export class UserRepository {
  private pool: Pool;
  private logger: CorrelatedLogger;

  constructor(pool: Pool) {
    this.pool = pool;
    this.logger = new CorrelatedLogger('user-repository');
  }

  async query<T = unknown>(
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

  private async executeQuery<T = unknown>(
    query: string, 
    values: unknown[] = [], 
    correlationId?: CorrelationId
  ): Promise<T[]> {
    return this.query<T>(query, values, correlationId);
  }

  async findUserById(userId: string, correlationId?: CorrelationId): Promise<IUser | null> {
    const query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.executeQuery<IUser>(query, [userId], correlationId);
    return result[0] || null;
  }

  async findUserByEmail(email: string, correlationId?: CorrelationId): Promise<IUser | null> {
    const query = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL';
    const result = await this.executeQuery<IUser>(query, [email], correlationId);
    return result[0] || null;
  }

  async findUserByUsername(username: string, correlationId?: CorrelationId): Promise<IUser | null> {
    const query = 'SELECT * FROM users WHERE username = $1 AND deleted_at IS NULL';
    const result = await this.executeQuery<IUser>(query, [username], correlationId);
    return result[0] || null;
  }

  async createUser(userData: IUserCreateData, correlationId?: CorrelationId): Promise<IUser> {
    const query = `
      INSERT INTO users (
        email, username, password_hash, first_name, last_name, phone,
        department, position, hire_date, default_hours_per_week,
        hourly_rate, pay_type, salary_amount, commission_rate,
        base_salary, pay_frequency, is_active, is_verified, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      userData.email,
      userData.username,
      userData.passwordHash,
      userData.firstName,
      userData.lastName,
      userData.phone,
      userData.department,
      userData.position,
      userData.hireDate,
      userData.defaultHoursPerWeek,
      userData.hourlyRate,
      userData.payType,
      userData.salaryAmount,
      userData.commissionRate,
      userData.baseSalary,
      userData.payFrequency,
      userData.isActive,
      userData.isVerified,
    ];

    const result = await this.executeQuery<IUser>(query, values, correlationId);
    return result[0];
  }

  async updateUser(
    userId: string,
    data: Partial<IUser>,
    correlationId?: CorrelationId
  ): Promise<IUser> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.executeQuery<IUser>(query, values, correlationId);
    return result[0];
  }

  async deleteUser(userId: string, correlationId?: CorrelationId): Promise<void> {
    const query = `
      UPDATE users 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `;
    await this.executeQuery(query, [userId], correlationId);
  }

  async listUsers(
    filter: IUserFilter,
    page: number,
    limit: number,
    correlationId?: CorrelationId
  ): Promise<{ items: IUser[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE u.deleted_at IS NULL';
    let joinClause = '';
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filter.search) {
      whereClause += ` AND (u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      values.push(`%${filter.search}%`);
      paramIndex++;
    }

    if (filter.isActive !== undefined) {
      whereClause += ` AND u.is_active = $${paramIndex}`;
      values.push(filter.isActive);
      paramIndex++;
    }

    if (filter.department) {
      whereClause += ` AND u.department = $${paramIndex}`;
      values.push(filter.department);
      paramIndex++;
    }

    // Role filtering
    if (filter.roles && filter.roles.length > 0) {
      joinClause = 'INNER JOIN user_roles ur ON u.id = ur.user_id INNER JOIN roles r ON ur.role_id = r.id';
      if (Array.isArray(filter.roles)) {
        whereClause += ` AND r.name = ANY($${paramIndex}::text[])`;
        values.push(filter.roles);
      } else {
        whereClause += ` AND r.name = $${paramIndex}`;
        values.push(filter.roles);
      }
      paramIndex++;
    }

    // Count query
    const countQuery = `SELECT COUNT(DISTINCT u.id) FROM users u ${joinClause} ${whereClause}`;
    const countResult = await this.executeQuery<{ count: string }>(countQuery, values, correlationId);
    const total = parseInt(countResult[0].count, 10);

    // Data query
    values.push(limit, offset);
    const dataQuery = `
      SELECT DISTINCT u.*
      FROM users u
      ${joinClause}
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const items = await this.executeQuery<IUser>(dataQuery, values, correlationId);

    return { items, total };
  }

  async updateUserPassword(
    userId: string,
    passwordHash: string,
    correlationId?: CorrelationId
  ): Promise<void> {
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
    `;
    await this.executeQuery(query, [passwordHash, userId], correlationId);
  }

  async bulkDeactivateUsers(
    userIds: string[],
    updatedBy: string,
    reason?: string,
    effectiveDate?: Date,
    correlationId?: CorrelationId
  ): Promise<number> {
    const query = `
      UPDATE users 
      SET 
        is_active = false,
        status = 'inactive',
        updated_at = NOW(),
        updated_by = $1
      WHERE id = ANY($2::uuid[]) 
        AND deleted_at IS NULL
        AND is_active = true
    `;
    
    const result = await this.pool.query(query, [updatedBy, userIds]);
    return result.rowCount || 0;
  }
}