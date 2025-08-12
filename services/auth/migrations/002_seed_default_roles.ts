import { PoolClient } from 'pg';

/**
 * Migration: seed_default_roles
 * Seeds default roles and permissions for the system
 */

export async function up(client: PoolClient): Promise<void> {
  // Insert default roles
  await client.query(`
    INSERT INTO roles (name, description, is_system) VALUES
    ('super-admin', 'Full system access with all permissions', true),
    ('admin', 'Administrative access to manage system', true),
    ('manager', 'Manage operations and employees', true),
    ('employee', 'Regular employee access', true),
    ('customer', 'Customer access to their own data', true);
  `);

  // Insert system permissions
  await client.query(`
    INSERT INTO permissions (resource, action, description) VALUES
    -- User management
    ('users', 'create', 'Create new users'),
    ('users', 'read', 'View user information'),
    ('users', 'update', 'Update user information'),
    ('users', 'delete', 'Delete users'),
    ('users', 'list', 'List all users'),
    
    -- Role management
    ('roles', 'create', 'Create new roles'),
    ('roles', 'read', 'View role information'),
    ('roles', 'update', 'Update role information'),
    ('roles', 'delete', 'Delete roles'),
    ('roles', 'assign', 'Assign roles to users'),
    
    -- Permission management
    ('permissions', 'read', 'View permissions'),
    ('permissions', 'assign', 'Assign permissions to roles'),
    
    -- Inventory management
    ('inventory', 'create', 'Create inventory items'),
    ('inventory', 'read', 'View inventory'),
    ('inventory', 'update', 'Update inventory'),
    ('inventory', 'delete', 'Delete inventory items'),
    
    -- Order management
    ('orders', 'create', 'Create orders'),
    ('orders', 'read', 'View orders'),
    ('orders', 'update', 'Update orders'),
    ('orders', 'delete', 'Cancel orders'),
    ('orders', 'approve', 'Approve orders'),
    
    -- Analytics
    ('analytics', 'read', 'View analytics and reports'),
    ('analytics', 'export', 'Export analytics data'),
    
    -- System
    ('system', 'configure', 'Configure system settings'),
    ('audit', 'read', 'View audit logs');
  `);

  // Assign all permissions to super-admin
  await client.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.name = 'super-admin';
  `);

  // Assign admin permissions (everything except system configure)
  await client.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.name = 'admin'
    AND NOT (p.resource = 'system' AND p.action = 'configure');
  `);

  // Assign manager permissions
  await client.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.name = 'manager'
    AND (
      (p.resource = 'users' AND p.action IN ('read', 'list')) OR
      (p.resource = 'inventory' AND p.action IN ('create', 'read', 'update')) OR
      (p.resource = 'orders' AND p.action IN ('create', 'read', 'update', 'approve')) OR
      (p.resource = 'analytics' AND p.action = 'read')
    );
  `);

  // Assign employee permissions
  await client.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.name = 'employee'
    AND (
      (p.resource = 'inventory' AND p.action = 'read') OR
      (p.resource = 'orders' AND p.action IN ('create', 'read', 'update'))
    );
  `);

  // Assign customer permissions
  await client.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.name = 'customer'
    AND p.resource = 'orders' AND p.action = 'read';
  `);
}

export async function down(client: PoolClient): Promise<void> {
  // Remove all seeded data
  await client.query('DELETE FROM role_permissions;');
  await client.query('DELETE FROM permissions;');
  await client.query('DELETE FROM roles WHERE is_system = true;');
}
