import { Pool } from 'pg';
import { CorrelationId } from '@abyss/shared-types';
import { CorrelatedLogger } from '../utils/logger';
import { ITimeOffRequest, ITimeOffRequestData } from '../types/auth';

export class TimeOffRepository {
  private pool: Pool;
  private logger: CorrelatedLogger;

  constructor(pool: Pool) {
    this.pool = pool;
    this.logger = new CorrelatedLogger('timeoff-repository');
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

  async createTimeOffRequest(data: ITimeOffRequestData, correlationId?: CorrelationId): Promise<ITimeOffRequest> {
    const query = `
      INSERT INTO time_off_requests (
        user_id, start_date, end_date, type, reason, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const values = [
      data.userId,
      data.startDate,
      data.endDate,
      data.type,
      data.reason,
      data.status,
    ];

    const result = await this.executeQuery<ITimeOffRequest>(query, values, correlationId);
    return result[0];
  }

  async getTimeOffRequests(
    userId: string,
    startDate: Date,
    endDate: Date,
    correlationId?: CorrelationId
  ): Promise<ITimeOffRequest[]> {
    const query = `
      SELECT * FROM time_off_requests
      WHERE user_id = $1 
        AND ((start_date <= $3 AND end_date >= $2))
      ORDER BY created_at DESC
    `;
    return await this.executeQuery<ITimeOffRequest>(query, [userId, startDate, endDate], correlationId);
  }

  async updateTimeOffStatus(
    requestId: string,
    status: string,
    approvedBy: string,
    correlationId?: CorrelationId
  ): Promise<ITimeOffRequest> {
    const query = `
      UPDATE time_off_requests
      SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await this.executeQuery<ITimeOffRequest>(query, [status, approvedBy, requestId], correlationId);
    return result[0];
  }

  async getTimeOffRequest(requestId: string, correlationId?: CorrelationId): Promise<ITimeOffRequest | null> {
    const query = 'SELECT * FROM time_off_requests WHERE id = $1';
    const result = await this.executeQuery<ITimeOffRequest>(query, [requestId], correlationId);
    return result[0] || null;
  }

  async getUserTimeOffRequests(
    userId: string,
    correlationId?: CorrelationId
  ): Promise<ITimeOffRequest[]> {
    const query = `
      SELECT * FROM time_off_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    return await this.executeQuery<ITimeOffRequest>(query, [userId], correlationId);
  }

  async getPendingTimeOffRequests(
    department?: string,
    correlationId?: CorrelationId
  ): Promise<ITimeOffRequest[]> {
    let query = `
      SELECT tor.*, u.first_name, u.last_name, u.email, u.department
      FROM time_off_requests tor
      JOIN users u ON tor.user_id = u.id
      WHERE tor.status = 'PENDING' AND u.deleted_at IS NULL
    `;
    const values: unknown[] = [];

    if (department) {
      query += ' AND u.department = $1';
      values.push(department);
    }

    query += ' ORDER BY tor.created_at ASC';

    return await this.executeQuery<ITimeOffRequest>(query, values, correlationId);
  }
}