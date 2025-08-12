import { Pool, PoolConfig } from 'pg';
import { Logger } from 'winston';
import { ServiceBootstrapConfig } from './types';

/**
 * Create and configure PostgreSQL connection pool
 */
export async function createDatabaseConnection(
  config: ServiceBootstrapConfig,
  logger: Logger
): Promise<Pool | undefined> {
  if (!config.database?.enabled) {
    return undefined;
  }

  if (!config.database.connectionString) {
    throw new Error('Database connection string is required when database is enabled');
  }

  const poolConfig: PoolConfig = {
    connectionString: config.database.connectionString,
    min: config.database.poolMin || 2,
    max: config.database.poolMax || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  const pool = new Pool(poolConfig);

  // Test connection
  try {
    await pool.query('SELECT NOW()');
    logger.info('Database connection established', {
      service: config.name,
      database: poolConfig.connectionString?.split('@')[1]?.split('/')[1]?.split('?')[0],
    });
  } catch (error) {
    logger.error('Failed to connect to database', {
      service: config.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }

  // Handle pool errors
  pool.on('error', err => {
    logger.error('Unexpected database pool error', {
      service: config.name,
      error: err.message,
    });
  });

  return pool;
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(
  pool: Pool,
  healthCheckQuery?: string
): Promise<{ status: 'connected' | 'disconnected'; latency?: number }> {
  const query = healthCheckQuery || 'SELECT 1';
  const start = Date.now();

  try {
    await pool.query(query);
    const latency = Date.now() - start;
    return { status: 'connected', latency };
  } catch (error) {
    return { status: 'disconnected' };
  }
}

/**
 * Gracefully close database connections
 */
export async function closeDatabaseConnection(
  pool: Pool | undefined,
  logger: Logger
): Promise<void> {
  if (!pool) return;

  try {
    await pool.end();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
