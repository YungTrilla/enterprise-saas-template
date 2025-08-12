/**
 * Password Service
 * Secure password hashing, validation, and strength checking
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IAuthConfig } from '../types/auth';
import { CorrelatedLogger } from '../utils/logger';
import { CorrelationId } from '@template/shared-types';

export interface IPasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'WEAK' | 'FAIR' | 'GOOD' | 'STRONG' | 'VERY_STRONG';
  score: number;
}

export class PasswordService {
  private config: IAuthConfig;
  private logger: CorrelatedLogger;

  constructor(config: IAuthConfig) {
    this.config = config;
    this.logger = new CorrelatedLogger('password-service');
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string, correlationId: CorrelationId): Promise<string> {
    this.logger.setCorrelationId(correlationId);

    try {
      const saltRounds = this.config.password.saltRounds;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      this.logger.debug('Password hashed successfully', {
        saltRounds
      });

      return hashedPassword;

    } catch (error) {
      this.logger.error('Password hashing failed', {
        error: (error as Error).message
      });
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string, correlationId: CorrelationId): Promise<boolean> {
    this.logger.setCorrelationId(correlationId);

    try {
      const isValid = await bcrypt.compare(password, hash);

      this.logger.debug('Password verification completed', {
        isValid
      });

      return isValid;

    } catch (error) {
      this.logger.error('Password verification failed', {
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Validate password against policy
   */
  validatePassword(password: string): IPasswordValidationResult {
    const errors: string[] = [];
    const policy = this.config.password;

    // Length validation
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (password.length > policy.maxLength) {
      errors.push(`Password must not exceed ${policy.maxLength} characters`);
    }

    // Character requirements
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common patterns to avoid
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common and easily guessable');
    }

    if (this.hasSequentialCharacters(password)) {
      errors.push('Password should not contain sequential characters');
    }

    if (this.hasRepeatingCharacters(password)) {
      errors.push('Password should not contain too many repeating characters');
    }

    // Calculate strength score
    const { strength, score } = this.calculatePasswordStrength(password);

    const isValid = errors.length === 0;

    this.logger.debug('Password validation completed', {
      isValid,
      strength,
      score,
      errorCount: errors.length
    });

    return {
      isValid,
      errors,
      strength,
      score
    };
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';

    // Ensure at least one character from each required category
    if (this.config.password.requireUppercase) {
      password += this.getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    }
    if (this.config.password.requireLowercase) {
      password += this.getRandomChar('abcdefghijklmnopqrstuvwxyz');
    }
    if (this.config.password.requireNumbers) {
      password += this.getRandomChar('0123456789');
    }
    if (this.config.password.requireSpecialChars) {
      password += this.getRandomChar('!@#$%^&*()');
    }

    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
      password += this.getRandomChar(charset);
    }

    // Shuffle the password to randomize character positions
    return this.shuffleString(password);
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(): { token: string; hashedToken: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + this.config.security.passwordResetExpiration);

    this.logger.debug('Password reset token generated', {
      expiresAt
    });

    return {
      token,
      hashedToken,
      expiresAt
    };
  }

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token: string, hashedToken: string, expiresAt: Date): boolean {
    // Check if token is expired
    if (new Date() > expiresAt) {
      this.logger.warn('Password reset token expired', {
        expiresAt,
        now: new Date()
      });
      return false;
    }

    // Verify token hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hashedToken));

    this.logger.debug('Password reset token verification completed', {
      isValid
    });

    return isValid;
  }

  /**
   * Calculate password strength
   */
  private calculatePasswordStrength(password: string): { strength: IPasswordValidationResult['strength']; score: number } {
    let score = 0;

    // Length bonus
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (password.length >= 16) score += 25;

    // Character variety
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

    // Patterns (negative scoring)
    if (this.hasSequentialCharacters(password)) score -= 10;
    if (this.hasRepeatingCharacters(password)) score -= 15;
    if (this.isCommonPassword(password)) score -= 25;

    // Determine strength category
    let strength: IPasswordValidationResult['strength'];
    if (score < 25) strength = 'WEAK';
    else if (score < 50) strength = 'FAIR';
    else if (score < 75) strength = 'GOOD';
    else if (score < 90) strength = 'STRONG';
    else strength = 'VERY_STRONG';

    return { strength, score: Math.max(0, Math.min(100, score)) };
  }

  /**
   * Check if password is commonly used
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1'
    ];

    return commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase())
    );
  }

  /**
   * Check for sequential characters
   */
  private hasSequentialCharacters(password: string): boolean {
    const sequences = ['abcdef', '123456', 'qwerty', 'asdfgh', 'zxcvbn'];
    
    return sequences.some(seq => {
      for (let i = 0; i <= password.length - 4; i++) {
        const substring = password.toLowerCase().substring(i, i + 4);
        if (seq.includes(substring) || seq.split('').reverse().join('').includes(substring)) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Check for too many repeating characters
   */
  private hasRepeatingCharacters(password: string): boolean {
    let maxRepeats = 0;
    let currentRepeats = 1;

    for (let i = 1; i < password.length; i++) {
      if (password[i] === password[i - 1]) {
        currentRepeats++;
      } else {
        maxRepeats = Math.max(maxRepeats, currentRepeats);
        currentRepeats = 1;
      }
    }

    maxRepeats = Math.max(maxRepeats, currentRepeats);
    return maxRepeats >= 3; // Too many if 3 or more consecutive identical characters
  }

  /**
   * Get random character from charset
   */
  private getRandomChar(charset: string): string {
    const randomIndex = crypto.randomInt(0, charset.length);
    return charset[randomIndex];
  }

  /**
   * Shuffle string characters
   */
  private shuffleString(str: string): string {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }
}