import { PoolClient } from 'pg';

/**
 * Migration: add_user_schedule_tables
 * Adds user scheduling and time off management tables
 */

export async function up(client: PoolClient): Promise<void> {
  // Add additional fields to users table
  await client.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS default_hours_per_week INTEGER DEFAULT 40;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS overtime_rate DECIMAL(10,2);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
  `);

  // Create user_schedules table
  await client.query(`
    CREATE TABLE user_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      break_minutes INTEGER NOT NULL DEFAULT 0,
      total_hours DECIMAL(4,2) NOT NULL,
      is_overtime BOOLEAN NOT NULL DEFAULT false,
      status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PUBLISHED', 'APPROVED', 'COMPLETED', 'CANCELLED'
      )),
      notes TEXT,
      created_by UUID NOT NULL REFERENCES users(id),
      approved_by UUID REFERENCES users(id),
      approved_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(user_id, date, start_time)
    );
  `);

  // Create time_off_requests table
  await client.query(`
    CREATE TABLE time_off_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN (
        'VACATION', 'SICK', 'PERSONAL', 'UNPAID'
      )),
      reason TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
      )),
      approved_by UUID REFERENCES users(id),
      approved_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      CHECK (end_date >= start_date)
    );
  `);

  // Create schedule_templates table for recurring schedules
  await client.query(`
    CREATE TABLE schedule_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_by UUID NOT NULL REFERENCES users(id),
      is_active BOOLEAN NOT NULL DEFAULT true,
      template_data JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for performance
  await client.query(`
    -- User schedules indexes
    CREATE INDEX idx_user_schedules_user_id ON user_schedules(user_id);
    CREATE INDEX idx_user_schedules_date ON user_schedules(date);
    CREATE INDEX idx_user_schedules_status ON user_schedules(status);
    CREATE INDEX idx_user_schedules_user_date ON user_schedules(user_id, date);
    
    -- Time off requests indexes
    CREATE INDEX idx_time_off_requests_user_id ON time_off_requests(user_id);
    CREATE INDEX idx_time_off_requests_dates ON time_off_requests(start_date, end_date);
    CREATE INDEX idx_time_off_requests_status ON time_off_requests(status);
    
    -- Schedule templates indexes
    CREATE INDEX idx_schedule_templates_created_by ON schedule_templates(created_by);
    CREATE INDEX idx_schedule_templates_is_active ON schedule_templates(is_active);
    
    -- Users additional indexes
    CREATE INDEX idx_users_department ON users(department);
    CREATE INDEX idx_users_employee_id ON users(employee_id);
  `);

  // Update triggers for schedule tables
  await client.query(`
    CREATE TRIGGER update_user_schedules_updated_at BEFORE UPDATE ON user_schedules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
    CREATE TRIGGER update_time_off_requests_updated_at BEFORE UPDATE ON time_off_requests
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
    CREATE TRIGGER update_schedule_templates_updated_at BEFORE UPDATE ON schedule_templates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);

  // Create view for schedule overview
  await client.query(`
    CREATE VIEW schedule_overview AS
    SELECT 
      s.*,
      u.first_name,
      u.last_name,
      u.email,
      u.department,
      u.position,
      u.hourly_rate,
      u.overtime_rate,
      CASE 
        WHEN s.is_overtime THEN s.total_hours * COALESCE(u.overtime_rate, u.hourly_rate * 1.5, 0)
        ELSE s.total_hours * COALESCE(u.hourly_rate, 0)
      END as estimated_pay
    FROM user_schedules s
    JOIN users u ON s.user_id = u.id
    WHERE u.deleted_at IS NULL;
  `);
}

export async function down(client: PoolClient): Promise<void> {
  // Drop view
  await client.query('DROP VIEW IF EXISTS schedule_overview;');

  // Drop tables in reverse order
  await client.query('DROP TABLE IF EXISTS schedule_templates CASCADE;');
  await client.query('DROP TABLE IF EXISTS time_off_requests CASCADE;');
  await client.query('DROP TABLE IF EXISTS user_schedules CASCADE;');

  // Remove added columns from users table
  await client.query(`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS department,
    DROP COLUMN IF EXISTS position,
    DROP COLUMN IF EXISTS hire_date,
    DROP COLUMN IF EXISTS default_hours_per_week,
    DROP COLUMN IF EXISTS hourly_rate,
    DROP COLUMN IF EXISTS overtime_rate,
    DROP COLUMN IF EXISTS employee_id;
  `);
}
