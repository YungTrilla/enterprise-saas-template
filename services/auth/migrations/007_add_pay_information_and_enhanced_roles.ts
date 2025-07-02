import { PoolClient } from 'pg';

/**
 * Migration: add_pay_information_and_enhanced_roles
 * Adds comprehensive pay information, commission tracking, and enhanced role management
 */

export async function up(client: PoolClient): Promise<void> {
  // Add pay information columns to users table
  await client.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS pay_type VARCHAR(20) CHECK (pay_type IN ('HOURLY', 'SALARY', 'SALARY_PLUS_COMMISSION')),
    ADD COLUMN IF NOT EXISTS salary_amount DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) CHECK (commission_rate >= 0 AND commission_rate <= 100),
    ADD COLUMN IF NOT EXISTS base_salary DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS pay_frequency VARCHAR(20) DEFAULT 'BIWEEKLY' CHECK (pay_frequency IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY')),
    ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS routing_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS tax_withholding_info JSONB,
    ADD COLUMN IF NOT EXISTS benefits_enrollment JSONB;
  `);

  // Create commission tracking table
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_commissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      total_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
      commission_rate DECIMAL(5,2) NOT NULL,
      commission_amount DECIMAL(12,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'ADJUSTED')),
      approved_by UUID REFERENCES users(id),
      approved_at TIMESTAMP WITH TIME ZONE,
      paid_at TIMESTAMP WITH TIME ZONE,
      payment_reference VARCHAR(255),
      notes TEXT,
      
      -- Audit fields
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES users(id),
      updated_by UUID REFERENCES users(id),
      
      -- Constraints
      CONSTRAINT valid_period CHECK (period_start <= period_end),
      CONSTRAINT unique_user_period UNIQUE(user_id, period_start, period_end)
    );
  `);

  // Create commission adjustments table for tracking changes
  await client.query(`
    CREATE TABLE IF NOT EXISTS commission_adjustments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      commission_id UUID NOT NULL REFERENCES user_commissions(id) ON DELETE CASCADE,
      adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN ('BONUS', 'DEDUCTION', 'CORRECTION', 'REFUND')),
      amount DECIMAL(12,2) NOT NULL,
      reason TEXT NOT NULL,
      adjusted_by UUID NOT NULL REFERENCES users(id),
      
      -- Audit fields
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Update role presets with pay type information
  await client.query(`
    ALTER TABLE role_presets
    ADD COLUMN IF NOT EXISTS default_pay_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS default_pay_amount DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS default_commission_rate DECIMAL(5,2);
  `);

  // Update existing role presets with pay type defaults
  await client.query(`
    UPDATE role_presets SET
      default_pay_type = CASE
        WHEN preset_name = 'sales_manager' THEN 'SALARY_PLUS_COMMISSION'
        WHEN preset_name IN ('operations_manager', 'dispatcher') THEN 'SALARY'
        WHEN preset_name IN ('driver', 'crew_member') THEN 'HOURLY'
        ELSE NULL
      END,
      default_commission_rate = CASE
        WHEN preset_name = 'sales_manager' THEN 10.0
        ELSE NULL
      END
    WHERE preset_name IN ('sales_manager', 'operations_manager', 'dispatcher', 'driver', 'crew_member');
  `);


  // Add Admin role preset with full access
  await client.query(`
    INSERT INTO role_presets (preset_name, display_name, description, base_role_id, additional_permissions, department, default_pay_type)
    SELECT 
      'system_admin',
      'System Administrator',
      'Full system access including user management and financial data',
      r.id,
      ARRAY[
        '*:*' -- Full access to all resources and actions
      ],
      'Administration',
      'SALARY'
    FROM roles r WHERE r.name = 'admin'
    ON CONFLICT (preset_name) DO NOTHING;
  `);

  // Create financial permissions that need to be restricted
  await client.query(`
    INSERT INTO permissions (resource, action, display_name, description, system_permission) VALUES
      ('financial', 'view_revenue', 'View Revenue', 'Access to company revenue data', true),
      ('financial', 'view_payments', 'View Payments', 'Access to customer payment details', true),
      ('financial', 'view_employee_pay', 'View Employee Pay', 'Access to employee salary/wage information', true),
      ('financial', 'manage_commissions', 'Manage Commissions', 'Ability to approve and adjust commissions', true),
      ('financial', 'export_financial', 'Export Financial Data', 'Export financial reports and data', true),
      ('employees', 'view_all_schedules', 'View All Schedules', 'Access to all employee schedules', true),
      ('employees', 'view_personal_info', 'View Personal Info', 'Access to employee personal information', true)
    ON CONFLICT (resource, action) DO NOTHING;
  `);

  // Update role permissions to be more restrictive
  await client.query(`
    -- Remove financial permissions from non-admin roles
    UPDATE roles 
    SET permissions = array_remove(array_remove(array_remove(permissions, 'financial:*'), 'financial:view_payments'), 'financial:view_revenue')
    WHERE name NOT IN ('admin', 'super-admin');

    -- Ensure drivers/crew cannot see other schedules or financial data
    UPDATE role_presets
    SET additional_permissions = array_remove(array_remove(additional_permissions, 'schedule:read'), 'employees:read')
    WHERE preset_name IN ('driver', 'crew_member');
  `);

  // Create indexes for performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_users_pay_type ON users(pay_type);
    CREATE INDEX IF NOT EXISTS idx_users_active_status ON users(status, is_active);
    CREATE INDEX IF NOT EXISTS idx_user_commissions_user_period ON user_commissions(user_id, period_start, period_end);
    CREATE INDEX IF NOT EXISTS idx_user_commissions_status ON user_commissions(status);
    CREATE INDEX IF NOT EXISTS idx_commission_adjustments_commission ON commission_adjustments(commission_id);
  `);

  // Add triggers for commission tracking
  await client.query(`
    CREATE OR REPLACE FUNCTION calculate_commission_amount()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.commission_amount = NEW.total_sales * (NEW.commission_rate / 100);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER calculate_commission_before_insert
      BEFORE INSERT ON user_commissions
      FOR EACH ROW
      EXECUTE FUNCTION calculate_commission_amount();

    CREATE TRIGGER calculate_commission_before_update
      BEFORE UPDATE OF total_sales, commission_rate ON user_commissions
      FOR EACH ROW
      EXECUTE FUNCTION calculate_commission_amount();
  `);

  // Add trigger for updated_at on new tables
  await client.query(`
    CREATE TRIGGER update_user_commissions_updated_at 
      BEFORE UPDATE ON user_commissions 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(client: PoolClient): Promise<void> {
  // Drop triggers
  await client.query(`
    DROP TRIGGER IF EXISTS calculate_commission_before_insert ON user_commissions;
    DROP TRIGGER IF EXISTS calculate_commission_before_update ON user_commissions;
    DROP TRIGGER IF EXISTS update_user_commissions_updated_at ON user_commissions;
    DROP FUNCTION IF EXISTS calculate_commission_amount();
  `);

  // Drop indexes
  await client.query(`
    DROP INDEX IF EXISTS idx_users_pay_type;
    DROP INDEX IF EXISTS idx_users_active_status;
    DROP INDEX IF EXISTS idx_user_commissions_user_period;
    DROP INDEX IF EXISTS idx_user_commissions_status;
    DROP INDEX IF EXISTS idx_commission_adjustments_commission;
  `);

  // Drop tables
  await client.query(`
    DROP TABLE IF EXISTS commission_adjustments CASCADE;
    DROP TABLE IF EXISTS user_commissions CASCADE;
  `);

  // Remove columns from role_presets
  await client.query(`
    ALTER TABLE role_presets
    DROP COLUMN IF EXISTS default_pay_type,
    DROP COLUMN IF EXISTS default_pay_amount,
    DROP COLUMN IF EXISTS default_commission_rate;
  `);

  // Remove columns from users
  await client.query(`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS pay_type,
    DROP COLUMN IF EXISTS salary_amount,
    DROP COLUMN IF EXISTS commission_rate,
    DROP COLUMN IF EXISTS base_salary,
    DROP COLUMN IF EXISTS pay_frequency,
    DROP COLUMN IF EXISTS bank_account_number,
    DROP COLUMN IF EXISTS routing_number,
    DROP COLUMN IF EXISTS tax_withholding_info,
    DROP COLUMN IF EXISTS benefits_enrollment;
  `);

  // Remove added role presets
  await client.query(`
    DELETE FROM role_presets WHERE preset_name = 'system_admin';
  `);

  // Remove added permissions
  await client.query(`
    DELETE FROM permissions WHERE resource = 'financial'
    OR (resource = 'employees' AND action IN ('view_all_schedules', 'view_personal_info'));
  `);
}