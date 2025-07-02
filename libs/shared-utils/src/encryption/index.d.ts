/**
 * Hash password using bcrypt with configurable cost factor
 * Default cost factor is 12 for strong security
 */
export declare function hashPassword(password: string, costFactor?: number): Promise<string>;
/**
 * Verify password against hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Check if password hash needs rehashing (cost factor changed)
 */
export declare function needsRehash(hash: string, costFactor?: number): boolean;
/**
 * Encrypt sensitive data using AES-256-GCM
 */
export declare function encryptData(data: string, secretKey: string): string;
/**
 * Decrypt sensitive data using AES-256-GCM
 */
export declare function decryptData(encryptedData: string, secretKey: string): string;
/**
 * Encrypt object to JSON string
 */
export declare function encryptObject<T>(obj: T, secretKey: string): string;
/**
 * Decrypt JSON string to object
 */
export declare function decryptObject<T>(encryptedData: string, secretKey: string): T;
/**
 * Generate cryptographically secure random token
 */
export declare function generateSecureToken(length?: number): string;
/**
 * Generate secure API key
 */
export declare function generateApiKey(prefix?: string): string;
/**
 * Generate secure session ID
 */
export declare function generateSessionId(): string;
/**
 * Generate secure correlation ID for request tracking
 */
export declare function generateCorrelationId(): string;
/**
 * Generate secure reset token with expiration
 */
export declare function generateResetToken(): {
    token: string;
    hash: string;
    expiresAt: Date;
};
/**
 * Verify reset token against hash
 */
export declare function verifyResetToken(token: string, hash: string): boolean;
/**
 * Generate secure JWT secret
 */
export declare function generateJwtSecret(): string;
/**
 * Create token payload with standard claims
 */
export declare function createTokenPayload(userId: string, email: string, roles?: string[]): {
    sub: string;
    email: string;
    roles: string[];
    iat: number;
    jti: string;
};
/**
 * Mask sensitive data for logging
 */
export declare function maskSensitiveData(data: any): any;
/**
 * Mask email for display (show first 2 chars and domain)
 */
export declare function maskEmail(email: string): string;
/**
 * Mask credit card number for display
 */
export declare function maskCreditCard(cardNumber: string): string;
/**
 * Create SHA-256 hash of data
 */
export declare function createSha256Hash(data: string): string;
/**
 * Create HMAC signature
 */
export declare function createHmacSignature(data: string, secret: string): string;
/**
 * Verify HMAC signature
 */
export declare function verifyHmacSignature(data: string, signature: string, secret: string): boolean;
/**
 * Generate deterministic ID from data (for deduplication)
 */
export declare function generateDataHash(data: any): string;
/**
 * Generate secure random integer within range
 */
export declare function secureRandomInt(min: number, max: number): number;
/**
 * Generate secure random string with custom charset
 */
export declare function secureRandomString(length: number, charset?: string): string;
/**
 * Generate secure OTP (One-Time Password)
 */
export declare function generateOtp(length?: number): string;
//# sourceMappingURL=index.d.ts.map