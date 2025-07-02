/**
 * Authentication Service Types
 * Comprehensive type definitions for JWT, RBAC, and user management
 */

import { EntityId, CorrelationId, IAuditFields } from '@abyss/shared-types';

// ========================================
// User Types
// ========================================

export interface IUser extends IAuditFields {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  lastPasswordChangeAt: string;
  failedLoginAttempts: number;
  lockoutUntil?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  passwordResetToken?: string;
  passwordResetExpiresAt?: string;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: string;
  profilePictureUrl?: string;
  timezone: string;
  locale: string;
  metadata?: Record<string, unknown>;
}

export interface IUserSession extends IAuditFields {
  userId: EntityId;
  sessionToken: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: string;
  isActive: boolean;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  lastAccessAt: string;
  correlationId: CorrelationId;
}

// ========================================
// Role-Based Access Control (RBAC) Types
// ========================================

export interface IRole extends IAuditFields {
  name: string;
  description: string;
  isActive: boolean;
  permissions: EntityId[];
  metadata?: Record<string, unknown>;
}

export interface IPermission extends IAuditFields {
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
  isActive: boolean;
}

export interface IUserRole extends IAuditFields {
  userId: EntityId;
  roleId: EntityId;
  assignedBy: EntityId;
  expiresAt?: string;
  isActive: boolean;
}

export interface IRolePermission extends IAuditFields {
  roleId: EntityId;
  permissionId: EntityId;
  grantedBy: EntityId;
  conditions?: Record<string, unknown>;
  isActive: boolean;
}

// ========================================
// JWT Token Types
// ========================================

export interface IJwtPayload {
  sub: EntityId; // User ID
  email: string;
  roles: string[];
  permissions: string[];
  sessionId: EntityId;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  correlationId: CorrelationId;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  sessionId: EntityId;
}

export interface IRefreshTokenPayload {
  sub: EntityId;
  sessionId: EntityId;
  tokenVersion: number;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// ========================================
// Authentication Request/Response Types
// ========================================

export interface ILoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  deviceFingerprint?: string;
  correlationId?: CorrelationId;
}

export interface ILoginResponse {
  user: Omit<IUser, 'passwordHash' | 'mfaSecret' | 'mfaBackupCodes'>;
  tokens: ITokenPair;
  requiresMfa: boolean;
  mfaSetupRequired?: boolean;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  timezone?: string;
  locale?: string;
  correlationId?: CorrelationId;
}

export interface IRegisterResponse {
  user: Omit<IUser, 'passwordHash' | 'mfaSecret' | 'mfaBackupCodes'>;
  message: string;
  emailVerificationRequired: boolean;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
  correlationId?: CorrelationId;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  correlationId?: CorrelationId;
}

export interface IForgotPasswordRequest {
  email: string;
  correlationId?: CorrelationId;
}

export interface IResetPasswordRequest {
  token: string;
  newPassword: string;
  correlationId?: CorrelationId;
}

export interface IVerifyEmailRequest {
  token: string;
  correlationId?: CorrelationId;
}

export interface IMfaSetupRequest {
  correlationId?: CorrelationId;
}

export interface IMfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface IMfaVerifyRequest {
  code: string;
  correlationId?: CorrelationId;
}

export interface IMfaDisableRequest {
  password: string;
  correlationId?: CorrelationId;
}

// ========================================
// Authorization Types
// ========================================

export interface IAuthContext {
  userId: EntityId;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId: EntityId;
  correlationId: CorrelationId;
  isAuthenticated: boolean;
}

export interface IPermissionCheck {
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface IAuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: string[];
}

// ========================================
// Audit and Security Types
// ========================================

export interface IAuthAuditLog extends IAuditFields {
  userId?: EntityId;
  action: AuthAuditAction;
  resource: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  correlationId: CorrelationId;
  sessionId?: EntityId;
}

export interface ISecurityEvent extends IAuditFields {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: EntityId;
  description: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  correlationId: CorrelationId;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: EntityId;
}

// ========================================
// Enums
// ========================================

export enum AuthAuditAction {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  MFA_SETUP = 'MFA_SETUP',
  MFA_VERIFY = 'MFA_VERIFY',
  MFA_DISABLE = 'MFA_DISABLE',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  SESSION_REVOKE = 'SESSION_REVOKE',
  PERMISSION_CHECK = 'PERMISSION_CHECK',
  ROLE_ASSIGN = 'ROLE_ASSIGN',
  ROLE_REVOKE = 'ROLE_REVOKE'
}

export enum SecurityEventType {
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  ACCOUNT_LOCKOUT = 'ACCOUNT_LOCKOUT',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
  ANOMALOUS_BEHAVIOR = 'ANOMALOUS_BEHAVIOR'
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED'
}

// ========================================
// Configuration Types
// ========================================

export interface IAuthConfig {
  jwt: {
    secret: string;
    accessTokenExpiration: string;
    refreshTokenExpiration: string;
    issuer: string;
    audience: string;
  };
  password: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    saltRounds: number;
  };
  security: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    mfaRequired: boolean;
    passwordResetExpiration: number;
    emailVerificationExpiration: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
}

// ========================================
// Database Query Types
// ========================================

export interface IUserFilter {
  name?: string;
  email?: string;
  department?: string;
  role?: string;
  isActive?: boolean;
}

export interface IUserCreateData {
  email: string;
  username: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  position?: string;
  hireDate?: Date;
  defaultHoursPerWeek?: number;
  hourlyRate?: number;
  payType?: string;
  salaryAmount?: number;
  commissionRate?: number;
  baseSalary?: number;
  payFrequency?: string;
  isActive: boolean;
  isVerified: boolean;
}

export interface IScheduleCreateData {
  userId: EntityId;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  overtimeHours?: number;
  notes?: string;
  isPublished?: boolean;
}

export interface ISchedule extends IAuditFields {
  userId: EntityId;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  notes?: string;
  isPublished: boolean;
}

export interface ITimeOffRequestData {
  userId: EntityId;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'personal' | 'unpaid';
  reason: string;
}

export interface ITimeOffRequest extends IAuditFields {
  userId: EntityId;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'personal' | 'unpaid';
  reason: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  approvedBy?: EntityId;
  deniedBy?: EntityId;
  approvalDate?: string;
  denialDate?: string;
  denialReason?: string;
}