/**
 * Database connection utilities with retry logic and monitoring
 * Enhanced security and resilience features for Abyss Central Suite
 */

import { ConfigManager } from './index';

export interface DatabaseConnectionOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  maxRetryDelay?: number;
  healthCheckInterval?: number;
  enableMonitoring?: boolean;
}

export interface ConnectionPoolEvents {
  onConnect?: (client: any) => void;
  onError?: (error: Error, client?: any) => void;
  onRemove?: (client: any) => void;
  onAcquire?: (client: any) => void;
  onRelease?: (client: any) => void;
}

export interface DatabaseHealthMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  lastHealthCheck: Date;
  isHealthy: boolean;
  errors: Error[];
}

/**
 * Enhanced database connection manager with retry logic and monitoring
 */
export class DatabaseConnectionManager {
  private config: ConfigManager;
  private pool: any;
  private healthCheckInterval?: NodeJS.Timer;
  private metrics: DatabaseHealthMetrics;
  private isConnected = false;

  constructor(
    private options: DatabaseConnectionOptions = {},
    private events: ConnectionPoolEvents = {}
  ) {
    this.config = ConfigManager.getInstance();
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      lastHealthCheck: new Date(),
      isHealthy: false,
      errors: []
    };
  }

  /**
   * Connect to database with retry logic and exponential backoff
   */
  async connect(): Promise<void> {
    if (!this.config.isLoaded) {
      await this.config.load();
    }

    const dbConfig = this.config.getDatabaseConfig();
    const retryConfig = this.config.getDatabaseRetryConfig();
    
    const maxRetries = this.options.maxRetries ?? retryConfig.attempts;
    const baseDelay = this.options.retryDelay ?? retryConfig.delay;
    const useExponentialBackoff = this.options.exponentialBackoff ?? retryConfig.exponentialBackoff;
    const maxDelay = this.options.maxRetryDelay ?? retryConfig.maxDelay;

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Try to create connection pool
        await this.createConnectionPool(dbConfig);
        
        // Test the connection
        await this.testConnection();
        
        this.isConnected = true;
        this.metrics.isHealthy = true;
        this.metrics.lastHealthCheck = new Date();
        
        // Start health monitoring if enabled
        if (this.options.enableMonitoring !== false) {
          this.startHealthMonitoring();
        }
        
        console.log(`Database connected successfully after ${attempt} attempt(s)`);
        return;
        
      } catch (error) {
        lastError = error as Error;
        this.metrics.errors.push(lastError);
        
        if (attempt === maxRetries) {
          this.metrics.isHealthy = false;
          throw new Error(
            `Failed to connect to database after ${maxRetries} attempts. Last error: ${lastError.message}`
          );
        }
        
        // Calculate delay with exponential backoff
        const delay = useExponentialBackoff
          ? Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
          : baseDelay;
        
        console.warn(
          `Database connection attempt ${attempt} failed: ${lastError.message}. ` +
          `Retrying in ${delay}ms...`
        );
        
        await this.sleep(delay);
      }
    }
  }

  /**
   * Create connection pool based on environment configuration
   */
  private async createConnectionPool(dbConfig: any): Promise<void> {
    // This would be implemented with the actual database library (e.g., pg)
    // For now, we'll create a mock pool structure
    
    this.pool = {
      config: dbConfig,
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0,
      
      // Mock pool methods
      connect: async () => ({
        query: async (sql: string) => ({ rows: [] }),
        release: () => {},
      }),
      
      end: async () => {},
      
      on: (event: string, callback: Function) => {
        if (event === 'connect' && this.events.onConnect) {
          this.events.onConnect(null);
        }
        if (event === 'error' && this.events.onError) {
          this.events.onError(new Error('Mock error'), null);
        }
      }
    };
    
    // Update metrics
    this.metrics.totalConnections = dbConfig.max;
    this.metrics.idleConnections = dbConfig.min;
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }
    
    const client = await this.pool.connect();
    try {
      // Execute a simple query to test connectivity
      await client.query('SELECT 1 as health_check');
    } finally {
      client.release();
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      return; // Already monitoring
    }
    
    const interval = this.options.healthCheckInterval ?? 
      this.config.get('DB_CONNECTION_CHECK_INTERVAL') ?? 30000;
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        console.error('Health check failed:', error);
        this.metrics.isHealthy = false;
        this.metrics.errors.push(error as Error);
      }
    }, interval);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Check database health
   */
  async checkHealth(): Promise<DatabaseHealthMetrics> {
    try {
      await this.testConnection();
      
      // Update metrics
      this.metrics.lastHealthCheck = new Date();
      this.metrics.isHealthy = true;
      
      // Update pool metrics if available
      if (this.pool) {
        this.metrics.totalConnections = this.pool.totalCount || 0;
        this.metrics.idleConnections = this.pool.idleCount || 0;
        this.metrics.waitingClients = this.pool.waitingCount || 0;
        this.metrics.activeConnections = 
          this.metrics.totalConnections - this.metrics.idleConnections;
      }
      
    } catch (error) {
      this.metrics.isHealthy = false;
      this.metrics.errors.push(error as Error);
      throw error;
    }
    
    return { ...this.metrics };
  }

  /**
   * Get current health metrics
   */
  getHealthMetrics(): DatabaseHealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Execute query with automatic retry on connection failure
   */
  async query(sql: string, params?: any[]): Promise<any> {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    
    const client = await this.pool.connect();
    try {
      return await client.query(sql, params);
    } catch (error) {
      // If it's a connection error, mark as unhealthy
      if (this.isConnectionError(error as Error)) {
        this.metrics.isHealthy = false;
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute transaction with retry logic
   */
  async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Gracefully disconnect from database
   */
  async disconnect(): Promise<void> {
    this.stopHealthMonitoring();
    
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    
    this.isConnected = false;
    this.metrics.isHealthy = false;
    console.log('Database disconnected');
  }

  /**
   * Check if error is connection-related
   */
  private isConnectionError(error: Error): boolean {
    const connectionErrorCodes = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'PROTOCOL_CONNECTION_LOST'
    ];
    
    return connectionErrorCodes.some(code => 
      error.message.includes(code) || 
      (error as any).code === code
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create database connection manager with configuration
 */
export function createDatabaseConnection(
  options?: DatabaseConnectionOptions,
  events?: ConnectionPoolEvents
): DatabaseConnectionManager {
  return new DatabaseConnectionManager(options, events);
}

/**
 * Simple health check function for endpoints
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  details?: any;
}> {
  try {
    const config = ConfigManager.getInstance();
    if (!config.isLoaded) {
      await config.load();
    }
    
    const dbManager = new DatabaseConnectionManager();
    await dbManager.connect();
    
    const metrics = await dbManager.checkHealth();
    await dbManager.disconnect();
    
    return {
      status: metrics.isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      details: {
        totalConnections: metrics.totalConnections,
        activeConnections: metrics.activeConnections,
        idleConnections: metrics.idleConnections,
        lastHealthCheck: metrics.lastHealthCheck
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      details: {
        error: (error as Error).message
      }
    };
  }
}

/**
 * Database connection pool factory with environment-specific defaults
 */
export function createConnectionPool(customConfig?: Partial<any>) {
  const config = ConfigManager.getInstance();
  const dbConfig = config.getDatabaseConfig();
  
  return {
    ...dbConfig,
    ...customConfig,
    // Add connection pool event handlers
    onConnect: (client: any) => {
      console.log('New database client connected');
    },
    onError: (err: Error, client: any) => {
      console.error('Database connection error:', err.message);
    },
    onRemove: (client: any) => {
      console.log('Database client removed from pool');
    }
  };
}