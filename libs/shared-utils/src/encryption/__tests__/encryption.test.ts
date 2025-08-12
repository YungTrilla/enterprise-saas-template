import {
  hashPassword,
  verifyPassword,
  needsRehash,
  encryptData,
  decryptData,
  encryptObject,
  decryptObject,
  generateSecureToken,
  generateApiKey,
  generateSessionId,
  generateCorrelationId,
  generateResetToken,
  verifyResetToken,
  generateJwtSecret,
  createTokenPayload,
  maskSensitiveData,
  maskEmail,
  maskCreditCard,
  createSha256Hash,
  createHmacSignature,
  verifyHmacSignature,
  generateDataHash,
} from '../index';

describe('Encryption Utils', () => {
  describe('Password Hashing', () => {
    it('should hash password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should throw error for invalid password input', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password must be a non-empty string');
      await expect(hashPassword(null as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should throw error for invalid cost factor', async () => {
      await expect(hashPassword('password', 5)).rejects.toThrow(
        'Cost factor must be between 10 and 15'
      );
      await expect(hashPassword('password', 20)).rejects.toThrow(
        'Cost factor must be between 10 and 15'
      );
    });

    it('should detect when password needs rehashing', () => {
      // This would need a pre-generated hash with different cost factor
      const oldHash = '$2b$10$...'; // Example hash with cost factor 10
      expect(needsRehash(oldHash, 12)).toBe(true);
    });
  });

  describe('AES Encryption', () => {
    const secretKey = 'test-secret-key-123';
    const testData = 'This is sensitive data';

    it('should encrypt and decrypt data successfully', () => {
      const encrypted = encryptData(testData, secretKey);
      const decrypted = decryptData(encrypted, secretKey);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(testData);
      expect(decrypted).toBe(testData);
    });

    it('should throw error when decrypting with wrong key', () => {
      const encrypted = encryptData(testData, secretKey);

      expect(() => decryptData(encrypted, 'wrong-key')).toThrow('Decryption failed');
    });

    it('should encrypt and decrypt objects', () => {
      const testObject = {
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
        data: { nested: true },
      };

      const encrypted = encryptObject(testObject, secretKey);
      const decrypted = decryptObject(encrypted, secretKey);

      expect(decrypted).toEqual(testObject);
    });

    it('should throw error for missing data or key', () => {
      expect(() => encryptData('', secretKey)).toThrow('Data and secret key are required');
      expect(() => encryptData(testData, '')).toThrow('Data and secret key are required');
      expect(() => decryptData('', secretKey)).toThrow(
        'Encrypted data and secret key are required'
      );
    });
  });

  describe('Token Generation', () => {
    it('should generate secure token of correct length', () => {
      const token16 = generateSecureToken(16);
      const token32 = generateSecureToken(32);

      expect(token16).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(token32).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }

      expect(tokens.size).toBe(100);
    });

    it('should throw error for invalid token length', () => {
      expect(() => generateSecureToken(4)).toThrow(
        'Token length must be between 8 and 128 characters'
      );
      expect(() => generateSecureToken(200)).toThrow(
        'Token length must be between 8 and 128 characters'
      );
    });

    it('should generate API key with correct format', () => {
      const apiKey = generateApiKey();
      expect(apiKey).toMatch(/^ak_[a-z0-9]+_[a-f0-9]{32}$/);

      const customApiKey = generateApiKey('custom');
      expect(customApiKey).toMatch(/^custom_[a-z0-9]+_[a-f0-9]{32}$/);
    });

    it('should generate session ID with correct format', () => {
      const sessionId = generateSessionId();
      expect(sessionId).toHaveLength(48); // 32 chars (uuid without dashes) + 16 chars (8 bytes hex)
      expect(sessionId).toMatch(/^[a-f0-9]{48}$/);
    });

    it('should generate correlation ID with correct format', () => {
      const correlationId = generateCorrelationId();
      expect(correlationId).toMatch(/^abyss_[a-z0-9]+_[a-f0-9]{12}$/);
    });

    it('should generate reset token with hash and expiration', () => {
      const { token, hash, expiresAt } = generateResetToken();

      expect(token).toHaveLength(48);
      expect(hash).toHaveLength(64); // SHA-256 hash
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 60 * 60 * 1000);
    });

    it('should verify reset token correctly', () => {
      const { token, hash } = generateResetToken();

      expect(verifyResetToken(token, hash)).toBe(true);
      expect(verifyResetToken('wrong-token', hash)).toBe(false);
    });
  });

  describe('JWT Utilities', () => {
    it('should generate JWT secret of correct length', () => {
      const secret = generateJwtSecret();
      expect(secret).toHaveLength(128); // 64 bytes = 128 hex chars
    });

    it('should create token payload with standard claims', () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const roles = ['user', 'admin'];

      const payload = createTokenPayload(userId, email, roles);

      expect(payload.sub).toBe(userId);
      expect(payload.email).toBe(email);
      expect(payload.roles).toEqual(roles);
      expect(payload.iat).toBeDefined();
      expect(payload.jti).toBeDefined();
      expect(payload.jti).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });
  });

  describe('Data Masking', () => {
    it('should mask sensitive fields in objects', () => {
      const data = {
        username: 'johndoe',
        password: 'secret123',
        email: 'john@example.com',
        token: 'abc123xyz',
        credit_card: '1234567890123456',
        key: 'sk_test_123',
        regular: 'normal data',
      };

      const masked = maskSensitiveData(data);

      expect(masked.username).toBe('johndoe');
      expect(masked.password).toBe('*********');
      expect(masked.email).toBe('john@example.com');
      expect(masked.token).toBe('*********');
      expect(masked.credit_card).toBe('****************');
      expect(masked.key).toBe('***********');
      expect(masked.regular).toBe('normal data');
    });

    it('should mask nested sensitive data', () => {
      const data = {
        user: {
          name: 'John',
          auth: {
            password: 'secret',
            token: 'xyz123',
          },
        },
      };

      const masked = maskSensitiveData(data);

      expect(masked.user.name).toBe('John');
      expect(masked.user.auth).toBe('[MASKED]');
    });

    it('should mask email correctly', () => {
      expect(maskEmail('john@example.com')).toBe('jo***@example.com');
      expect(maskEmail('j@example.com')).toBe('j***@example.com');
      expect(maskEmail('ab@example.com')).toBe('ab***@example.com');
      expect(maskEmail('invalid-email')).toBe('[INVALID EMAIL]');
    });

    it('should mask credit card correctly', () => {
      expect(maskCreditCard('1234567890123456')).toBe('************3456');
      expect(maskCreditCard('1234 5678 9012 3456')).toBe('************3456');
      expect(maskCreditCard('123')).toBe('***');
      expect(maskCreditCard('invalid')).toBe('');
    });
  });

  describe('Cryptographic Hashing', () => {
    it('should create SHA-256 hash', () => {
      const data = 'test data';
      const hash = createSha256Hash(data);

      expect(hash).toHaveLength(64);
      expect(hash).toBe('916f0027a575074ce72a331777c3478d6513f786a591bd892da1a577bf2335f9');
    });

    it('should create HMAC signature', () => {
      const data = 'test data';
      const key = 'secret key';
      const hmac = createHmacSignature(data, key);

      expect(hmac).toHaveLength(64);
      expect(hmac).toBe('d51c4289e6eea49db00925bb7a948d31309550040f88bc4aba39bb3107c071be');
    });

    it('should verify HMAC signature correctly', () => {
      const data = 'test data';
      const key = 'secret key';
      const signature = createHmacSignature(data, key);

      expect(verifyHmacSignature(data, signature, key)).toBe(true);
      expect(verifyHmacSignature(data, 'wrong-signature', key)).toBe(false);
      expect(verifyHmacSignature('wrong-data', signature, key)).toBe(false);
    });

    it('should generate deterministic hash from data', () => {
      const data = { id: 123, name: 'test', values: [1, 2, 3] };
      const hash1 = generateDataHash(data);
      const hash2 = generateDataHash({ values: [1, 2, 3], name: 'test', id: 123 }); // Different order

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2); // Should be the same despite different property order
    });
  });

  // Remove logging utilities test as sanitizeForLog doesn't exist
});
