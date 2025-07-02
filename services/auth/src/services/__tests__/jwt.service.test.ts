/**
 * JWT Service Unit Tests
 */

import { JwtService } from '../jwt.service';
import { createMockAuthConfig, createMockUser, createMockSession, createCorrelationId } from '../../__tests__/utils/test-helpers';
import { EntityId } from '@abyss/shared-types';
import jwt from 'jsonwebtoken';

describe('JwtService', () => {
  let jwtService: JwtService;
  let mockConfig: ReturnType<typeof createMockAuthConfig>;

  beforeEach(() => {
    mockConfig = createMockAuthConfig();
    jwtService = new JwtService(mockConfig);
  });

  describe('generateTokenPair', () => {
    it('should generate valid access and refresh tokens', () => {
      const user = createMockUser();
      const sessionId = 'session-123' as EntityId;
      const correlationId = createCorrelationId();

      const tokenPair = jwtService.generateTokenPair(
        user,
        ['user'],
        ['users:read'],
        sessionId,
        correlationId
      );

      expect(tokenPair).toHaveProperty('accessToken');
      expect(tokenPair).toHaveProperty('refreshToken');
      expect(tokenPair).toHaveProperty('expiresIn');
      expect(tokenPair).toHaveProperty('tokenType', 'Bearer');
      expect(tokenPair).toHaveProperty('sessionId', sessionId);

      // Verify access token
      const decodedAccess = jwt.verify(tokenPair.accessToken, mockConfig.jwt.secret) as any;
      expect(decodedAccess.sub).toBe(user.id);
      expect(decodedAccess.email).toBe(user.email);
      expect(decodedAccess.roles).toEqual(['user']);
      expect(decodedAccess.permissions).toEqual(['users:read']);
      expect(decodedAccess.sessionId).toBe(sessionId);
      expect(decodedAccess.correlationId).toBe(correlationId);

      // Verify refresh token
      const decodedRefresh = jwt.verify(tokenPair.refreshToken, mockConfig.jwt.secret) as any;
      expect(decodedRefresh.sub).toBe(user.id);
      expect(decodedRefresh.sessionId).toBe(sessionId);
    });

    it('should handle empty roles and permissions', () => {
      const user = createMockUser();
      const sessionId = 'session-123' as EntityId;
      const correlationId = createCorrelationId();

      const tokenPair = jwtService.generateTokenPair(
        user,
        [],
        [],
        sessionId,
        correlationId
      );

      const decoded = jwt.verify(tokenPair.accessToken, mockConfig.jwt.secret) as any;
      expect(decoded.roles).toEqual([]);
      expect(decoded.permissions).toEqual([]);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const user = createMockUser();
      const sessionId = 'session-123' as EntityId;
      const correlationId = createCorrelationId();

      const tokenPair = jwtService.generateTokenPair(
        user,
        ['user'],
        ['users:read'],
        sessionId,
        correlationId
      );

      const payload = jwtService.verifyAccessToken(tokenPair.accessToken);

      expect(payload.sub).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.roles).toEqual(['user']);
      expect(payload.permissions).toEqual(['users:read']);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        jwtService.verifyAccessToken('invalid-token');
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { sub: 'user-123' },
        mockConfig.jwt.secret,
        { expiresIn: '-1s' }
      );

      expect(() => {
        jwtService.verifyAccessToken(expiredToken);
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const user = createMockUser();
      const sessionId = 'session-123' as EntityId;
      const correlationId = createCorrelationId();

      const tokenPair = jwtService.generateTokenPair(
        user,
        ['user'],
        ['users:read'],
        sessionId,
        correlationId
      );

      const payload = jwtService.verifyRefreshToken(tokenPair.refreshToken);

      expect(payload.sub).toBe(user.id);
      expect(payload.sessionId).toBe(sessionId);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        jwtService.verifyRefreshToken('invalid-token');
      }).toThrow();
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a secure random token', () => {
      const token1 = jwtService.generateSecureToken();
      const token2 = jwtService.generateSecureToken();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(40); // Base64 encoded 32 bytes
    });
  });

  describe('hashToken', () => {
    it('should hash a token consistently', () => {
      const token = 'test-token';
      const hash1 = jwtService.hashToken(token);
      const hash2 = jwtService.hashToken(token);

      expect(hash1).toBeTruthy();
      expect(hash2).toBeTruthy();
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = jwtService.hashToken('token1');
      const hash2 = jwtService.hashToken('token2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = jwtService.extractTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should return null for invalid header format', () => {
      expect(jwtService.extractTokenFromHeader('InvalidHeader')).toBeNull();
      expect(jwtService.extractTokenFromHeader('Basic auth')).toBeNull();
      expect(jwtService.extractTokenFromHeader('')).toBeNull();
      expect(jwtService.extractTokenFromHeader(undefined as any)).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const user = createMockUser();
      const sessionId = 'session-123' as EntityId;
      const correlationId = createCorrelationId();

      const tokenPair = jwtService.generateTokenPair(
        user,
        ['user'],
        ['users:read'],
        sessionId,
        correlationId
      );

      expect(jwtService.isTokenExpired(tokenPair.accessToken)).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiredToken = jwt.sign(
        { sub: 'user-123' },
        mockConfig.jwt.secret,
        { expiresIn: '-1s' }
      );

      expect(jwtService.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(jwtService.isTokenExpired('invalid-token')).toBe(true);
    });
  });
});