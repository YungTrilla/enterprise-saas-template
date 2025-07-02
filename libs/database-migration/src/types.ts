import { CorrelationId } from '@abyss/shared-types';

export interface IMigration {
  id: string;
  name: string;
  timestamp: number;
  up: (client: any) => Promise<void>;
  down: (client: any) => Promise<void>;
}

export interface IMigrationRecord {
  id: string;
  name: string;
  timestamp: number;
  applied_at: Date;
  execution_time_ms: number;
  checksum: string;
}

export interface IMigrationConfig {
  databaseUrl: string;
  migrationsPath: string;
  migrationsTable?: string;
  schema?: string;
  validateChecksums?: boolean;
  dryRun?: boolean;
  logger?: IMigrationLogger;
}

export interface IMigrationLogger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export interface IMigrationStatus {
  pending: IMigration[];
  applied: IMigrationRecord[];
  conflicts: IMigrationConflict[];
}

export interface IMigrationConflict {
  migration: IMigration;
  reason: 'checksum_mismatch' | 'missing_file' | 'invalid_order';
  details: string;
}

export interface IMigrationResult {
  success: boolean;
  migrationsRun: number;
  error?: Error;
  duration: number;
}

export interface INeonConfig {
  connectionString: string;
  poolConfig?: {
    connectionTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    max?: number;
  };
  ssl?: boolean;
}

export type MigrationDirection = 'up' | 'down';

export interface IMigrationOptions {
  target?: string;
  count?: number;
  dryRun?: boolean;
  force?: boolean;
  correlationId?: CorrelationId;
}