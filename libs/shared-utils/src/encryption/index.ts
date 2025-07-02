import bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// ========================================
// Password Hashing (bcrypt)
// ========================================

/**
 * Hash password using bcrypt with configurable cost factor
 * Default cost factor is 12 for strong security
 */
export async function hashPassword(password: string, costFactor: number = 12): Promise<string> {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password must be a non-empty string');
  }
  
  if (costFactor < 10 || costFactor > 15) {
    throw new Error('Cost factor must be between 10 and 15');
  }
  
  return bcrypt.hash(password, costFactor);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (typeof password !== 'string' || typeof hash !== 'string') {
    return false;
  }
  
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Check if password hash needs rehashing (cost factor changed)
 */
export function needsRehash(hash: string, costFactor: number = 12): boolean {
  try {
    return bcrypt.getRounds(hash) !== costFactor;
  } catch (error) {
    return true; // If we can't get rounds, assume it needs rehashing
  }
}

// ========================================
// AES Encryption for sensitive data
// ========================================

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encryptData(data: string, secretKey: string): string {
  if (!data || !secretKey) {
    throw new Error('Data and secret key are required');
  }
  
  try {
    const encrypted = CryptoJS.AES.encrypt(data, secretKey);
    return encrypted.toString();
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export function decryptData(encryptedData: string, secretKey: string): string {
  if (!encryptedData || !secretKey) {
    throw new Error('Encrypted data and secret key are required');
  }
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    return decryptedString;
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

/**
 * Encrypt object to JSON string
 */
export function encryptObject<T>(obj: T, secretKey: string): string {
  const jsonString = JSON.stringify(obj);
  return encryptData(jsonString, secretKey);
}

/**
 * Decrypt JSON string to object
 */
export function decryptObject<T>(encryptedData: string, secretKey: string): T {
  const decryptedString = decryptData(encryptedData, secretKey);
  return JSON.parse(decryptedString) as T;
}

// ========================================
// Secure Token Generation
// ========================================

/**
 * Generate cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  if (length < 8 || length > 128) {
    throw new Error('Token length must be between 8 and 128 characters');
  }
  
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate secure API key
 */
export function generateApiKey(prefix: string = 'ak'): string {
  const timestamp = Date.now().toString(36);
  const randomPart = generateSecureToken(16);
  return `${prefix}_${timestamp}_${randomPart}`;
}

/**
 * Generate secure session ID
 */
export function generateSessionId(): string {
  return uuidv4().replace(/-/g, '') + generateSecureToken(8);
}

/**
 * Generate secure correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(6).toString('hex');
  return `abyss_${timestamp}_${random}`;
}

/**
 * Generate secure reset token with expiration
 */
export function generateResetToken(): {
  token: string;
  hash: string;
  expiresAt: Date;
} {
  const token = generateSecureToken(24);
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  return { token, hash, expiresAt };
}

/**
 * Verify reset token against hash
 */
export function verifyResetToken(token: string, hash: string): boolean {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(tokenHash, 'hex'));
  } catch (error) {
    return false;
  }
}

// ========================================
// JWT Token Utilities
// ========================================

/**
 * Generate secure JWT secret
 */
export function generateJwtSecret(): string {
  return generateSecureToken(64);
}

/**
 * Create token payload with standard claims
 */
export function createTokenPayload(userId: string, email: string, roles: string[] = []): {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  jti: string;
} {
  return {
    sub: userId,
    email,
    roles,
    iat: Math.floor(Date.now() / 1000),
    jti: uuidv4(),
  };
}

// ========================================
// Data Masking for Logging
// ========================================

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'authorization',
    'credit_card',
    'creditCard',
    'ssn',
    'social_security'
  ];
  
  const masked = { ...data };
  
  Object.keys(masked).forEach(key => {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
    
    if (isSensitive) {
      if (typeof masked[key] === 'string') {
        masked[key] = '*'.repeat(masked[key].length);
      } else {
        masked[key] = '[MASKED]';
      }
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  });
  
  return masked;
}

/**
 * Mask email for display (show first 2 chars and domain)
 */
export function maskEmail(email: string): string {
  if (typeof email !== 'string' || !email.includes('@')) {
    return '[INVALID EMAIL]';
  }
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart}***@${domain}`;
  }
  
  return `${localPart.substring(0, 2)}***@${domain}`;
}

/**
 * Mask credit card number for display
 */
export function maskCreditCard(cardNumber: string): string {
  if (typeof cardNumber !== 'string') {
    return '[INVALID CARD]';
  }
  
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) {
    return '*'.repeat(cleaned.length);
  }
  
  const lastFour = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4);
  return masked + lastFour;
}

// ========================================
// Cryptographic Hashing
// ========================================

/**
 * Create SHA-256 hash of data
 */
export function createSha256Hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create HMAC signature
 */
export function createHmacSignature(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHmacSignature(data: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = createHmacSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Generate deterministic ID from data (for deduplication)
 */
export function generateDataHash(data: any): string {
  const normalizedData = JSON.stringify(data, Object.keys(data).sort());
  return createSha256Hash(normalizedData);
}

// ========================================
// Secure Random Utilities
// ========================================

/**
 * Generate secure random integer within range
 */
export function secureRandomInt(min: number, max: number): number {
  if (min >= max) {
    throw new Error('Min must be less than max');
  }
  
  const range = max - min;
  const bitsNeeded = Math.ceil(Math.log2(range));
  const bytesNeeded = Math.ceil(bitsNeeded / 8);
  const maxValue = Math.pow(2, bitsNeeded);
  
  let randomValue;
  do {
    const randomBytes = crypto.randomBytes(bytesNeeded);
    randomValue = randomBytes.readUIntBE(0, bytesNeeded) & (maxValue - 1);
  } while (randomValue >= range);
  
  return min + randomValue;
}

/**
 * Generate secure random string with custom charset
 */
export function secureRandomString(length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  if (length <= 0) {
    throw new Error('Length must be positive');
  }
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[secureRandomInt(0, charset.length)];
  }
  
  return result;
}

/**
 * Generate secure OTP (One-Time Password)
 */
export function generateOtp(length: number = 6): string {
  return secureRandomString(length, '0123456789');
}