/**
 * JWT Service
 * Secure token generation, validation, and management
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IAuthConfig, IJwtPayload, ITokenPair, IRefreshTokenPayload } from '../types/auth';
import { EntityId, CorrelationId } from '@template/shared-types';
import { CorrelatedLogger } from '../utils/logger';

export class JwtService {
  private config: IAuthConfig;
  private logger: CorrelatedLogger;

  constructor(config: IAuthConfig) {
    this.config = config;
    this.logger = new CorrelatedLogger('jwt-service');
  }

  /**
   * Generate access and refresh token pair
   */
  generateTokenPair(
    userId: EntityId,
    email: string,
    roles: string[],
    permissions: string[],
    sessionId: EntityId,
    correlationId: CorrelationId
  ): ITokenPair {
    this.logger.setCorrelationId(correlationId);

    try {
      // Generate access token
      const accessTokenPayload: IJwtPayload = {
        sub: userId,
        email,
        roles,
        permissions,
        sessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpirationTime(this.config.jwt.accessTokenExpiration),
        iss: this.config.jwt.issuer,
        aud: this.config.jwt.audience,
        correlationId
      };

      const accessToken = jwt.sign(accessTokenPayload, this.config.jwt.secret, {
        algorithm: 'HS256'
      });

      // Generate refresh token
      const refreshTokenPayload: IRefreshTokenPayload = {
        sub: userId,
        sessionId,
        tokenVersion: 1,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpirationTime(this.config.jwt.refreshTokenExpiration),
        iss: this.config.jwt.issuer,
        aud: this.config.jwt.audience
      };

      const refreshToken = jwt.sign(refreshTokenPayload, this.config.jwt.secret, {
        algorithm: 'HS256'
      });

      this.logger.info('Token pair generated successfully', {
        userId,
        sessionId,
        accessTokenExp: accessTokenPayload.exp,
        refreshTokenExp: refreshTokenPayload.exp
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: this.parseExpirationTime(this.config.jwt.accessTokenExpiration),
        tokenType: 'Bearer',
        sessionId
      };

    } catch (error) {
      this.logger.error('Failed to generate token pair', {
        userId,
        sessionId,
        error: (error as Error).message
      });
      throw new Error('Token generation failed');
    }
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string, correlationId: CorrelationId): IJwtPayload {
    this.logger.setCorrelationId(correlationId);

    try {
      const decoded = jwt.verify(token, this.config.jwt.secret, {
        algorithms: ['HS256'],
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      }) as IJwtPayload;

      this.logger.debug('Access token verified successfully', {
        userId: decoded.sub,
        sessionId: decoded.sessionId,
        exp: decoded.exp
      });

      return decoded;

    } catch (error) {
      const errorType = this.getJwtErrorType(error as Error);
      
      this.logger.warn('Access token verification failed', {
        error: (error as Error).message,
        errorType
      });

      throw new Error(`Token verification failed: ${errorType}`);
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string, correlationId: CorrelationId): IRefreshTokenPayload {
    this.logger.setCorrelationId(correlationId);

    try {
      const decoded = jwt.verify(token, this.config.jwt.secret, {
        algorithms: ['HS256'],
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      }) as IRefreshTokenPayload;

      this.logger.debug('Refresh token verified successfully', {
        userId: decoded.sub,
        sessionId: decoded.sessionId,
        tokenVersion: decoded.tokenVersion,
        exp: decoded.exp
      });

      return decoded;

    } catch (error) {
      const errorType = this.getJwtErrorType(error as Error);
      
      this.logger.warn('Refresh token verification failed', {
        error: (error as Error).message,
        errorType
      });

      throw new Error(`Refresh token verification failed: ${errorType}`);
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7); // Remove "Bearer " prefix
  }

  /**
   * Generate secure random token for password reset, email verification, etc.
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash token for secure storage
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verify hashed token
   */
  verifyHashedToken(token: string, hashedToken: string): boolean {
    const tokenHash = this.hashToken(token);
    return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hashedToken));
  }

  /**
   * Get token expiration time in seconds
   */
  getTokenExpirationTime(expirationString: string): number {
    return this.parseExpirationTime(expirationString);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(exp: number): boolean {
    return Math.floor(Date.now() / 1000) >= exp;
  }

  /**
   * Get remaining token validity time in seconds
   */
  getRemainingTokenTime(exp: number): number {
    const remaining = exp - Math.floor(Date.now() / 1000);
    return Math.max(0, remaining);
  }

  /**
   * Parse expiration time string to seconds
   */
  private parseExpirationTime(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiration format: ${expiration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: throw new Error(`Invalid time unit: ${unit}`);
    }
  }

  /**
   * Get JWT error type for better error handling
   */
  private getJwtErrorType(error: Error): string {
    if (error.name === 'TokenExpiredError') return 'EXPIRED';
    if (error.name === 'JsonWebTokenError') return 'INVALID';
    if (error.name === 'NotBeforeError') return 'NOT_ACTIVE';
    return 'UNKNOWN';
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeTokenUnsafe(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      this.logger.warn('Failed to decode token', {
        error: (error as Error).message
      });
      return null;
    }
  }
}