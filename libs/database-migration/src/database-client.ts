import { Pool, PoolClient, PoolConfig } from 'pg';
import { neon, neonConfig } from '@neondatabase/serverless';
import { INeonConfig, IMigrationLogger } from './types';
import { retryWithBackoff } from '@template/shared-utils';
import { CorrelationId } from '@template/shared-types';

export class DatabaseClient {
  private pool: Pool | null = null;
  private neonSql: any = null;
  private isNeon: boolean = false;
  private logger: IMigrationLogger;

  constructor(
    private config: INeonConfig | PoolConfig,
    logger: IMigrationLogger
  ) {
    this.logger = logger;
    this.initializeClient();
  }

  private initializeClient(): void {
    if ('connectionString' in this.config) {
      // Neon configuration
      this.isNeon = true;
      neonConfig.fetchConnectionCache = true;
      this.neonSql = neon(this.config.connectionString, {
        fullResults: true,
      });

      // Also create a pool for migrations table management
      this.pool = new Pool({
        connectionString: this.config.connectionString,
        ssl: this.config.ssl !== false ? { rejectUnauthorized: false } : false,
        ...this.config.poolConfig,
      });
    } else {
      // Standard PostgreSQL configuration
      this.pool = new Pool(this.config);
    }
  }

  async connect(correlationId?: CorrelationId): Promise<void> {
    try {
      if (this.pool) {
        await retryWithBackoff(
          async () => {
            const client = await this.pool!.connect();
            await client.query('SELECT 1');
            client.release();
          },
          {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 5000,
          }
        );
        this.logger.info('Database connection established', { correlationId });
      }
    } catch (error) {
      this.logger.error('Failed to connect to database', { error, correlationId });
      throw error;
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    if (this.isNeon && this.neonSql) {
      // Use Neon serverless driver for better performance
      const result = await this.neonSql(sql, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
      };
    } else if (this.pool) {
      return await this.pool.query(sql, params);
    }
    throw new Error('Database client not initialized');
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    correlationId?: CorrelationId
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('Transaction support requires pool connection');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction rolled back', { error, correlationId });
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    this.neonSql = null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
