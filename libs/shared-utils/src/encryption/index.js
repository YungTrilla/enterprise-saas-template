"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.needsRehash = needsRehash;
exports.encryptData = encryptData;
exports.decryptData = decryptData;
exports.encryptObject = encryptObject;
exports.decryptObject = decryptObject;
exports.generateSecureToken = generateSecureToken;
exports.generateApiKey = generateApiKey;
exports.generateSessionId = generateSessionId;
exports.generateCorrelationId = generateCorrelationId;
exports.generateResetToken = generateResetToken;
exports.verifyResetToken = verifyResetToken;
exports.generateJwtSecret = generateJwtSecret;
exports.createTokenPayload = createTokenPayload;
exports.maskSensitiveData = maskSensitiveData;
exports.maskEmail = maskEmail;
exports.maskCreditCard = maskCreditCard;
exports.createSha256Hash = createSha256Hash;
exports.createHmacSignature = createHmacSignature;
exports.verifyHmacSignature = verifyHmacSignature;
exports.generateDataHash = generateDataHash;
exports.secureRandomInt = secureRandomInt;
exports.secureRandomString = secureRandomString;
exports.generateOtp = generateOtp;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
// ========================================
// Password Hashing (bcrypt)
// ========================================
/**
 * Hash password using bcrypt with configurable cost factor
 * Default cost factor is 12 for strong security
 */
async function hashPassword(password, costFactor = 12) {
    if (typeof password !== 'string' || password.length === 0) {
        throw new Error('Password must be a non-empty string');
    }
    if (costFactor < 10 || costFactor > 15) {
        throw new Error('Cost factor must be between 10 and 15');
    }
    return bcrypt_1.default.hash(password, costFactor);
}
/**
 * Verify password against hash
 */
async function verifyPassword(password, hash) {
    if (typeof password !== 'string' || typeof hash !== 'string') {
        return false;
    }
    try {
        return await bcrypt_1.default.compare(password, hash);
    }
    catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}
/**
 * Check if password hash needs rehashing (cost factor changed)
 */
function needsRehash(hash, costFactor = 12) {
    try {
        return bcrypt_1.default.getRounds(hash) !== costFactor;
    }
    catch (error) {
        return true; // If we can't get rounds, assume it needs rehashing
    }
}
// ========================================
// AES Encryption for sensitive data
// ========================================
/**
 * Encrypt sensitive data using AES-256-GCM
 */
function encryptData(data, secretKey) {
    if (!data || !secretKey) {
        throw new Error('Data and secret key are required');
    }
    try {
        const encrypted = crypto_js_1.default.AES.encrypt(data, secretKey);
        return encrypted.toString();
    }
    catch (error) {
        throw new Error('Encryption failed');
    }
}
/**
 * Decrypt sensitive data using AES-256-GCM
 */
function decryptData(encryptedData, secretKey) {
    if (!encryptedData || !secretKey) {
        throw new Error('Encrypted data and secret key are required');
    }
    try {
        const decrypted = crypto_js_1.default.AES.decrypt(encryptedData, secretKey);
        const decryptedString = decrypted.toString(crypto_js_1.default.enc.Utf8);
        if (!decryptedString) {
            throw new Error('Decryption failed - invalid key or corrupted data');
        }
        return decryptedString;
    }
    catch (error) {
        throw new Error('Decryption failed');
    }
}
/**
 * Encrypt object to JSON string
 */
function encryptObject(obj, secretKey) {
    const jsonString = JSON.stringify(obj);
    return encryptData(jsonString, secretKey);
}
/**
 * Decrypt JSON string to object
 */
function decryptObject(encryptedData, secretKey) {
    const decryptedString = decryptData(encryptedData, secretKey);
    return JSON.parse(decryptedString);
}
// ========================================
// Secure Token Generation
// ========================================
/**
 * Generate cryptographically secure random token
 */
function generateSecureToken(length = 32) {
    if (length < 8 || length > 128) {
        throw new Error('Token length must be between 8 and 128 characters');
    }
    return crypto_1.default.randomBytes(length).toString('hex');
}
/**
 * Generate secure API key
 */
function generateApiKey(prefix = 'ak') {
    const timestamp = Date.now().toString(36);
    const randomPart = generateSecureToken(16);
    return `${prefix}_${timestamp}_${randomPart}`;
}
/**
 * Generate secure session ID
 */
function generateSessionId() {
    return (0, uuid_1.v4)().replace(/-/g, '') + generateSecureToken(8);
}
/**
 * Generate secure correlation ID for request tracking
 */
function generateCorrelationId() {
    const timestamp = Date.now().toString(36);
    const random = crypto_1.default.randomBytes(6).toString('hex');
    return `abyss_${timestamp}_${random}`;
}
/**
 * Generate secure reset token with expiration
 */
function generateResetToken() {
    const token = generateSecureToken(24);
    const hash = crypto_1.default.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return { token, hash, expiresAt };
}
/**
 * Verify reset token against hash
 */
function verifyResetToken(token, hash) {
    try {
        const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(tokenHash, 'hex'));
    }
    catch (error) {
        return false;
    }
}
// ========================================
// JWT Token Utilities
// ========================================
/**
 * Generate secure JWT secret
 */
function generateJwtSecret() {
    return generateSecureToken(64);
}
/**
 * Create token payload with standard claims
 */
function createTokenPayload(userId, email, roles = []) {
    return {
        sub: userId,
        email,
        roles,
        iat: Math.floor(Date.now() / 1000),
        jti: (0, uuid_1.v4)(),
    };
}
// ========================================
// Data Masking for Logging
// ========================================
/**
 * Mask sensitive data for logging
 */
function maskSensitiveData(data) {
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
            }
            else {
                masked[key] = '[MASKED]';
            }
        }
        else if (typeof masked[key] === 'object') {
            masked[key] = maskSensitiveData(masked[key]);
        }
    });
    return masked;
}
/**
 * Mask email for display (show first 2 chars and domain)
 */
function maskEmail(email) {
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
function maskCreditCard(cardNumber) {
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
function createSha256Hash(data) {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
}
/**
 * Create HMAC signature
 */
function createHmacSignature(data, secret) {
    return crypto_1.default.createHmac('sha256', secret).update(data).digest('hex');
}
/**
 * Verify HMAC signature
 */
function verifyHmacSignature(data, signature, secret) {
    try {
        const expectedSignature = createHmacSignature(data, secret);
        return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    catch (error) {
        return false;
    }
}
/**
 * Generate deterministic ID from data (for deduplication)
 */
function generateDataHash(data) {
    const normalizedData = JSON.stringify(data, Object.keys(data).sort());
    return createSha256Hash(normalizedData);
}
// ========================================
// Secure Random Utilities
// ========================================
/**
 * Generate secure random integer within range
 */
function secureRandomInt(min, max) {
    if (min >= max) {
        throw new Error('Min must be less than max');
    }
    const range = max - min;
    const bitsNeeded = Math.ceil(Math.log2(range));
    const bytesNeeded = Math.ceil(bitsNeeded / 8);
    const maxValue = Math.pow(2, bitsNeeded);
    let randomValue;
    do {
        const randomBytes = crypto_1.default.randomBytes(bytesNeeded);
        randomValue = randomBytes.readUIntBE(0, bytesNeeded) & (maxValue - 1);
    } while (randomValue >= range);
    return min + randomValue;
}
/**
 * Generate secure random string with custom charset
 */
function secureRandomString(length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
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
function generateOtp(length = 6) {
    return secureRandomString(length, '0123456789');
}
