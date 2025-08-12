#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { MigrationRunner } from './migration-runner';
import { createMigrationFile } from './utils';
import { IMigrationConfig, IMigrationLogger } from './types';
import { generateCorrelationId } from '@template/shared-utils';

const logger: IMigrationLogger = {
  info: (message: string, meta?: any) => {
    console.log(chalk.blue('ℹ'), message);
    if (meta && process.env.DEBUG) {
      console.log(chalk.gray(JSON.stringify(meta, null, 2)));
    }
  },
  error: (message: string, meta?: any) => {
    console.error(chalk.red('✖'), message);
    if (meta) {
      console.error(chalk.gray(JSON.stringify(meta, null, 2)));
    }
  },
  warn: (message: string, meta?: any) => {
    console.warn(chalk.yellow('⚠'), message);
    if (meta && process.env.DEBUG) {
      console.warn(chalk.gray(JSON.stringify(meta, null, 2)));
    }
  },
  debug: (message: string, meta?: any) => {
    if (process.env.DEBUG) {
      console.debug(chalk.gray('🐛'), message);
      if (meta) {
        console.debug(chalk.gray(JSON.stringify(meta, null, 2)));
      }
    }
  },
};

const program = new Command();

program
  .name('abyss-migrate')
  .description('Database migration tool for Abyss Central services')
  .version('1.0.0');

// Helper to get configuration
function getConfig(options: any): IMigrationConfig {
  const databaseUrl = options.databaseUrl || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('Database URL is required. Set DATABASE_URL or use --database-url');
  }

  return {
    databaseUrl,
    migrationsPath: path.resolve(options.migrationsPath || './migrations'),
    migrationsTable: options.table || 'schema_migrations',
    schema: options.schema,
    validateChecksums: !options.skipValidation,
    dryRun: options.dryRun,
    logger,
  };
}

// Create command
program
  .command('create <name>')
  .description('Create a new migration file')
  .option('-p, --migrations-path <path>', 'Path to migrations directory', './migrations')
  .action(async (name: string, options: any) => {
    try {
      const migrationsPath = path.resolve(options.migrationsPath);
      const filePath = await createMigrationFile(migrationsPath, name);

      console.log(chalk.green('✔'), `Created migration: ${filePath}`);
    } catch (error) {
      console.error(chalk.red('✖'), 'Failed to create migration:', error);
      process.exit(1);
    }
  });

// Up command
program
  .command('up')
  .description('Run pending migrations')
  .option('-d, --database-url <url>', 'Database connection URL')
  .option('-p, --migrations-path <path>', 'Path to migrations directory', './migrations')
  .option('-t, --table <name>', 'Migrations table name', 'schema_migrations')
  .option('-s, --schema <name>', 'Database schema')
  .option('-c, --count <number>', 'Number of migrations to run', parseInt)
  .option('--target <id>', 'Run migrations up to specific ID')
  .option('--dry-run', 'Show what would be run without executing')
  .option('--skip-validation', 'Skip checksum validation')
  .option('--force', 'Force run despite conflicts')
  .action(async (options: any) => {
    const correlationId = generateCorrelationId();

    try {
      const config = getConfig(options);
      const runner = new MigrationRunner(config);

      console.log(chalk.blue('ℹ'), 'Running migrations...');

      const result = await runner.run('up', {
        count: options.count,
        target: options.target,
        dryRun: options.dryRun,
        force: options.force,
        correlationId,
      });

      if (result.success) {
        console.log(
          chalk.green('✔'),
          `Successfully ran ${result.migrationsRun} migration(s) in ${result.duration}ms`
        );
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error(chalk.red('✖'), 'Migration failed:', error);
      process.exit(1);
    }
  });

// Down command
program
  .command('down')
  .description('Rollback migrations')
  .option('-d, --database-url <url>', 'Database connection URL')
  .option('-p, --migrations-path <path>', 'Path to migrations directory', './migrations')
  .option('-t, --table <name>', 'Migrations table name', 'schema_migrations')
  .option('-s, --schema <name>', 'Database schema')
  .option('-c, --count <number>', 'Number of migrations to rollback', parseInt)
  .option('--dry-run', 'Show what would be rolled back without executing')
  .option('--force', 'Force rollback despite conflicts')
  .action(async (options: any) => {
    const correlationId = generateCorrelationId();

    try {
      const config = getConfig(options);
      const runner = new MigrationRunner(config);

      console.log(chalk.blue('ℹ'), 'Rolling back migrations...');

      const result = await runner.run('down', {
        count: options.count || 1,
        dryRun: options.dryRun,
        force: options.force,
        correlationId,
      });

      if (result.success) {
        console.log(
          chalk.green('✔'),
          `Successfully rolled back ${result.migrationsRun} migration(s) in ${result.duration}ms`
        );
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error(chalk.red('✖'), 'Rollback failed:', error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show migration status')
  .option('-d, --database-url <url>', 'Database connection URL')
  .option('-p, --migrations-path <path>', 'Path to migrations directory', './migrations')
  .option('-t, --table <name>', 'Migrations table name', 'schema_migrations')
  .option('-s, --schema <name>', 'Database schema')
  .action(async (options: any) => {
    const correlationId = generateCorrelationId();

    try {
      const config = getConfig(options);
      const runner = new MigrationRunner(config);

      const status = await runner.getStatus(correlationId);

      console.log(chalk.blue('\n📊 Migration Status\n'));

      // Applied migrations
      if (status.applied.length > 0) {
        console.log(chalk.green(`✔ Applied (${status.applied.length}):`));
        status.applied.forEach(m => {
          console.log(
            chalk.gray('  -'),
            `${m.id}_${m.name}`,
            chalk.gray(`(${new Date(m.applied_at).toLocaleString()})`)
          );
        });
      } else {
        console.log(chalk.gray('No migrations applied yet'));
      }

      console.log();

      // Pending migrations
      if (status.pending.length > 0) {
        console.log(chalk.yellow(`⏳ Pending (${status.pending.length}):`));
        status.pending.forEach(m => {
          console.log(chalk.gray('  -'), `${m.id}_${m.name}`);
        });
      } else {
        console.log(chalk.gray('No pending migrations'));
      }

      // Conflicts
      if (status.conflicts.length > 0) {
        console.log();
        console.log(chalk.red(`⚠ Conflicts (${status.conflicts.length}):`));
        status.conflicts.forEach(c => {
          console.log(chalk.red('  -'), c.details);
        });
      }
    } catch (error) {
      console.error(chalk.red('✖'), 'Failed to get status:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);
