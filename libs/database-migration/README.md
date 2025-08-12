# @abyss/database-migration

Database migration infrastructure for Abyss Central services, optimized for
Neon.tech serverless PostgreSQL.

## Features

- 🚀 **Neon.tech Optimized**: Native support for Neon serverless PostgreSQL
- 📦 **Service Independence**: Each service manages its own migrations
- 🔄 **Bidirectional Migrations**: Support for up and down migrations
- 🛡️ **Conflict Detection**: Checksum validation and order verification
- 📊 **Status Tracking**: Complete migration history and status
- 🔧 **CLI Tool**: Comprehensive command-line interface
- 🎯 **Transaction Safety**: All migrations run in transactions
- 📝 **TypeScript Support**: Full type safety for migrations

## Installation

```bash
npm install @abyss/database-migration
```

## Usage

### CLI Commands

```bash
# Create a new migration
npx abyss-migrate create add_users_table

# Run pending migrations
npx abyss-migrate up

# Rollback last migration
npx abyss-migrate down

# Check migration status
npx abyss-migrate status

# Run specific number of migrations
npx abyss-migrate up --count 2

# Dry run to see what would be executed
npx abyss-migrate up --dry-run
```

### Environment Variables

```bash
# Neon.tech connection string
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
```

### Programmatic Usage

```typescript
import { MigrationRunner, IMigrationConfig } from '@abyss/database-migration';

const config: IMigrationConfig = {
  databaseUrl: process.env.DATABASE_URL!,
  migrationsPath: './migrations',
  migrationsTable: 'schema_migrations',
  logger: customLogger,
};

const runner = new MigrationRunner(config);

// Run migrations
const result = await runner.run('up', {
  correlationId: 'abc-123',
});

// Check status
const status = await runner.getStatus();
```

### Writing Migrations

Migrations are TypeScript files with `up` and `down` functions:

```typescript
import { PoolClient } from 'pg';

export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function down(client: PoolClient): Promise<void> {
  await client.query('DROP TABLE IF EXISTS users;');
}
```

## Migration File Naming

Migration files follow the pattern: `{timestamp}_{random}_{name}.ts`

Example: `1704067200000_abc123_add_users_table.ts`

## Best Practices

1. **Keep migrations small and focused**
   - One logical change per migration
   - Easier to debug and rollback

2. **Always provide down migrations**
   - Ensure clean rollbacks
   - Test both up and down paths

3. **Use transactions**
   - Migrations automatically run in transactions
   - Ensure atomicity of changes

4. **Avoid data migrations in schema migrations**
   - Keep schema and data changes separate
   - Use scripts for data migrations

5. **Test migrations locally first**
   - Use dry-run mode
   - Verify on development database

## Neon.tech Optimization

The library uses Neon's serverless driver for optimal performance:

- Connection pooling with proper timeouts
- Efficient query execution
- Automatic retry logic
- SSL/TLS encryption

## Security

- All connections use SSL/TLS
- Connection strings should use environment variables
- Migrations run with transaction isolation
- Audit trail of all executed migrations

## Error Handling

The migration runner provides comprehensive error handling:

- Rollback on failure
- Conflict detection
- Detailed error logging
- Correlation ID tracking

## Integration with Services

Each service should have its own migrations directory:

```
services/
  auth-service/
    migrations/
      001_create_users_table.ts
      002_add_roles_table.ts
  inventory-service/
    migrations/
      001_create_equipment_table.ts
```

## License

PROPRIETARY - VOID Software Company
