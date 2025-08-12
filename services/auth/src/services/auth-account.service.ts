/**
 * Account Management Service
 * Handles user registration, password reset, and email verification
 */

import { v4 as uuidv4 } from 'uuid';
import { EntityId, CorrelationId } from '@template/shared-types';
import {
  IUser,
  IRegisterRequest,
  IRegisterResponse,
  IChangePasswordRequest,
  IForgotPasswordRequest,
  IResetPasswordRequest,
  IAuthConfig,
} from '../types/auth';
import { JwtService } from './jwt.service';
import { PasswordService } from './password.service';
import { RbacService } from './rbac.service';
import { AuditService } from './audit.service';
import { AuthRepository } from '../database/repository';
import { CorrelatedLogger, SecurityLogger } from '../utils/logger';

export class AuthAccountService {
  private jwtService: JwtService;
  private passwordService: PasswordService;
  private rbacService: RbacService;
  private auditService: AuditService;
  private authRepository: AuthRepository;
  private logger: CorrelatedLogger;
  private securityLogger: SecurityLogger;
  private config: IAuthConfig;

  constructor(
    config: IAuthConfig,
    jwtService: JwtService,
    passwordService: PasswordService,
    rbacService: RbacService,
    auditService: AuditService,
    authRepository: AuthRepository
  ) {
    this.config = config;
    this.jwtService = jwtService;
    this.passwordService = passwordService;
    this.rbacService = rbacService;
    this.auditService = auditService;
    this.authRepository = authRepository;
    this.logger = new CorrelatedLogger('auth-account-service');
    this.securityLogger = new SecurityLogger();
  }

