import { BaseEntity, AuditableEntity } from '@template/shared-types';

export interface IUser extends BaseEntity, AuditableEntity {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  avatarUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;

  // Role and permissions
  roles: IUserRole[];
  permissions: string[];

  // Employment details
  employeeId?: string;
  department?: string;
  position?: string;
  hireDate?: Date;

  // Pay information
  payType?: PayType;
  salaryAmount?: number;
  hourlyRate?: number;
  overtimeRate?: number;
  commissionRate?: number;
  baseSalary?: number;
  payFrequency?: PayFrequency;
  defaultHoursPerWeek?: number;

  // Banking (encrypted/secured)
  bankAccountNumber?: string;
  routingNumber?: string;
  taxWithholdingInfo?: Record<string, any>;
  benefitsEnrollment?: Record<string, any>;

  // Security
  mfaEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date;
}

export interface IUserRole {
  roleId: string;
  roleName: string;
  assignedAt: Date;
  assignedBy?: string;
  presetId?: string;
  presetName?: string;
}

export interface IRolePreset {
  id: string;
  presetName: string;
  displayName: string;
  description?: string;
  baseRoleId: string;
  additionalPermissions: string[];
  department?: string;
  isActive: boolean;
  defaultPayType?: PayType;
  defaultPayAmount?: number;
  defaultCommissionRate?: number;
}

export interface IUserCreateInput {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  roles?: string[];
  rolePreset?: string;
  department?: string;
  position?: string;
  hireDate?: Date;
  payType?: PayType;
  salaryAmount?: number;
  hourlyRate?: number;
  commissionRate?: number;
  baseSalary?: number;
  payFrequency?: PayFrequency;
  defaultHoursPerWeek?: number;
  sendWelcomeEmail?: boolean;
}

export interface IUserUpdateInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  isActive?: boolean;
  department?: string;
  position?: string;
  payType?: PayType;
  salaryAmount?: number;
  hourlyRate?: number;
  overtimeRate?: number;
  commissionRate?: number;
  baseSalary?: number;
  payFrequency?: PayFrequency;
  defaultHoursPerWeek?: number;
  bankAccountNumber?: string;
  routingNumber?: string;
}

export interface IUserFilter {
  search?: string;
  roles?: string[];
  isActive?: boolean;
  isVerified?: boolean;
  department?: string;
  hasSchedule?: boolean;
}

export enum PayType {
  HOURLY = 'HOURLY',
  SALARY = 'SALARY',
  SALARY_PLUS_COMMISSION = 'SALARY_PLUS_COMMISSION',
}

export enum PayFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface IBulkUserDeactivateInput {
  userIds: string[];
  reason?: string;
  effectiveDate?: Date;
}

export interface IBulkUserActionResult {
  successful: string[];
  failed: Array<{
    userId: string;
    reason: string;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}
