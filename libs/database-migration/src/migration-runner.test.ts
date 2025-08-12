import { MigrationRunner } from './migration-runner';
import { IMigrationConfig } from './types';
import { createMigrationFile, generateMigrationId } from './utils';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('MigrationRunner', () => {
  let runner: MigrationRunner;
  let config: IMigrationConfig;
  const testMigrationsPath = path.join(__dirname, '../test-migrations');

  beforeEach(async () => {
    // Create test migrations directory
    await fs.mkdir(testMigrationsPath, { recursive: true });

    config = {
      databaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://test@localhost/test',
      migrationsPath: testMigrationsPath,
      migrationsTable: 'test_migrations',
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      },
    };

    runner = new MigrationRunner(config);
  });

  afterEach(async () => {
    // Clean up test migrations
    try {
      await fs.rm(testMigrationsPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('run', () => {
    it('should run migrations in dry-run mode', async () => {
      // Create a test migration
      const migrationContent = `
import { PoolClient } from 'pg';

export async function up(client: PoolClient): Promise<void> {
  await client.query('CREATE TABLE test_table (id INT PRIMARY KEY);');
}

export async function down(client: PoolClient): Promise<void> {
  await client.query('DROP TABLE test_table;');
}
      `;

      const id = generateMigrationId();
      const filename = `${id}_test_migration.ts`;
      await fs.writeFile(path.join(testMigrationsPath, filename), migrationContent);

      const result = await runner.run('up', { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.migrationsRun).toBe(1);
      expect(config.logger?.info).toHaveBeenCalledWith(
        expect.stringContaining('[DRY RUN]'),
        expect.any(Object)
      );
    });

    it('should handle migration errors gracefully', async () => {
      const migrationContent = `
import { PoolClient } from 'pg';

export async function up(client: PoolClient): Promise<void> {
  throw new Error('Test migration error');
}

export async function down(client: PoolClient): Promise<void> {
  // No-op
}
      `;

      const id = generateMigrationId();
      const filename = `${id}_error_migration.ts`;
      await fs.writeFile(path.join(testMigrationsPath, filename), migrationContent);

      const result = await runner.run('up', { dryRun: false });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Test migration error');
    });
  });

  describe('getStatus', () => {
    it('should return migration status', async () => {
      const status = await runner.getStatus();

      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('applied');
      expect(status).toHaveProperty('conflicts');
      expect(Array.isArray(status.pending)).toBe(true);
      expect(Array.isArray(status.applied)).toBe(true);
      expect(Array.isArray(status.conflicts)).toBe(true);
    });
  });
});

describe('Utils', () => {
  describe('generateMigrationId', () => {
    it('should generate unique migration IDs', () => {
      const id1 = generateMigrationId();
      const id2 = generateMigrationId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+_\w+$/);
      expect(id2).toMatch(/^\d+_\w+$/);
    });
  });

  describe('createMigrationFile', () => {
    const testPath = path.join(__dirname, '../test-create');

    afterEach(async () => {
      try {
        await fs.rm(testPath, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should create a migration file with template', async () => {
      const filePath = await createMigrationFile(testPath, 'test migration');

      expect(filePath).toMatch(/test_migration\.ts$/);

      const content = await fs.readFile(filePath, 'utf8');
      expect(content).toContain('export async function up');
      expect(content).toContain('export async function down');
      expect(content).toContain('Migration: test_migration');
    });
  });
});
