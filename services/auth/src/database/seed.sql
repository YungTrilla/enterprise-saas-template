-- Auth Service Database Seed Data
-- Initial data for development and testing

-- Default system roles
INSERT INTO roles (id, name, display_name, description, system_role, permissions) VALUES
('00000000-0000-0000-0000-000000000001', 'super-admin', 'Super Administrator', 'Full system access with all permissions', true, ARRAY[
    'users:create', 'users:read', 'users:update', 'users:delete',
    'roles:create', 'roles:read', 'roles:update', 'roles:delete',
    'permissions:create', 'permissions:read', 'permissions:update', 'permissions:delete',
    'audit:read', 'audit:export',
    'security:read', 'security:manage',
    'system:admin'
]),
('00000000-0000-0000-0000-000000000002', 'admin', 'Administrator', 'Administrative access to most features', true, ARRAY[
    'users:create', 'users:read', 'users:update',
    'roles:read', 'roles:update',
    'permissions:read',
    'audit:read',
    'security:read'
]),
('00000000-0000-0000-0000-000000000003', 'manager', 'Manager', 'Management level access', false, ARRAY[
    'users:read', 'users:update',
    'roles:read',
    'permissions:read',
    'inventory:manage',
    'orders:manage',
    'analytics:read'
]),
('00000000-0000-0000-0000-000000000004', 'employee', 'Employee', 'Standard employee access', false, ARRAY[
    'users:read',
    'inventory:read',
    'orders:read',
    'orders:update'
]),
('00000000-0000-0000-0000-000000000005', 'customer', 'Customer', 'Customer portal access', false, ARRAY[
    'profile:read',
    'profile:update',
    'orders:create',
    'orders:read'
]);

-- System permissions
INSERT INTO permissions (id, resource, action, display_name, description, system_permission) VALUES
-- User management permissions
('10000000-0000-0000-0000-000000000001', 'users', 'create', 'Create Users', 'Create new user accounts', true),
('10000000-0000-0000-0000-000000000002', 'users', 'read', 'View Users', 'View user information', true),
('10000000-0000-0000-0000-000000000003', 'users', 'update', 'Update Users', 'Modify user information', true),
('10000000-0000-0000-0000-000000000004', 'users', 'delete', 'Delete Users', 'Delete user accounts', true),

-- Role management permissions  
('10000000-0000-0000-0000-000000000005', 'roles', 'create', 'Create Roles', 'Create new roles', true),
('10000000-0000-0000-0000-000000000006', 'roles', 'read', 'View Roles', 'View role information', true),
('10000000-0000-0000-0000-000000000007', 'roles', 'update', 'Update Roles', 'Modify role information', true),
('10000000-0000-0000-0000-000000000008', 'roles', 'delete', 'Delete Roles', 'Delete roles', true),

-- Permission management permissions
('10000000-0000-0000-0000-000000000009', 'permissions', 'create', 'Create Permissions', 'Create new permissions', true),
('10000000-0000-0000-0000-000000000010', 'permissions', 'read', 'View Permissions', 'View permission information', true),
('10000000-0000-0000-0000-000000000011', 'permissions', 'update', 'Update Permissions', 'Modify permission information', true),
('10000000-0000-0000-0000-000000000012', 'permissions', 'delete', 'Delete Permissions', 'Delete permissions', true),

-- Audit permissions
('10000000-0000-0000-0000-000000000013', 'audit', 'read', 'View Audit Logs', 'View system audit logs', true),
('10000000-0000-0000-0000-000000000014', 'audit', 'export', 'Export Audit Data', 'Export audit data for compliance', true),

-- Security permissions
('10000000-0000-0000-0000-000000000015', 'security', 'read', 'View Security Events', 'View security events and alerts', true),
('10000000-0000-0000-0000-000000000016', 'security', 'manage', 'Manage Security', 'Manage security settings and policies', true),

-- System permissions
('10000000-0000-0000-0000-000000000017', 'system', 'admin', 'System Administration', 'Full system administration access', true),

-- Profile permissions
('10000000-0000-0000-0000-000000000018', 'profile', 'read', 'View Profile', 'View own profile information', true),
('10000000-0000-0000-0000-000000000019', 'profile', 'update', 'Update Profile', 'Update own profile information', true),

-- Business domain permissions (for other services)
('20000000-0000-0000-0000-000000000001', 'inventory', 'create', 'Create Inventory', 'Create new inventory items', false),
('20000000-0000-0000-0000-000000000002', 'inventory', 'read', 'View Inventory', 'View inventory information', false),
('20000000-0000-0000-0000-000000000003', 'inventory', 'update', 'Update Inventory', 'Modify inventory items', false),
('20000000-0000-0000-0000-000000000004', 'inventory', 'delete', 'Delete Inventory', 'Delete inventory items', false),
('20000000-0000-0000-0000-000000000005', 'inventory', 'manage', 'Manage Inventory', 'Full inventory management access', false),

('20000000-0000-0000-0000-000000000006', 'orders', 'create', 'Create Orders', 'Create new orders', false),
('20000000-0000-0000-0000-000000000007', 'orders', 'read', 'View Orders', 'View order information', false),
('20000000-0000-0000-0000-000000000008', 'orders', 'update', 'Update Orders', 'Modify order information', false),
('20000000-0000-0000-0000-000000000009', 'orders', 'delete', 'Delete Orders', 'Delete orders', false),
('20000000-0000-0000-0000-000000000010', 'orders', 'manage', 'Manage Orders', 'Full order management access', false),

('20000000-0000-0000-0000-000000000011', 'analytics', 'read', 'View Analytics', 'View analytics and reports', false),
('20000000-0000-0000-0000-000000000012', 'analytics', 'export', 'Export Analytics', 'Export analytics data', false);

-- Default super admin user (for development/setup)
-- Password: AdminSetup123! (should be changed immediately in production)
INSERT INTO users (id, email, password_hash, first_name, last_name, email_verified, status) VALUES
('90000000-0000-0000-0000-000000000001', 'admin@abyss-central.dev', '$2b$12$LQv3c1yqBWVHxkd0LQ4YCOdDiEqJZ2vEb4rDGz5Fy.Y4pN1gN9K6e', 'System', 'Administrator', true, 'active');

-- Assign super admin role to default admin user
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001');

-- Development test users (optional - only for development)
INSERT INTO users (id, email, password_hash, first_name, last_name, email_verified, status) VALUES
('90000000-0000-0000-0000-000000000002', 'manager@abyss-central.dev', '$2b$12$LQv3c1yqBWVHxkd0LQ4YCOdDiEqJZ2vEb4rDGz5Fy.Y4pN1gN9K6e', 'Jane', 'Manager', true, 'active'),
('90000000-0000-0000-0000-000000000003', 'employee@abyss-central.dev', '$2b$12$LQv3c1yqBWVHxkd0LQ4YCOdDiEqJZ2vEb4rDGz5Fy.Y4pN1gN9K6e', 'John', 'Employee', true, 'active'),
('90000000-0000-0000-0000-000000000004', 'customer@abyss-central.dev', '$2b$12$LQv3c1yqBWVHxkd0LQ4YCOdDiEqJZ2vEb4rDGz5Fy.Y4pN1gN9K6e', 'Sarah', 'Customer', true, 'active');

-- Assign roles to test users
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
('90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000001'), -- Manager
('90000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000001'), -- Employee
('90000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', '90000000-0000-0000-0000-000000000001'); -- Customer