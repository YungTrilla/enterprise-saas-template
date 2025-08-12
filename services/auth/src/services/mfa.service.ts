/**
 * Multi-Factor Authentication (MFA) Service
 * TOTP-based MFA with backup codes and QR code generation
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { CorrelatedLogger } from '../utils/logger';
import { CorrelationId, EntityId } from '@template/shared-types';

export interface IMfaSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface IMfaVerificationResult {
  isValid: boolean;
  usedBackupCode?: boolean;
  remainingBackupCodes?: number;
}

export class MfaService {
  private logger: CorrelatedLogger;

  constructor() {
    this.logger = new CorrelatedLogger('mfa-service');
  }

  /**
   * Generate MFA secret and setup data
   */
  async generateMfaSetup(
    userId: EntityId,
    email: string,
    serviceName: string = 'Abyss Central',
    correlationId: CorrelationId
  ): Promise<IMfaSetupResult> {
    this.logger.setCorrelationId(correlationId);

    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${serviceName} (${email})`,
        issuer: serviceName,
        length: 32
      });

      // Generate QR code
      const otpauthUrl = speakeasy.otpauthURL({
        secret: secret.ascii,
        label: `${serviceName}:${email}`,
        issuer: serviceName,
        algorithm: 'sha1',
        digits: 6,
        period: 30
      });

      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      this.logger.info('MFA setup generated successfully', {
        userId,
        email,
        backupCodeCount: backupCodes.length
      });

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes
      };

    } catch (error) {
      this.logger.error('Failed to generate MFA setup', {
        userId,
        email,
        error: (error as Error).message
      });
      throw new Error('MFA setup generation failed');
    }
  }

  /**
   * Verify TOTP code
   */
  verifyTotpCode(
    secret: string,
    code: string,
    correlationId: CorrelationId,
    window: number = 1
  ): boolean {
    this.logger.setCorrelationId(correlationId);

    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window, // Allow 1 step before/after current time
        algorithm: 'sha1',
        digits: 6,
        step: 30
      });

      this.logger.debug('TOTP code verification completed', {
        verified,
        codeLength: code.length
      });

      return verified;

    } catch (error) {
      this.logger.error('TOTP code verification failed', {
        error: (error as Error).message,
        codeLength: code?.length
      });
      return false;
    }
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(
    code: string,
    storedBackupCodes: string[],
    correlationId: CorrelationId
  ): IMfaVerificationResult {
    this.logger.setCorrelationId(correlationId);

    try {
      // Hash the provided code to compare with stored hashed codes
      const hashedCode = this.hashBackupCode(code);

      // Find matching backup code
      const codeIndex = storedBackupCodes.findIndex(storedCode => 
        crypto.timingSafeEqual(Buffer.from(hashedCode), Buffer.from(storedCode))
      );

      const isValid = codeIndex !== -1;

      if (isValid) {
        // Remove used backup code
        storedBackupCodes.splice(codeIndex, 1);
      }

      this.logger.info('Backup code verification completed', {
        isValid,
        remainingCodes: storedBackupCodes.length
      });

      return {
        isValid,
        usedBackupCode: true,
        remainingBackupCodes: storedBackupCodes.length
      };

    } catch (error) {
      this.logger.error('Backup code verification failed', {
        error: (error as Error).message
      });
      return {
        isValid: false,
        usedBackupCode: true,
        remainingBackupCodes: storedBackupCodes.length
      };
    }
  }

  /**
   * Verify MFA code (TOTP or backup code)
   */
  verifyMfaCode(
    secret: string,
    code: string,
    backupCodes: string[],
    correlationId: CorrelationId
  ): IMfaVerificationResult {
    this.logger.setCorrelationId(correlationId);

    // First try TOTP verification
    if (this.verifyTotpCode(secret, code, correlationId)) {
      this.logger.info('MFA verification successful via TOTP');
      return {
        isValid: true,
        usedBackupCode: false
      };
    }

    // If TOTP fails, try backup code
    const backupResult = this.verifyBackupCode(code, backupCodes, correlationId);
    
    if (backupResult.isValid) {
      this.logger.info('MFA verification successful via backup code');
    } else {
      this.logger.warn('MFA verification failed for both TOTP and backup code');
    }

    return backupResult;
  }

  /**
   * Generate new backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    this.logger.debug('Generated new backup codes', {
      count: codes.length
    });

    return codes;
  }

  /**
   * Hash backup codes for secure storage
   */
  hashBackupCodes(codes: string[]): string[] {
    return codes.map(code => this.hashBackupCode(code));
  }

  /**
   * Hash individual backup code
   */
  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
  }

  /**
   * Generate current TOTP code (for testing purposes)
   */
  generateCurrentTotpCode(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
      algorithm: 'sha1',
      digits: 6,
      step: 30
    });
  }

  /**
   * Get remaining time for current TOTP code
   */
  getRemainingTotpTime(): number {
    const step = 30; // 30 seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(currentTime / step);
    const nextStep = (timeStep + 1) * step;
    return nextStep - currentTime;
  }

  /**
   * Validate backup code format
   */
  isValidBackupCodeFormat(code: string): boolean {
    // Backup codes should be 8 characters, alphanumeric
    const backupCodeRegex = /^[A-F0-9]{8}$/i;
    return backupCodeRegex.test(code);
  }

  /**
   * Validate TOTP code format
   */
  isValidTotpCodeFormat(code: string): boolean {
    // TOTP codes should be 6 digits
    const totpCodeRegex = /^\d{6}$/;
    return totpCodeRegex.test(code);
  }

  /**
   * Check if MFA code is in correct format
   */
  validateMfaCodeFormat(code: string): { isValid: boolean; type: 'TOTP' | 'BACKUP' | 'INVALID' } {
    if (this.isValidTotpCodeFormat(code)) {
      return { isValid: true, type: 'TOTP' };
    }
    
    if (this.isValidBackupCodeFormat(code)) {
      return { isValid: true, type: 'BACKUP' };
    }

    return { isValid: false, type: 'INVALID' };
  }

  /**
   * Generate recovery information for account recovery
   */
  generateRecoveryInfo(userId: EntityId): {
    recoveryCode: string;
    hashedRecoveryCode: string;
    expiresAt: Date;
  } {
    const recoveryCode = crypto.randomBytes(16).toString('hex').toUpperCase();
    const hashedRecoveryCode = crypto.createHash('sha256').update(recoveryCode).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    this.logger.info('Generated MFA recovery information', {
      userId,
      expiresAt
    });

    return {
      recoveryCode,
      hashedRecoveryCode,
      expiresAt
    };
  }
}