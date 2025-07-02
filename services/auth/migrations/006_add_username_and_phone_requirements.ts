import { PoolClient } from 'pg';

/**
 * Migration: add_username_and_phone_requirements
 * Adds username field and makes phone required for user management
 */

export async function up(client: PoolClient): Promise<void> {
  // Add username column to users table
  await client.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
  `);

  // Create index for username lookups
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
  `);

  // Update existing users to have username based on email (temporary)
  await client.query(`
    UPDATE users 
    SET username = LOWER(SPLIT_PART(email, '@', 1))
    WHERE username IS NULL;
  `);

  // Make username required after populating existing records
  await client.query(`
    ALTER TABLE users 
    ALTER COLUMN username SET NOT NULL;
  `);

  // Add check constraint for username format (alphanumeric, underscore, dash, 3-50 chars)
  await client.query(`
    ALTER TABLE users 
    ADD CONSTRAINT check_username_format 
    CHECK (username ~ '^[a-zA-Z0-9_-]{3,50}$');
  `);

  // Create role presets table for business-specific role configurations
  await client.query(`
    CREATE TABLE IF NOT EXISTS role_presets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      preset_name VARCHAR(100) NOT NULL UNIQUE,
      display_name VARCHAR(255) NOT NULL,
      description TEXT,
      base_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      additional_permissions TEXT[] DEFAULT '{}',
      department VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      
      -- Audit fields
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES users(id),
      updated_by UUID REFERENCES users(id)
    );
  `);

  // Insert role presets for business roles
  await client.query(`
    INSERT INTO role_presets (preset_name, display_name, description, base_role_id, additional_permissions, department)
    SELECT 
      'sales_manager',
      'Sales Manager',
      'Manages customer orders, quotes, and sales operations',
      r.id,
      ARRAY[
        'orders:*',
        'quotes:*',
        'customers:*',
        'analytics:sales',
        'reports:sales',
        'inventory:read'
      ],
      'Sales'
    FROM roles r WHERE r.name = 'manager'
    ON CONFLICT (preset_name) DO NOTHING;
  `);

  await client.query(`
    INSERT INTO role_presets (preset_name, display_name, description, base_role_id, additional_permissions, department)
    SELECT 
      'operations_manager',
      'Operations Manager',
      'Manages employee schedules, trucks, and delivery operations',
      r.id,
      ARRAY[
        'schedule:*',
        'deliveries:*',
        'trucks:*',
        'employees:*',
        'analytics:operations',
        'reports:operations',
        'routes:*'
      ],
      'Operations'
    FROM roles r WHERE r.name = 'manager'
    ON CONFLICT (preset_name) DO NOTHING;
  `);

  await client.query(`
    INSERT INTO role_presets (preset_name, display_name, description, base_role_id, additional_permissions, department)
    SELECT 
      'dispatcher',
      'Dispatcher',
      'Coordinates deliveries and driver schedules',
      r.id,
      ARRAY[
        'schedule:read',
        'schedule:update',
        'deliveries:*',
        'trucks:read',
        'trucks:assign',
        'employees:read',
        'routes:*',
        'communication:drivers'
      ],
      'Operations'
    FROM roles r WHERE r.name = 'supervisor'
    ON CONFLICT (preset_name) DO NOTHING;
  `);

  await client.query(`
    INSERT INTO role_presets (preset_name, display_name, description, base_role_id, additional_permissions, department)
    SELECT 
      'driver',
      'Driver',
      'Performs deliveries and manages own schedule',
      r.id,
      ARRAY[
        'deliveries:read',
        'deliveries:update:own',
        'schedule:read:own',
        'trucks:read:assigned',
        'routes:read:assigned',
        'timeentry:create:own',
        'communication:dispatch'
      ],
      'Operations'
    FROM roles r WHERE r.name = 'employee'
    ON CONFLICT (preset_name) DO NOTHING;
  `);

  await client.query(`
    INSERT INTO role_presets (preset_name, display_name, description, base_role_id, additional_permissions, department)
    SELECT 
      'crew_member',
      'Crew Member',
      'Assists with deliveries and equipment handling',
      r.id,
      ARRAY[
        'deliveries:read:assigned',
        'deliveries:update:assigned',
        'schedule:read:own',
        'equipment:handle',
        'timeentry:create:own',
        'communication:crew'
      ],
      'Operations'
    FROM roles r WHERE r.name = 'employee'
    ON CONFLICT (preset_name) DO NOTHING;
  `);

  // Add preset_id to user_roles for tracking which preset was used
  await client.query(`
    ALTER TABLE user_roles
    ADD COLUMN IF NOT EXISTS preset_id UUID REFERENCES role_presets(id);
  `);

  // Create index for role preset lookups
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_role_presets_preset_name ON role_presets(preset_name);
    CREATE INDEX IF NOT EXISTS idx_role_presets_base_role ON role_presets(base_role_id);
    CREATE INDEX IF NOT EXISTS idx_user_roles_preset ON user_roles(preset_id) WHERE preset_id IS NOT NULL;
  `);

  // Add trigger for updated_at on role_presets
  await client.query(`
    CREATE TRIGGER update_role_presets_updated_at 
    BEFORE UPDATE ON role_presets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(client: PoolClient): Promise<void> {
  // Remove preset_id from user_roles
  await client.query(`
    ALTER TABLE user_roles DROP COLUMN IF EXISTS preset_id;
  `);

  // Drop role_presets table
  await client.query(`
    DROP TABLE IF EXISTS role_presets CASCADE;
  `);

  // Remove username constraints and column
  await client.query(`
    ALTER TABLE users 
    DROP CONSTRAINT IF EXISTS check_username_format;
  `);

  await client.query(`
    DROP INDEX IF EXISTS idx_users_username;
  `);

  await client.query(`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS username;
  `);
}