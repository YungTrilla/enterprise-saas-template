import { PoolClient } from 'pg';
import { MigrationManager } from './migration-manager';
import { DatabaseClient } from './database-client';
import {
  IMigration,
  IMigrationConfig,
  IMigrationResult,
  IMigrationOptions,
  MigrationDirection,
} from './types';
import { calculateChecksum } from './utils';
import { CorrelationId } from '@abyss/shared-types';

export class MigrationRunner {
  private manager: MigrationManager;
  private client: DatabaseClient;
  private config: IMigrationConfig;

  constructor(config: IMigrationConfig) {
    this.config = config;
    this.manager = new MigrationManager(config);
    this.client = new DatabaseClient(
      { connectionString: config.databaseUrl },
      config.logger || console
    );
  }

  async run(
    direction: MigrationDirection = 'up',
    options: IMigrationOptions = {}
  ): Promise<IMigrationResult> {
    const startTime = Date.now();
    let migrationsRun = 0;

    try {
      await this.manager.initialize(options.correlationId);
      await this.client.connect(options.correlationId);

      const status = await this.manager.getStatus(options.correlationId);

      // Check for conflicts
      if (status.conflicts.length > 0 && !options.force) {
        throw new Error(
          `Migration conflicts detected: ${status.conflicts
            .map(c => c.details)
            .join(', ')}`
        );
      }

      if (direction === 'up') {
        migrationsRun = await this.runUpMigrations(
          status.pending,
          options
        );
      } else {
        migrationsRun = await this.runDownMigrations(
          status.applied,
          options
        );
      }

      return {
        success: true,
        migrationsRun,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        migrationsRun,
        error: error as Error,
        duration: Date.now() - startTime,
      };
    } finally {
      await this.cleanup();
    }
  }

  private async runUpMigrations(
    migrations: IMigration[],
    options: IMigrationOptions
  ): Promise<number> {
    let count = 0;
    const toRun = this.filterMigrations(migrations, options);

    for (const migration of toRun) {
      if (options.dryRun) {
        this.config.logger?.info(`[DRY RUN] Would run migration: ${migration.id}`);
        count++;
        continue;
      }

      await this.runSingleMigration(migration, 'up', options.correlationId);
      count++;

      if (options.count && count >= options.count) {
        break;
      }
    }

    return count;
  }

  private async runDownMigrations(
    migrations: any[],
    options: IMigrationOptions
  ): Promise<number> {
    let count = 0;
    const toRun = migrations.slice().reverse();

    for (const record of toRun) {
      if (options.dryRun) {
        this.config.logger?.info(`[DRY RUN] Would rollback migration: ${record.id}`);
        count++;
        continue;
      }

      // Load the migration file to get the down function
      const migrationFiles = await import('./utils').then(utils => 
        utils.getMigrationFiles(this.config.migrationsPath)
      );
      
      const matchingFile = migrationFiles.find(file => 
        file.includes(record.id)
      );

      if (!matchingFile) {
        throw new Error(`Migration file not found for ${record.id}`);
      }

      const migration = await import('./utils').then(utils =>
        utils.loadMigrationFile(matchingFile)
      );

      await this.runSingleMigration(migration, 'down', options.correlationId);
      await this.manager.removeMigration(record.id, options.correlationId);
      count++;

      if (options.count && count >= options.count) {
        break;
      }
    }

    return count;
  }

  private async runSingleMigration(
    migration: IMigration,
    direction: MigrationDirection,
    correlationId?: CorrelationId
  ): Promise<void> {
    const startTime = Date.now();
    
    this.config.logger?.info(`Running migration ${direction}: ${migration.id}`, {
      correlationId,
    });

    try {
      await this.client.transaction(async (client: PoolClient) => {
        if (direction === 'up') {
          await migration.up(client);
        } else {
          await migration.down(client);
        }
      }, correlationId);

      const executionTime = Date.now() - startTime;

      if (direction === 'up') {
        const checksum = await calculateChecksum(migration.up.toString());
        await this.manager.recordMigration(
          migration,
          executionTime,
          checksum,
          correlationId
        );
      }

      this.config.logger?.info(
        `Migration ${direction} completed: ${migration.id}`,
        { executionTime, correlationId }
      );
    } catch (error) {
      this.config.logger?.error(
        `Migration ${direction} failed: ${migration.id}`,
        { error, correlationId }
      );
      throw error;
    }
  }

  private filterMigrations(
    migrations: IMigration[],
    options: IMigrationOptions
  ): IMigration[] {
    if (options.target) {
      const targetIndex = migrations.findIndex(m => m.id === options.target);
      if (targetIndex >= 0) {
        return migrations.slice(0, targetIndex + 1);
      }
    }

    if (options.count) {
      return migrations.slice(0, options.count);
    }

    return migrations;
  }

  private async cleanup(): Promise<void> {
    await this.manager.close();
    await this.client.close();
  }

  async getStatus(correlationId?: CorrelationId) {
    try {
      await this.manager.initialize(correlationId);
      return await this.manager.getStatus(correlationId);
    } finally {
      await this.cleanup();
    }
  }
}