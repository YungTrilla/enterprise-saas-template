import { PoolClient } from 'pg';

/**
 * Migration: initial_auth_schema
 * Creates the initial authentication and authorization database schema
 */

export async function up(client: PoolClient): Promise<void> {
  // Create users table
  await client.query(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20),
      avatar_url VARCHAR(500),
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_verified BOOLEAN NOT NULL DEFAULT false,
      verification_token VARCHAR(255),
      verification_expires_at TIMESTAMP,
      password_reset_token VARCHAR(255),
      password_reset_expires_at TIMESTAMP,
      mfa_enabled BOOLEAN NOT NULL DEFAULT false,
      mfa_secret VARCHAR(255),
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMP,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    );
  `);

  // Create roles table
  await client.query(`
    CREATE TABLE roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      is_system BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create permissions table
  await client.query(`
    CREATE TABLE permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource VARCHAR(100) NOT NULL,
      action VARCHAR(50) NOT NULL,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resource, action)
    );
  `);

  // Create role_permissions junction table
  await client.query(`
    CREATE TABLE role_permissions (
      role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (role_id, permission_id)
    );
  `);

  // Create user_roles junction table
  await client.query(`
    CREATE TABLE user_roles (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      assigned_by UUID REFERENCES users(id),
      PRIMARY KEY (user_id, role_id)
    );
  `);

  // Create user_sessions table
  await client.query(`
    CREATE TABLE user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      access_token_jti VARCHAR(255) NOT NULL UNIQUE,
      refresh_token_jti VARCHAR(255) NOT NULL UNIQUE,
      ip_address INET,
      user_agent TEXT,
      expires_at TIMESTAMP NOT NULL,
      refresh_expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create auth_audit_logs table
  await client.query(`
    CREATE TABLE auth_audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50),
      resource_id UUID,
      ip_address INET,
      user_agent TEXT,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create security_events table
  await client.query(`
    CREATE TABLE security_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type VARCHAR(100) NOT NULL,
      severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      ip_address INET,
      user_agent TEXT,
      details JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  await client.query(`
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_verification_token ON users(verification_token);
    CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);
    CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX idx_user_sessions_access_token ON user_sessions(access_token_jti);
    CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token_jti);
    CREATE INDEX idx_auth_audit_logs_user_id ON auth_audit_logs(user_id);
    CREATE INDEX idx_auth_audit_logs_created_at ON auth_audit_logs(created_at);
    CREATE INDEX idx_security_events_user_id ON security_events(user_id);
    CREATE INDEX idx_security_events_created_at ON security_events(created_at);
    CREATE INDEX idx_security_events_event_type ON security_events(event_type);
  `);

  // Create update trigger function
  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Apply update triggers
  await client.query(`
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
    CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);
}

export async function down(client: PoolClient): Promise<void> {
  // Drop tables in reverse order
  await client.query('DROP TABLE IF EXISTS security_events CASCADE;');
  await client.query('DROP TABLE IF EXISTS auth_audit_logs CASCADE;');
  await client.query('DROP TABLE IF EXISTS user_sessions CASCADE;');
  await client.query('DROP TABLE IF EXISTS user_roles CASCADE;');
  await client.query('DROP TABLE IF EXISTS role_permissions CASCADE;');
  await client.query('DROP TABLE IF EXISTS permissions CASCADE;');
  await client.query('DROP TABLE IF EXISTS roles CASCADE;');
  await client.query('DROP TABLE IF EXISTS users CASCADE;');

  // Drop function
  await client.query('DROP FUNCTION IF EXISTS update_updated_at() CASCADE;');
}
