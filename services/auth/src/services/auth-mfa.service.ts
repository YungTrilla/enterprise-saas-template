/**
 * MFA Authentication Service
 * Handles Multi-Factor Authentication setup and verification
 */

import { EntityId, CorrelationId } from '@abyss/shared-types';
import { IMfaSetupResponse, IMfaVerifyRequest, IAuthConfig } from '../types/auth';
import { MfaService } from './mfa.service';
import { AuditService } from './audit.service';
import { AuthRepository } from '../database/repository';
import { CorrelatedLogger } from '../utils/logger';

export class AuthMfaService {
  private mfaService: MfaService;
  private auditService: AuditService;
  private authRepository: AuthRepository;
  private logger: CorrelatedLogger;
  private config: IAuthConfig;

  constructor(
    config: IAuthConfig,
    mfaService: MfaService,
    auditService: AuditService,
    authRepository: AuthRepository
  ) {
    this.config = config;
    this.mfaService = mfaService;
    this.auditService = auditService;
    this.authRepository = authRepository;
    this.logger = new CorrelatedLogger('auth-mfa-service');
  }

  /**
   * Setup MFA for user
   */
  async setupMfa(userId: EntityId, correlationId: CorrelationId): Promise<IMfaSetupResponse> {
    this.logger.setCorrelationId(correlationId);

    try {
      const user = await this.authRepository.getUserById(userId, correlationId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.mfaEnabled) {
        throw new Error('MFA is already enabled for this user');
      }

      // Generate MFA setup
      const mfaSetup = await this.mfaService.generateMfaSetup(
        userId,
        user.email,
        'Abyss Central',
        correlationId
      );

      // Hash backup codes for storage
      const hashedBackupCodes = this.mfaService.hashBackupCodes(mfaSetup.backupCodes);

      // Store MFA secret and backup codes (but don't enable MFA yet)
      await this.authRepository.updateUser(userId, {
        mfaSecret: mfaSetup.secret,
        mfaBackupCodes: hashedBackupCodes,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      }, correlationId);

      // Audit trail
      await this.auditService.logAuthEvent(
        userId,
        'MFA_SETUP_INITIATED',
        'mfa_management',
        { backupCodeCount: mfaSetup.backupCodes.length },
        '',
        '',
        true,
        correlationId
      );

      this.logger.info('MFA setup initiated', {
        userId,
        backupCodeCount: mfaSetup.backupCodes.length
      });

      return {
        secret: mfaSetup.secret,
        qrCodeUrl: mfaSetup.qrCodeUrl,
        backupCodes: mfaSetup.backupCodes
      };

    } catch (error) {
      this.logger.error('MFA setup failed', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Verify and enable MFA
   */
  async verifyAndEnableMfa(
    userId: EntityId,
    request: IMfaVerifyRequest,
    correlationId: CorrelationId
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const user = await this.authRepository.getUserById(userId, correlationId);
      if (!user || !user.mfaSecret) {
        throw new Error('MFA setup not found. Please setup MFA first.');
      }

      if (user.mfaEnabled) {
        throw new Error('MFA is already enabled');
      }

      // Verify the code
      const isValid = this.mfaService.verifyTotpCode(
        user.mfaSecret,
        request.code,
        correlationId
      );

      if (!isValid) {
        throw new Error('Invalid MFA code');
      }

      // Enable MFA
      await this.authRepository.updateUser(userId, {
        mfaEnabled: true,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      }, correlationId);

      // Audit trail
      await this.auditService.logAuthEvent(
        userId,
        'MFA_ENABLED',
        'mfa_management',
        { enabled: true },
        '',
        '',
        true,
        correlationId
      );

      this.logger.info('MFA enabled successfully', {
        userId
      });

    } catch (error) {
      this.logger.error('MFA verification failed', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMfa(
    userId: EntityId,
    request: IMfaVerifyRequest,
    correlationId: CorrelationId
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const user = await this.authRepository.getUserById(userId, correlationId);
      if (!user || !user.mfaEnabled) {
        throw new Error('MFA is not enabled for this user');
      }

      // Verify the code before disabling
      const isValid = this.mfaService.verifyTotpCode(
        user.mfaSecret!,
        request.code,
        correlationId
      );

      if (!isValid) {
        throw new Error('Invalid MFA code');
      }

      // Disable MFA
      await this.authRepository.updateUser(userId, {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      }, correlationId);

      // Audit trail
      await this.auditService.logAuthEvent(
        userId,
        'MFA_DISABLED',
        'mfa_management',
        { enabled: false },
        '',
        '',
        true,
        correlationId
      );

      this.logger.info('MFA disabled successfully', {
        userId
      });

    } catch (error) {
      this.logger.error('MFA disable failed', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Regenerate MFA backup codes
   */
  async regenerateBackupCodes(
    userId: EntityId,
    request: IMfaVerifyRequest,
    correlationId: CorrelationId
  ): Promise<string[]> {
    this.logger.setCorrelationId(correlationId);

    try {
      const user = await this.authRepository.getUserById(userId, correlationId);
      if (!user || !user.mfaEnabled) {
        throw new Error('MFA is not enabled for this user');
      }

      // Verify the code before regenerating
      const isValid = this.mfaService.verifyTotpCode(
        user.mfaSecret!,
        request.code,
        correlationId
      );

      if (!isValid) {
        throw new Error('Invalid MFA code');
      }

      // Generate new backup codes
      const backupCodes = this.mfaService.generateBackupCodes(8);
      const hashedBackupCodes = this.mfaService.hashBackupCodes(backupCodes);

      // Update backup codes
      await this.authRepository.updateUser(userId, {
        mfaBackupCodes: hashedBackupCodes,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      }, correlationId);

      // Audit trail
      await this.auditService.logAuthEvent(
        userId,
        'MFA_BACKUP_CODES_REGENERATED',
        'mfa_management',
        { codeCount: backupCodes.length },
        '',
        '',
        true,
        correlationId
      );

      this.logger.info('Backup codes regenerated', {
        userId,
        codeCount: backupCodes.length
      });

      return backupCodes;

    } catch (error) {
      this.logger.error('Backup code regeneration failed', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }
}