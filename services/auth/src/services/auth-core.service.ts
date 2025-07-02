/**
 * Core Authentication Service
 * Handles login, logout, and token refresh operations
 */

import { v4 as uuidv4 } from 'uuid';
import { EntityId, CorrelationId } from '@abyss/shared-types';
import {
  IUser,
  ILoginRequest,
  ILoginResponse,
  ITokenPair,
  IAuthContext,
  IAuthConfig
} from '../types/auth';
import { JwtService } from './jwt.service';
import { PasswordService } from './password.service';
import { MfaService } from './mfa.service';
import { RbacService } from './rbac.service';
import { SessionService } from './session.service';
import { AuditService } from './audit.service';
import { AuthRepository } from '../database/repository';
import { CorrelatedLogger, SecurityLogger } from '../utils/logger';

export class AuthCoreService {
  private jwtService: JwtService;
  private passwordService: PasswordService;
  private mfaService: MfaService;
  private rbacService: RbacService;
  private sessionService: SessionService;
  private auditService: AuditService;
  private authRepository: AuthRepository;
  private logger: CorrelatedLogger;
  private securityLogger: SecurityLogger;
  private config: IAuthConfig;

  constructor(
    config: IAuthConfig,
    jwtService: JwtService,
    passwordService: PasswordService,
    mfaService: MfaService,
    rbacService: RbacService,
    sessionService: SessionService,
    auditService: AuditService,
    authRepository: AuthRepository
  ) {
    this.config = config;
    this.jwtService = jwtService;
    this.passwordService = passwordService;
    this.mfaService = mfaService;
    this.rbacService = rbacService;
    this.sessionService = sessionService;
    this.auditService = auditService;
    this.authRepository = authRepository;
    this.logger = new CorrelatedLogger('auth-core-service');
    this.securityLogger = new SecurityLogger();
  }

