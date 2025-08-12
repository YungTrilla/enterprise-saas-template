import { PoolClient } from 'pg';

/**
 * Migration: user_management_tables
 * Adds user management, scheduling, and time off functionality
 */

export async function up(client: PoolClient): Promise<void> {
  // Add user management columns to existing users table
  await client.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS default_hours_per_week INTEGER DEFAULT 40,
    ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS department VARCHAR(100),
    ADD COLUMN IF NOT EXISTS position VARCHAR(100),
    ADD COLUMN IF NOT EXISTS hire_date DATE,
    ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS address TEXT;
  `);

  // Create user schedules table
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      break_minutes INTEGER DEFAULT 0,
      total_hours DECIMAL(4,2) NOT NULL,
      is_overtime BOOLEAN DEFAULT FALSE,
      status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED')),
      notes TEXT,
      
      -- Audit fields
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES users(id),
      updated_by UUID REFERENCES users(id),
      
      -- Constraints
      CONSTRAINT valid_time_range CHECK (start_time < end_time),
      CONSTRAINT valid_hours CHECK (total_hours >= 0 AND total_hours <= 24),
      CONSTRAINT unique_user_date_schedule UNIQUE(user_id, date, start_time)
    );
  `);

  // Create time off requests table
  await client.query(`
    CREATE TABLE IF NOT EXISTS time_off_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('VACATION', 'SICK', 'PERSONAL', 'EMERGENCY', 'UNPAID')),
      reason TEXT,
      status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DENIED', 'CANCELLED')),
      approved_by UUID REFERENCES users(id),
      approved_at TIMESTAMP WITH TIME ZONE,
      denial_reason TEXT,
      
      -- Audit fields
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      CONSTRAINT valid_date_range CHECK (start_date <= end_date)
    );
  `);

  // Create schedule templates table
  await client.query(`
    CREATE TABLE IF NOT EXISTS schedule_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      department VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      
      -- Template definition (JSON)
      template_data JSONB NOT NULL,
      
      -- Audit fields
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES users(id),
      updated_by UUID REFERENCES users(id)
    );
  `);

  // Create user availability table
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_availability (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_available BOOLEAN DEFAULT TRUE,
      
      -- Audit fields
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      CONSTRAINT valid_availability_time CHECK (start_time < end_time),
      CONSTRAINT unique_user_day_availability UNIQUE(user_id, day_of_week, start_time)
    );
  `);

  // Create indexes for performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_schedules_user_date ON user_schedules(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_user_schedules_date ON user_schedules(date);
    CREATE INDEX IF NOT EXISTS idx_user_schedules_status ON user_schedules(status);
    
    CREATE INDEX IF NOT EXISTS idx_time_off_requests_user ON time_off_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_time_off_requests_dates ON time_off_requests(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);
    
    CREATE INDEX IF NOT EXISTS idx_user_availability_user ON user_availability(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_availability_day ON user_availability(day_of_week);
    
    CREATE INDEX IF NOT EXISTS idx_users_department ON users(department) WHERE department IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_supervisor ON users(supervisor_id) WHERE supervisor_id IS NOT NULL;
  `);

  // Add triggers for updated_at
  await client.query(`
    CREATE TRIGGER IF NOT EXISTS update_user_schedules_updated_at 
      BEFORE UPDATE ON user_schedules 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
      
    CREATE TRIGGER IF NOT EXISTS update_time_off_requests_updated_at 
      BEFORE UPDATE ON time_off_requests 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
      
    CREATE TRIGGER IF NOT EXISTS update_schedule_templates_updated_at 
      BEFORE UPDATE ON schedule_templates 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
      
    CREATE TRIGGER IF NOT EXISTS update_user_availability_updated_at 
      BEFORE UPDATE ON user_availability 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);

  // Update roles table to support permissions array (for backward compatibility)
  await client.query(`
    ALTER TABLE roles 
    ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';
  `);

  // Insert enhanced roles with permissions
  await client.query(`
    INSERT INTO roles (id, name, description, permissions, is_system) VALUES 
      (gen_random_uuid(), 'employee', 'Standard Employee', 
       ARRAY['profile:read', 'profile:update', 'schedule:read', 'timeoff:request'], true),
      (gen_random_uuid(), 'supervisor', 'Team Supervisor', 
       ARRAY['profile:read', 'profile:update', 'schedule:read', 'schedule:create', 'schedule:update', 'timeoff:request', 'timeoff:approve', 'users:list', 'users:read'], true),
      (gen_random_uuid(), 'manager', 'Department Manager', 
       ARRAY['profile:read', 'profile:update', 'schedule:read', 'schedule:create', 'schedule:update', 'schedule:delete', 'schedule:publish', 'timeoff:request', 'timeoff:approve', 'users:list', 'users:read', 'users:create', 'users:update', 'roles:assign'], true),
      (gen_random_uuid(), 'admin', 'System Administrator', 
       ARRAY['*:*'], true)
    ON CONFLICT (name) DO NOTHING;
  `);

  // Insert permissions
  await client.query(`
    INSERT INTO permissions (id, resource, action, description) VALUES
      (gen_random_uuid(), 'users', 'list', 'List all users'),
      (gen_random_uuid(), 'users', 'read', 'View user details'),
      (gen_random_uuid(), 'users', 'create', 'Create new users'),
      (gen_random_uuid(), 'users', 'update', 'Update user information'),
      (gen_random_uuid(), 'users', 'delete', 'Delete users'),
      (gen_random_uuid(), 'schedule', 'create', 'Create schedules'),
      (gen_random_uuid(), 'schedule', 'read', 'View schedules'),
      (gen_random_uuid(), 'schedule', 'update', 'Update schedules'),
      (gen_random_uuid(), 'schedule', 'delete', 'Delete schedules'),
      (gen_random_uuid(), 'schedule', 'publish', 'Publish schedules'),
      (gen_random_uuid(), 'timeoff', 'request', 'Request time off'),
      (gen_random_uuid(), 'timeoff', 'approve', 'Approve time off requests'),
      (gen_random_uuid(), 'profile', 'read', 'View own profile'),
      (gen_random_uuid(), 'profile', 'update', 'Update own profile'),
      (gen_random_uuid(), 'roles', 'assign', 'Assign roles to users')
    ON CONFLICT (resource, action) DO NOTHING;
  `);
}

export async function down(client: PoolClient): Promise<void> {
  // Drop triggers
  await client.query(`
    DROP TRIGGER IF EXISTS update_user_schedules_updated_at ON user_schedules;
    DROP TRIGGER IF EXISTS update_time_off_requests_updated_at ON time_off_requests;
    DROP TRIGGER IF EXISTS update_schedule_templates_updated_at ON schedule_templates;
    DROP TRIGGER IF EXISTS update_user_availability_updated_at ON user_availability;
  `);

  // Drop tables
  await client.query(`
    DROP TABLE IF EXISTS user_availability CASCADE;
    DROP TABLE IF EXISTS schedule_templates CASCADE;
    DROP TABLE IF EXISTS time_off_requests CASCADE;
    DROP TABLE IF EXISTS user_schedules CASCADE;
  `);

  // Remove added columns from users table
  await client.query(`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS default_hours_per_week,
    DROP COLUMN IF EXISTS hourly_rate,
    DROP COLUMN IF EXISTS department,
    DROP COLUMN IF EXISTS position,
    DROP COLUMN IF EXISTS hire_date,
    DROP COLUMN IF EXISTS supervisor_id,
    DROP COLUMN IF EXISTS emergency_contact_name,
    DROP COLUMN IF EXISTS emergency_contact_phone,
    DROP COLUMN IF EXISTS address;
  `);

  // Remove permissions column from roles
  await client.query(`
    ALTER TABLE roles DROP COLUMN IF EXISTS permissions;
  `);

  // Clean up added roles and permissions
  await client.query(`
    DELETE FROM roles WHERE name IN ('employee', 'supervisor', 'manager') AND is_system = true;
    DELETE FROM permissions WHERE resource IN ('users', 'schedule', 'timeoff', 'profile', 'roles');
  `);
}
