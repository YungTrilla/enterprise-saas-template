import { DatabaseClient } from './database-client';
import {
  IMigration,
  IMigrationRecord,
  IMigrationConfig,
  IMigrationStatus,
  IMigrationConflict,
  IMigrationLogger,
} from './types';
import { getMigrationFiles, loadMigrationFile, calculateChecksum } from './utils';
import { CorrelationId } from '@template/shared-types';

export class MigrationManager {
  private client: DatabaseClient;
  private config: IMigrationConfig;
  private logger: IMigrationLogger;
  private migrationsTable: string;

  constructor(config: IMigrationConfig) {
    this.config = config;
    this.logger = config.logger || this.createDefaultLogger();
    this.migrationsTable = config.migrationsTable || 'schema_migrations';

    this.client = new DatabaseClient({ connectionString: config.databaseUrl }, this.logger);
  }

  private createDefaultLogger(): IMigrationLogger {
    return {
      info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
      error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
      warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
      debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
    };
  }

  async initialize(correlationId?: CorrelationId): Promise<void> {
    await this.client.connect(correlationId);
    await this.ensureMigrationsTable(correlationId);
  }

  private async ensureMigrationsTable(correlationId?: CorrelationId): Promise<void> {
    const schemaPrefix = this.config.schema ? `${this.config.schema}.` : '';

    await this.client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaPrefix}${this.migrationsTable} (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        timestamp BIGINT NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER NOT NULL,
        checksum VARCHAR(64) NOT NULL
      );
    `);

    await this.client.query(`
      CREATE INDEX IF NOT EXISTS idx_${this.migrationsTable}_timestamp 
      ON ${schemaPrefix}${this.migrationsTable} (timestamp);
    `);

    this.logger.info('Migrations table ready', { correlationId });
  }

  async getStatus(correlationId?: CorrelationId): Promise<IMigrationStatus> {
    const [pendingMigrations, appliedMigrations] = await Promise.all([
      this.getPendingMigrations(correlationId),
      this.getAppliedMigrations(correlationId),
    ]);

    const conflicts = await this.detectConflicts(
      pendingMigrations,
      appliedMigrations,
      correlationId
    );

    return {
      pending: pendingMigrations,
      applied: appliedMigrations,
      conflicts,
    };
  }

  private async getPendingMigrations(correlationId?: CorrelationId): Promise<IMigration[]> {
    const migrationFiles = await getMigrationFiles(this.config.migrationsPath);
    const appliedIds = await this.getAppliedMigrationIds(correlationId);

    const pendingFiles = migrationFiles.filter(file => {
      const migration = loadMigrationFile(file);
      return migration.then(m => !appliedIds.includes(m.id));
    });

    return Promise.all(pendingFiles.map(file => loadMigrationFile(file)));
  }

  private async getAppliedMigrations(correlationId?: CorrelationId): Promise<IMigrationRecord[]> {
    const schemaPrefix = this.config.schema ? `${this.config.schema}.` : '';
    const result = await this.client.query(`
      SELECT id, name, timestamp, applied_at, execution_time_ms, checksum
      FROM ${schemaPrefix}${this.migrationsTable}
      ORDER BY timestamp ASC;
    `);

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      timestamp: parseInt(row.timestamp, 10),
      applied_at: row.applied_at,
      execution_time_ms: row.execution_time_ms,
      checksum: row.checksum,
    }));
  }

  private async getAppliedMigrationIds(correlationId?: CorrelationId): Promise<string[]> {
    const applied = await this.getAppliedMigrations(correlationId);
    return applied.map(m => m.id);
  }

  private async detectConflicts(
    pending: IMigration[],
    applied: IMigrationRecord[],
    correlationId?: CorrelationId
  ): Promise<IMigrationConflict[]> {
    const conflicts: IMigrationConflict[] = [];

    if (!this.config.validateChecksums) {
      return conflicts;
    }

    // Check for checksum mismatches
    for (const appliedMigration of applied) {
      const migrationFiles = await getMigrationFiles(this.config.migrationsPath);
      const matchingFile = migrationFiles.find(file => file.includes(appliedMigration.id));

      if (!matchingFile) {
        conflicts.push({
          migration: {
            id: appliedMigration.id,
            name: appliedMigration.name,
            timestamp: appliedMigration.timestamp,
            up: async () => {},
            down: async () => {},
          },
          reason: 'missing_file',
          details: `Migration ${appliedMigration.id} was applied but file is missing`,
        });
      }
    }

    // Check for out-of-order migrations
    if (applied.length > 0 && pending.length > 0) {
      const lastAppliedTimestamp = applied[applied.length - 1].timestamp;
      const outOfOrderPending = pending.filter(p => p.timestamp < lastAppliedTimestamp);

      for (const migration of outOfOrderPending) {
        conflicts.push({
          migration,
          reason: 'invalid_order',
          details: `Migration ${migration.id} has timestamp before last applied migration`,
        });
      }
    }

    return conflicts;
  }

  async recordMigration(
    migration: IMigration,
    executionTime: number,
    checksum: string,
    correlationId?: CorrelationId
  ): Promise<void> {
    const schemaPrefix = this.config.schema ? `${this.config.schema}.` : '';

    await this.client.query(
      `INSERT INTO ${schemaPrefix}${this.migrationsTable} 
       (id, name, timestamp, execution_time_ms, checksum) 
       VALUES ($1, $2, $3, $4, $5);`,
      [migration.id, migration.name, migration.timestamp, executionTime, checksum]
    );

    this.logger.info('Migration recorded', {
      migrationId: migration.id,
      executionTime,
      correlationId,
    });
  }

  async removeMigration(migrationId: string, correlationId?: CorrelationId): Promise<void> {
    const schemaPrefix = this.config.schema ? `${this.config.schema}.` : '';

    await this.client.query(`DELETE FROM ${schemaPrefix}${this.migrationsTable} WHERE id = $1;`, [
      migrationId,
    ]);

    this.logger.info('Migration record removed', {
      migrationId,
      correlationId,
    });
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