  /**
   * Authenticate user with email and password
   */
  async login(
    loginRequest: ILoginRequest,
    ipAddress: string,
    userAgent: string,
    correlationId: CorrelationId
  ): Promise<ILoginResponse> {
    this.logger.setCorrelationId(correlationId);

    try {
      // Find user by email
      const user = await this.authRepository.getUserByEmail(loginRequest.email, correlationId);
      if (!user) {
        await this.handleFailedLogin(loginRequest.email, 'USER_NOT_FOUND', ipAddress, userAgent, correlationId);
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (await this.isAccountLocked(user)) {
        await this.handleFailedLogin(loginRequest.email, 'ACCOUNT_LOCKED', ipAddress, userAgent, correlationId);
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }

      // Verify password
      const isValidPassword = await this.passwordService.verifyPassword(
        loginRequest.password,
        user.passwordHash,
        correlationId
      );

      if (!isValidPassword) {
        await this.authRepository.updateUserLoginAttempts(user.id, user.failedLoginAttempts + 1, correlationId);
        await this.handleFailedLogin(loginRequest.email, 'INVALID_PASSWORD', ipAddress, userAgent, correlationId);
        throw new Error('Invalid credentials');
      }

      // Check if MFA is required
      if (user.mfaEnabled) {
        if (!loginRequest.mfaCode) {
          return {
            user: this.sanitizeUser(user),
            tokens: {} as ITokenPair,
            requiresMfa: true
          };
        }

        // Verify MFA code
        const mfaResult = this.mfaService.verifyMfaCode(
          user.mfaSecret!,
          loginRequest.mfaCode,
          user.mfaBackupCodes || [],
          correlationId
        );

        if (!mfaResult.isValid) {
          await this.handleFailedLogin(loginRequest.email, 'INVALID_MFA', ipAddress, userAgent, correlationId);
          throw new Error('Invalid MFA code');
        }

        // Update backup codes if one was used
        if (mfaResult.usedBackupCode) {
          await this.authRepository.updateUser(user.id, { 
            mfaBackupCodes: user.mfaBackupCodes?.filter(code => code !== loginRequest.mfaCode) 
          }, correlationId);
        }
      }

      // Reset failed login attempts and update last login
      await this.authRepository.updateUserLastLogin(user.id, ipAddress, correlationId);

      // Get user roles and permissions
      const roles = await this.rbacService.getUserRoles(user.id, correlationId);
      const permissions = await this.rbacService.getUserPermissions(user.id, correlationId);

      // Create session
      const sessionId = uuidv4() as EntityId;
      const tokens = this.jwtService.generateTokenPair(
        user.id,
        user.email,
        roles,
        permissions,
        sessionId,
        correlationId
      );

      // Store session
      await this.sessionService.createSession({
        id: sessionId,
        userId: user.id,
        sessionToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessToken: tokens.accessToken,
        expiresAt: new Date(Date.now() + this.jwtService.getTokenExpirationTime(this.config.jwt.accessTokenExpiration) * 1000).toISOString(),
        isActive: true,
        ipAddress,
        userAgent,
        deviceFingerprint: loginRequest.deviceFingerprint,
        lastAccessAt: new Date().toISOString(),
        correlationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.id,
        updatedBy: user.id
      });

      // Log successful authentication
      this.securityLogger.logAuthAttempt(user.email, true, ipAddress, userAgent, correlationId);

      // Audit trail
      await this.auditService.logAuthEvent(
        user.id,
        'LOGIN_SUCCESS',
        'authentication',
        { mfaUsed: user.mfaEnabled },
        ipAddress,
        userAgent,
        true,
        correlationId,
        sessionId
      );

      this.logger.info('User login successful', {
        userId: user.id,
        email: user.email,
        mfaUsed: user.mfaEnabled,
        sessionId
      });

      return {
        user: this.sanitizeUser(user),
        tokens,
        requiresMfa: false,
        mfaSetupRequired: !user.mfaEnabled && this.config.security.mfaRequired
      };

    } catch (error) {
      this.logger.error('Login failed', {
        email: loginRequest.email,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(
    refreshToken: string,
    ipAddress: string,
    correlationId: CorrelationId
  ): Promise<ITokenPair> {
    this.logger.setCorrelationId(correlationId);

    try {
      // Verify refresh token
      const tokenPayload = this.jwtService.verifyRefreshToken(refreshToken, correlationId);

      // Get session
      const session = await this.sessionService.getSession(tokenPayload.sessionId);
      if (!session || !session.isActive) {
        throw new Error('Invalid or expired session');
      }

      // Get user
      const user = await this.authRepository.getUserById(tokenPayload.sub, correlationId);
      if (!user || user.status === 'deleted') {
        throw new Error('User not found or inactive');
      }

      // Get current roles and permissions
      const roles = await this.rbacService.getUserRoles(user.id, correlationId);
      const permissions = await this.rbacService.getUserPermissions(user.id, correlationId);

      // Generate new token pair
      const newTokens = this.jwtService.generateTokenPair(
        user.id,
        user.email,
        roles,
        permissions,
        session.id,
        correlationId
      );

      // Update session
      await this.sessionService.updateSession(session.id, {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        lastAccessAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.jwtService.getTokenExpirationTime(this.config.jwt.accessTokenExpiration) * 1000).toISOString()
      });

      // Log token refresh
      this.securityLogger.logSessionActivity(user.id, session.id, 'REFRESH', ipAddress, correlationId);

      this.logger.info('Token refresh successful', {
        userId: user.id,
        sessionId: session.id
      });

      return newTokens;

    } catch (error) {
      this.logger.error('Token refresh failed', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(accessToken: string, correlationId: CorrelationId): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      // Verify token and get payload
      const tokenPayload = this.jwtService.verifyAccessToken(accessToken, correlationId);

      // Revoke session
      await this.sessionService.revokeSession(tokenPayload.sessionId);

      // Log logout
      this.securityLogger.logSessionActivity(
        tokenPayload.sub,
        tokenPayload.sessionId,
        'REVOKE',
        '',
        correlationId
      );

      // Audit trail
      await this.auditService.logAuthEvent(
        tokenPayload.sub,
        'LOGOUT',
        'authentication',
        { sessionId: tokenPayload.sessionId },
        '',
        '',
        true,
        correlationId,
        tokenPayload.sessionId
      );

      this.logger.info('User logout successful', {
        userId: tokenPayload.sub,
        sessionId: tokenPayload.sessionId
      });

    } catch (error) {
      this.logger.error('Logout failed', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get authentication context from token
   */
  async getAuthContext(accessToken: string, correlationId: CorrelationId): Promise<IAuthContext> {
    this.logger.setCorrelationId(correlationId);

    try {
      const tokenPayload = this.jwtService.verifyAccessToken(accessToken, correlationId);

      // Verify session is still active
      const session = await this.sessionService.getSession(tokenPayload.sessionId);
      if (!session || !session.isActive) {
        throw new Error('Session expired or invalid');
      }

      return {
        userId: tokenPayload.sub,
        email: tokenPayload.email,
        roles: tokenPayload.roles,
        permissions: tokenPayload.permissions,
        sessionId: tokenPayload.sessionId,
        correlationId: tokenPayload.correlationId,
        isAuthenticated: true
      };

    } catch (error) {
      this.logger.error('Failed to get auth context', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  // Private helper methods
  private async isAccountLocked(user: IUser): Promise<boolean> {
    if (!user.lockoutUntil) return false;
    return new Date() < new Date(user.lockoutUntil);
  }

  private async handleFailedLogin(
    email: string,
    reason: string,
    ipAddress: string,
    userAgent: string,
    correlationId: CorrelationId
  ): Promise<void> {
    this.securityLogger.logAuthAttempt(email, false, ipAddress, userAgent, correlationId, reason);
    
    // Log security event for suspicious activity
    if (reason === 'ACCOUNT_LOCKED' || reason === 'INVALID_MFA') {
      this.securityLogger.logSecurityEvent(
        'SUSPICIOUS_LOGIN',
        'MEDIUM',
        `Failed login attempt: ${reason}`,
        { email, reason, ipAddress, userAgent },
        correlationId
      );
    }
  }

  private sanitizeUser(user: IUser): Omit<IUser, 'passwordHash' | 'mfaSecret' | 'mfaBackupCodes'> {
    const { passwordHash, mfaSecret, mfaBackupCodes, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}