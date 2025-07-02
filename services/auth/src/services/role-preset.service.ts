import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { IRolePreset } from '../models/user.model';
import { BaseService } from './base.service';
import { ApiError } from '../utils/api-error';

export class RolePresetService extends BaseService {
  constructor(pool: Pool) {
    super(pool);
  }

  /**
   * Get all active role presets
   */
  async getAllPresets(): Promise<IRolePreset[]> {
    const query = `
      SELECT 
        id,
        preset_name,
        display_name,
        description,
        base_role_id,
        additional_permissions,
        department,
        is_active
      FROM role_presets
      WHERE is_active = true
      ORDER BY display_name
    `;

    const result = await this.pool.query(query);
    return result.rows.map(this.mapToRolePreset);
  }

  /**
   * Get role preset by name
   */
  async getPresetByName(presetName: string): Promise<IRolePreset | null> {
    const query = `
      SELECT 
        id,
        preset_name,
        display_name,
        description,
        base_role_id,
        additional_permissions,
        department,
        is_active
      FROM role_presets
      WHERE preset_name = $1 AND is_active = true
    `;

    const result = await this.pool.query(query, [presetName]);
    return result.rows[0] ? this.mapToRolePreset(result.rows[0]) : null;
  }

  /**
   * Get role preset by ID
   */
  async getPresetById(presetId: string): Promise<IRolePreset | null> {
    const query = `
      SELECT 
        id,
        preset_name,
        display_name,
        description,
        base_role_id,
        additional_permissions,
        department,
        is_active
      FROM role_presets
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [presetId]);
    return result.rows[0] ? this.mapToRolePreset(result.rows[0]) : null;
  }

  /**
   * Get presets by department
   */
  async getPresetsByDepartment(department: string): Promise<IRolePreset[]> {
    const query = `
      SELECT 
        id,
        preset_name,
        display_name,
        description,
        base_role_id,
        additional_permissions,
        department,
        is_active
      FROM role_presets
      WHERE department = $1 AND is_active = true
      ORDER BY display_name
    `;

    const result = await this.pool.query(query, [department]);
    return result.rows.map(this.mapToRolePreset);
  }

  /**
   * Apply role preset to a user
   */
  async applyPresetToUser(
    userId: string,
    presetId: string,
    assignedBy: string
  ): Promise<void> {
    const preset = await this.getPresetById(presetId);
    if (!preset) {
      throw new ApiError('Role preset not found', 404);
    }

    // Start transaction
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Remove existing roles for the user
      await client.query(
        'DELETE FROM user_roles WHERE user_id = $1',
        [userId]
      );

      // Assign the base role with preset reference
      await client.query(
        `INSERT INTO user_roles (
          id, user_id, role_id, preset_id, assigned_by, assigned_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [uuidv4(), userId, preset.baseRoleId, presetId, assignedBy]
      );

      // Update user's department if specified in preset
      if (preset.department) {
        await client.query(
          'UPDATE users SET department = $1, updated_by = $2 WHERE id = $3',
          [preset.department, assignedBy, userId]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get effective permissions for a preset
   */
  async getPresetPermissions(presetId: string): Promise<string[]> {
    const preset = await this.getPresetById(presetId);
    if (!preset) {
      throw new ApiError('Role preset not found', 404);
    }

    // Get base role permissions
    const roleQuery = `
      SELECT permissions
      FROM roles
      WHERE id = $1
    `;
    const roleResult = await this.pool.query(roleQuery, [preset.baseRoleId]);
    const basePermissions = roleResult.rows[0]?.permissions || [];

    // Combine base permissions with additional permissions
    const allPermissions = new Set([
      ...basePermissions,
      ...preset.additionalPermissions
    ]);

    return Array.from(allPermissions);
  }

  /**
   * Map database row to IRolePreset
   */
  private mapToRolePreset(row: any): IRolePreset {
    return {
      id: row.id,
      presetName: row.preset_name,
      displayName: row.display_name,
      description: row.description,
      baseRoleId: row.base_role_id,
      additionalPermissions: row.additional_permissions || [],
      department: row.department,
      isActive: row.is_active
    };
  }
}