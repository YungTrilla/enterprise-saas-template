import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IMigration } from './types';

export function generateMigrationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}`;
}

export function generateMigrationName(description: string): string {
  const sanitized = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return sanitized || 'migration';
}

export async function calculateChecksum(content: string): Promise<string> {
  return crypto
    .createHash('sha256')
    .update(content, 'utf8')
    .digest('hex');
}

export function parseMigrationFilename(filename: string): {
  id: string;
  name: string;
  timestamp: number;
} | null {
  const match = filename.match(/^(\d+)_(\w+)_([\w_]+)\.(ts|js)$/);
  if (!match) {
    return null;
  }

  return {
    id: `${match[1]}_${match[2]}`,
    name: match[3],
    timestamp: parseInt(match[1], 10),
  };
}

export async function loadMigrationFile(filePath: string): Promise<IMigration> {
  const filename = path.basename(filePath);
  const parsed = parseMigrationFilename(filename);
  
  if (!parsed) {
    throw new Error(`Invalid migration filename: ${filename}`);
  }

  const module = await import(filePath);
  
  if (!module.up || typeof module.up !== 'function') {
    throw new Error(`Migration ${filename} must export an 'up' function`);
  }
  
  if (!module.down || typeof module.down !== 'function') {
    throw new Error(`Migration ${filename} must export a 'down' function`);
  }

  return {
    id: parsed.id,
    name: parsed.name,
    timestamp: parsed.timestamp,
    up: module.up,
    down: module.down,
  };
}

export async function getMigrationFiles(migrationsPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(migrationsPath);
    return files
      .filter(file => /^\d+_\w+_[\w_]+\.(ts|js)$/.test(file))
      .sort()
      .map(file => path.join(migrationsPath, file));
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function createMigrationFile(
  migrationsPath: string,
  name: string,
  template?: string
): Promise<string> {
  await fs.mkdir(migrationsPath, { recursive: true });
  
  const id = generateMigrationId();
  const safeName = generateMigrationName(name);
  const filename = `${id}_${safeName}.ts`;
  const filePath = path.join(migrationsPath, filename);
  
  const content = template || generateDefaultTemplate(safeName);
  await fs.writeFile(filePath, content, 'utf8');
  
  return filePath;
}

function generateDefaultTemplate(name: string): string {
  return `import { PoolClient } from 'pg';

/**
 * Migration: ${name}
 * Generated: ${new Date().toISOString()}
 */

export async function up(client: PoolClient): Promise<void> {
  // Add your migration logic here
  await client.query(\`
    -- Add your SQL here
  \`);
}

export async function down(client: PoolClient): Promise<void> {
  // Add your rollback logic here
  await client.query(\`
    -- Add your rollback SQL here
  \`);
}
`;
}