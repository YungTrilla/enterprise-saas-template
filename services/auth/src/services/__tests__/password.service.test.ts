/**
 * Password Service Unit Tests
 */

import { PasswordService } from '../password.service';
import { createMockAuthConfig, createCorrelationId } from '../../__tests__/utils/test-helpers';
import bcrypt from 'bcryptjs';

describe('PasswordService', () => {
  let passwordService: PasswordService;
  let mockConfig: ReturnType<typeof createMockAuthConfig>;

  beforeEach(() => {
    mockConfig = createMockAuthConfig();
    passwordService = new PasswordService(mockConfig);
  });

  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      const result = passwordService.validatePassword('StrongP@ssw0rd123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than minimum length', () => {
      const result = passwordService.validatePassword('Sh0rt!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password longer than maximum length', () => {
      const longPassword = 'A'.repeat(129) + '1!';
      const result = passwordService.validatePassword(longPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be no more than 128 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = passwordService.validatePassword('weakpassword123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = passwordService.validatePassword('STRONGPASSWORD123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = passwordService.validatePassword('StrongPassword!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = passwordService.validatePassword('StrongPassword123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should collect all validation errors', () => {
      const result = passwordService.validatePassword('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const correlationId = createCorrelationId();

      const hash = await passwordService.hashPassword(password, correlationId);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2a$')).toBe(true); // bcrypt hash prefix
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const correlationId = createCorrelationId();

      const hash1 = await passwordService.hashPassword(password, correlationId);
      const hash2 = await passwordService.hashPassword(password, correlationId);

      expect(hash1).not.toBe(hash2);
    });

    it('should use configured salt rounds', async () => {
      const password = 'TestPassword123!';
      const correlationId = createCorrelationId();

      jest.spyOn(bcrypt, 'hash');

      await passwordService.hashPassword(password, correlationId);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, mockConfig.password.saltRounds);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const correlationId = createCorrelationId();
      const hash = await bcrypt.hash(password, 10);

      const isValid = await passwordService.verifyPassword(password, hash, correlationId);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const correlationId = createCorrelationId();
      const hash = await bcrypt.hash(password, 10);

      const isValid = await passwordService.verifyPassword(wrongPassword, hash, correlationId);

      expect(isValid).toBe(false);
    });

    it('should handle invalid hash gracefully', async () => {
      const password = 'TestPassword123!';
      const correlationId = createCorrelationId();
      const invalidHash = 'invalid-hash';

      const isValid = await passwordService.verifyPassword(password, invalidHash, correlationId);

      expect(isValid).toBe(false);
    });
  });

  describe('checkPasswordHistory', () => {
    it('should check password against history', async () => {
      const userId = 'user-123';
      const password = 'TestPassword123!';
      const correlationId = createCorrelationId();

      // Mock authRepository
      const mockAuthRepository = {
        getPasswordHistory: jest.fn().mockResolvedValue([
          { passwordHash: await bcrypt.hash('OldPassword1!', 10) },
          { passwordHash: await bcrypt.hash('OldPassword2!', 10) },
          { passwordHash: await bcrypt.hash(password, 10) }, // Same password in history
        ]),
      };

      (passwordService as any).authRepository = mockAuthRepository;

      const isReused = await passwordService.checkPasswordHistory(userId, password, correlationId);

      expect(isReused).toBe(true);
      expect(mockAuthRepository.getPasswordHistory).toHaveBeenCalledWith(userId, 5, correlationId);
    });

    it('should return false if password not in history', async () => {
      const userId = 'user-123';
      const password = 'NewPassword123!';
      const correlationId = createCorrelationId();

      const mockAuthRepository = {
        getPasswordHistory: jest
          .fn()
          .mockResolvedValue([
            { passwordHash: await bcrypt.hash('OldPassword1!', 10) },
            { passwordHash: await bcrypt.hash('OldPassword2!', 10) },
          ]),
      };

      (passwordService as any).authRepository = mockAuthRepository;

      const isReused = await passwordService.checkPasswordHistory(userId, password, correlationId);

      expect(isReused).toBe(false);
    });

    it('should handle empty history', async () => {
      const userId = 'user-123';
      const password = 'NewPassword123!';
      const correlationId = createCorrelationId();

      const mockAuthRepository = {
        getPasswordHistory: jest.fn().mockResolvedValue([]),
      };

      (passwordService as any).authRepository = mockAuthRepository;

      const isReused = await passwordService.checkPasswordHistory(userId, password, correlationId);

      expect(isReused).toBe(false);
    });
  });

  describe('addToPasswordHistory', () => {
    it('should add password to history', async () => {
      const userId = 'user-123';
      const passwordHash = 'hashed-password';
      const correlationId = createCorrelationId();

      const mockAuthRepository = {
        addPasswordHistory: jest.fn().mockResolvedValue(undefined),
      };

      (passwordService as any).authRepository = mockAuthRepository;

      await passwordService.addToPasswordHistory(userId, passwordHash, correlationId);

      expect(mockAuthRepository.addPasswordHistory).toHaveBeenCalledWith(
        userId,
        passwordHash,
        correlationId
      );
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate a valid random password', () => {
      const password = passwordService.generateRandomPassword();

      expect(password).toBeTruthy();
      expect(password.length).toBeGreaterThanOrEqual(16);

      // Verify generated password passes validation
      const validation = passwordService.validatePassword(password);
      expect(validation.isValid).toBe(true);
    });

    it('should generate unique passwords', () => {
      const passwords = new Set();

      for (let i = 0; i < 10; i++) {
        passwords.add(passwordService.generateRandomPassword());
      }

      expect(passwords.size).toBe(10);
    });
  });

  describe('getPasswordStrength', () => {
    it('should return weak for short password', () => {
      const strength = passwordService.getPasswordStrength('weak');
      expect(strength).toBe('weak');
    });

    it('should return medium for moderate password', () => {
      const strength = passwordService.getPasswordStrength('Medium123');
      expect(strength).toBe('medium');
    });

    it('should return strong for complex password', () => {
      const strength = passwordService.getPasswordStrength('Strong@Pass123');
      expect(strength).toBe('strong');
    });

    it('should return very strong for highly complex password', () => {
      const strength = passwordService.getPasswordStrength('V3ry$tr0ng&P@ssw0rd!123');
      expect(strength).toBe('very-strong');
    });
  });
});