  /**
   * Register new user
   */
  async register(
    registerRequest: IRegisterRequest,
    ipAddress: string,
    userAgent: string,
    correlationId: CorrelationId
  ): Promise<IRegisterResponse> {
    this.logger.setCorrelationId(correlationId);

    try {
      // Check if user already exists
      const existingUser = await this.authRepository.getUserByEmail(
        registerRequest.email,
        correlationId
      );
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Validate password
      const passwordValidation = this.passwordService.validatePassword(registerRequest.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash password
      const passwordHash = await this.passwordService.hashPassword(
        registerRequest.password,
        correlationId
      );

      // Generate email verification token
      const emailVerificationToken = this.jwtService.generateSecureToken();
      const hashedEmailToken = this.jwtService.hashToken(emailVerificationToken);

      // Create user
      const userId = uuidv4() as EntityId;
      const user: IUser = {
        id: userId,
        email: registerRequest.email.toLowerCase(),
        passwordHash,
        firstName: registerRequest.firstName,
        lastName: registerRequest.lastName,
        status: 'active',
        isEmailVerified: false,
        lastPasswordChangeAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        mfaEnabled: false,
        emailVerificationToken: hashedEmailToken,
        emailVerificationExpiresAt: new Date(
          Date.now() + this.config.security.emailVerificationExpiration
        ).toISOString(),
        timezone: registerRequest.timezone || 'UTC',
        locale: registerRequest.locale || 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
        updatedBy: userId,
      };

      // Save user to database
      await this.authRepository.createUser(user, correlationId);

      // Assign default role
      await this.rbacService.assignDefaultRole(userId, correlationId);

      // Send email verification (would integrate with email service)
      await this.sendEmailVerification(user.email, emailVerificationToken);

      // Audit trail
      await this.auditService.logAuthEvent(
        userId,
        'REGISTER',
        'user_registration',
        { email: user.email },
        ipAddress,
        userAgent,
        true,
        correlationId
      );

      this.logger.info('User registration successful', {
        userId,
        email: user.email,
      });

      return {
        user: this.sanitizeUser(user),
        message: 'Registration successful. Please check your email to verify your account.',
        emailVerificationRequired: true,
      };
    } catch (error) {
      this.logger.error('Registration failed', {
        email: registerRequest.email,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: EntityId,
    request: IChangePasswordRequest,
    correlationId: CorrelationId
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const user = await this.authRepository.getUserById(userId, correlationId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await this.passwordService.verifyPassword(
        request.currentPassword,
        user.passwordHash,
        correlationId
      );

      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      const passwordValidation = this.passwordService.validatePassword(request.newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Check password history
      const isPasswordReused = await this.passwordService.checkPasswordHistory(
        userId,
        request.newPassword,
        correlationId
      );

      if (isPasswordReused) {
        throw new Error('Password has been used recently. Please choose a different password.');
      }

      // Hash new password
      const newPasswordHash = await this.passwordService.hashPassword(
        request.newPassword,
        correlationId
      );

      // Update password
      await this.authRepository.updateUser(
        userId,
        {
          passwordHash: newPasswordHash,
          lastPasswordChangeAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        },
        correlationId
      );

      // Store in password history
      await this.passwordService.addToPasswordHistory(userId, newPasswordHash, correlationId);

      // Revoke all sessions
      await this.authRepository.revokeAllUserSessions(
        userId,
        userId,
        'Password changed',
        correlationId
      );

      // Audit trail
      await this.auditService.logAuthEvent(
        userId,
        'PASSWORD_CHANGE',
        'account_management',
        {},
        '',
        '',
        true,
        correlationId
      );

      this.logger.info('Password changed successfully', { userId });
    } catch (error) {
      this.logger.error('Password change failed', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Request password reset email
   */
  async sendPasswordResetEmail(
    request: IForgotPasswordRequest,
    ipAddress: string,
    correlationId: CorrelationId
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const user = await this.authRepository.getUserByEmail(request.email, correlationId);

      // Don't reveal if user exists or not
      if (!user) {
        this.logger.info('Password reset requested for non-existent email', {
          email: request.email,
        });
        return;
      }

      // Generate reset token
      const resetToken = this.jwtService.generateSecureToken();
      const hashedResetToken = this.jwtService.hashToken(resetToken);

      // Store reset token
      await this.authRepository.updateUser(
        user.id,
        {
          passwordResetToken: hashedResetToken,
          passwordResetExpiresAt: new Date(
            Date.now() + this.config.security.passwordResetExpiration
          ).toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: user.id,
        },
        correlationId
      );

      // Send reset email (would integrate with email service)
      await this.sendPasswordResetEmailToUser(user.email, resetToken);

      // Audit trail
      await this.auditService.logAuthEvent(
        user.id,
        'PASSWORD_RESET_REQUEST',
        'account_management',
        { email: user.email },
        ipAddress,
        '',
        true,
        correlationId
      );

      this.logger.info('Password reset email sent', {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      this.logger.error('Password reset request failed', {
        email: request.email,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    request: IResetPasswordRequest,
    ipAddress: string,
    correlationId: CorrelationId
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const hashedToken = this.jwtService.hashToken(request.token);

      // Find user by reset token
      const user = await this.authRepository.getUserByPasswordResetToken(
        hashedToken,
        correlationId
      );
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Check if token is expired
      if (new Date() > new Date(user.passwordResetExpiresAt!)) {
        throw new Error('Reset token has expired');
      }

      // Validate new password
      const passwordValidation = this.passwordService.validatePassword(request.newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash new password
      const newPasswordHash = await this.passwordService.hashPassword(
        request.newPassword,
        correlationId
      );

      // Update password and clear reset token
      await this.authRepository.updateUser(
        user.id,
        {
          passwordHash: newPasswordHash,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
          lastPasswordChangeAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: user.id,
        },
        correlationId
      );

      // Store in password history
      await this.passwordService.addToPasswordHistory(user.id, newPasswordHash, correlationId);

      // Revoke all sessions
      await this.authRepository.revokeAllUserSessions(
        user.id,
        user.id,
        'Password reset',
        correlationId
      );

      // Audit trail
      await this.auditService.logAuthEvent(
        user.id,
        'PASSWORD_RESET',
        'account_management',
        {},
        ipAddress,
        '',
        true,
        correlationId
      );

      this.logger.info('Password reset successful', { userId: user.id });
    } catch (error) {
      this.logger.error('Password reset failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string, correlationId: CorrelationId): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const hashedToken = this.jwtService.hashToken(token);

      // Find user by verification token
      const user = await this.authRepository.getUserByEmailVerificationToken(
        hashedToken,
        correlationId
      );
      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      // Check if token is expired
      if (new Date() > new Date(user.emailVerificationExpiresAt!)) {
        throw new Error('Verification token has expired');
      }

      // Verify email
      await this.authRepository.updateUser(
        user.id,
        {
          isEmailVerified: true,
          emailVerifiedAt: new Date().toISOString(),
          emailVerificationToken: null,
          emailVerificationExpiresAt: null,
          updatedAt: new Date().toISOString(),
          updatedBy: user.id,
        },
        correlationId
      );

      // Audit trail
      await this.auditService.logAuthEvent(
        user.id,
        'EMAIL_VERIFIED',
        'account_management',
        { email: user.email },
        '',
        '',
        true,
        correlationId
      );

      this.logger.info('Email verified successfully', {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      this.logger.error('Email verification failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(email: string, correlationId: CorrelationId): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const user = await this.authRepository.getUserByEmail(email, correlationId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isEmailVerified) {
        throw new Error('Email is already verified');
      }

      // Generate new verification token
      const emailVerificationToken = this.jwtService.generateSecureToken();
      const hashedEmailToken = this.jwtService.hashToken(emailVerificationToken);

      // Update verification token
      await this.authRepository.updateUser(
        user.id,
        {
          emailVerificationToken: hashedEmailToken,
          emailVerificationExpiresAt: new Date(
            Date.now() + this.config.security.emailVerificationExpiration
          ).toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: user.id,
        },
        correlationId
      );

      // Send verification email
      await this.sendEmailVerification(user.email, emailVerificationToken);

      this.logger.info('Verification email resent', {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      this.logger.error('Resend verification failed', {
        email,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Private helper methods
  private async sendEmailVerification(email: string, token: string): Promise<void> {
    // Email service integration would go here
    this.logger.info('Email verification sent', { email });
  }

  private async sendPasswordResetEmailToUser(email: string, token: string): Promise<void> {
    // Email service integration would go here
    this.logger.info('Password reset email sent', { email });
  }

  private sanitizeUser(user: IUser): Omit<IUser, 'passwordHash' | 'mfaSecret' | 'mfaBackupCodes'> {
    const { passwordHash, mfaSecret, mfaBackupCodes, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
