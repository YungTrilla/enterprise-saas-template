/**
 * Auth Core Service Unit Tests
 */

import { AuthCoreService } from '../auth-core.service';
import { JwtService } from '../jwt.service';
import { PasswordService } from '../password.service';
import { SessionService } from '../session.service';
import { RbacService } from '../rbac.service';
import { AuditService } from '../audit.service';
import { AuthRepository } from '../../database/repository';
import {
  createMockAuthConfig,
  createMockUser,
  createMockLoginRequest,
  createMockSession,
  createCorrelationId,
} from '../../__tests__/utils/test-helpers';
import { IUser } from '../../types/auth';

describe('AuthCoreService', () => {
  let authCoreService: AuthCoreService;
  let mockConfig: ReturnType<typeof createMockAuthConfig>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockSessionService: jest.Mocked<SessionService>;
  let mockRbacService: jest.Mocked<RbacService>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockAuthRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    mockConfig = createMockAuthConfig();

    // Create mocked services
    mockJwtService = {
      generateTokenPair: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      extractTokenFromHeader: jest.fn(),
    } as any;

    mockPasswordService = {
      verifyPassword: jest.fn(),
    } as any;

    mockSessionService = {
      createSession: jest.fn(),
      revokeSession: jest.fn(),
      revokeAllUserSessions: jest.fn(),
      getActiveSession: jest.fn(),
      updateSessionActivity: jest.fn(),
    } as any;

    mockRbacService = {
      getUserRoles: jest.fn(),
      getUserPermissions: jest.fn(),
    } as any;

    mockAuditService = {
      logAuthEvent: jest.fn(),
      logSecurityEvent: jest.fn(),
    } as any;

    mockAuthRepository = {
      getUserByEmail: jest.fn(),
      getUserById: jest.fn(),
      updateUser: jest.fn(),
      createUserSession: jest.fn(),
      getUserSessionByToken: jest.fn(),
      updateUserSession: jest.fn(),
    } as any;

    authCoreService = new AuthCoreService(
      mockConfig,
      mockJwtService,
      mockPasswordService,
      mockSessionService,
      mockRbacService,
      mockAuditService,
      mockAuthRepository
    );
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginRequest = createMockLoginRequest();
      const user = createMockUser();
      const correlationId = createCorrelationId();
      const mockTokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer' as const,
        sessionId: 'session-123',
      };

      mockAuthRepository.getUserByEmail.mockResolvedValue(user);
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockRbacService.getUserRoles.mockResolvedValue(['user']);
      mockRbacService.getUserPermissions.mockResolvedValue(['users:read']);
      mockJwtService.generateTokenPair.mockReturnValue(mockTokenPair);
      mockSessionService.createSession.mockResolvedValue(createMockSession());

      const result = await authCoreService.login(
        loginRequest,
        '127.0.0.1',
        'test-agent',
        correlationId
      );

      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe(user.email);
      expect(result.tokens).toEqual(mockTokenPair);
      expect(result.requiresMfa).toBe(false);

      expect(mockAuthRepository.getUserByEmail).toHaveBeenCalledWith(
        loginRequest.email.toLowerCase(),
        correlationId
      );
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
        loginRequest.password,
        user.passwordHash,
        correlationId
      );
      expect(mockAuditService.logAuthEvent).toHaveBeenCalledWith(
        user.id,
        'LOGIN_SUCCESS',
        'authentication',
        expect.any(Object),
        '127.0.0.1',
        'test-agent',
        true,
        correlationId
      );
    });

    it('should reject login with invalid email', async () => {
      const loginRequest = createMockLoginRequest();
      const correlationId = createCorrelationId();

      mockAuthRepository.getUserByEmail.mockResolvedValue(null);

      await expect(
        authCoreService.login(loginRequest, '127.0.0.1', 'test-agent', correlationId)
      ).rejects.toThrow('Invalid email or password');

      expect(mockAuditService.logAuthEvent).toHaveBeenCalledWith(
        undefined,
        'LOGIN_FAILURE',
        'authentication',
        expect.any(Object),
        '127.0.0.1',
        'test-agent',
        false,
        correlationId
      );
    });

    it('should reject login with invalid password', async () => {
      const loginRequest = createMockLoginRequest();
      const user = createMockUser();
      const correlationId = createCorrelationId();

      mockAuthRepository.getUserByEmail.mockResolvedValue(user);
      mockPasswordService.verifyPassword.mockResolvedValue(false);

      await expect(
        authCoreService.login(loginRequest, '127.0.0.1', 'test-agent', correlationId)
      ).rejects.toThrow('Invalid email or password');

      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(
        user.id,
        { failedLoginAttempts: user.failedLoginAttempts + 1 },
        correlationId
      );
    });

    it('should handle account lockout after max failed attempts', async () => {
      const loginRequest = createMockLoginRequest();
      const user = createMockUser({
        failedLoginAttempts: 4, // One more attempt will trigger lockout
      });
      const correlationId = createCorrelationId();

      mockAuthRepository.getUserByEmail.mockResolvedValue(user);
      mockPasswordService.verifyPassword.mockResolvedValue(false);

      await expect(
        authCoreService.login(loginRequest, '127.0.0.1', 'test-agent', correlationId)
      ).rejects.toThrow('Invalid email or password');

      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          failedLoginAttempts: 5,
          lockoutUntil: expect.any(String),
        }),
        correlationId
      );

      expect(mockAuditService.logSecurityEvent).toHaveBeenCalledWith(
        user.id,
        'ACCOUNT_LOCKOUT',
        'HIGH',
        'Account locked after 5 failed login attempts',
        expect.any(Object),
        correlationId
      );
    });

    it('should reject login for locked account', async () => {
      const loginRequest = createMockLoginRequest();
      const user = createMockUser({
        lockoutUntil: new Date(Date.now() + 60000).toISOString(), // Locked for 1 minute
      });
      const correlationId = createCorrelationId();

      mockAuthRepository.getUserByEmail.mockResolvedValue(user);

      await expect(
        authCoreService.login(loginRequest, '127.0.0.1', 'test-agent', correlationId)
      ).rejects.toThrow('Account is locked. Please try again later.');
    });

    it('should require MFA when enabled', async () => {
      const loginRequest = createMockLoginRequest();
      const user = createMockUser({ mfaEnabled: true });
      const correlationId = createCorrelationId();

      mockAuthRepository.getUserByEmail.mockResolvedValue(user);
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockRbacService.getUserRoles.mockResolvedValue(['user']);
      mockRbacService.getUserPermissions.mockResolvedValue(['users:read']);

      const result = await authCoreService.login(
        loginRequest,
        '127.0.0.1',
        'test-agent',
        correlationId
      );

      expect(result.requiresMfa).toBe(true);
      expect(result.tokens.accessToken).toBeFalsy(); // No tokens until MFA verified
    });

    it('should reset failed login attempts on successful login', async () => {
      const loginRequest = createMockLoginRequest();
      const user = createMockUser({ failedLoginAttempts: 3 });
      const correlationId = createCorrelationId();

      mockAuthRepository.getUserByEmail.mockResolvedValue(user);
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockRbacService.getUserRoles.mockResolvedValue(['user']);
      mockRbacService.getUserPermissions.mockResolvedValue(['users:read']);
      mockJwtService.generateTokenPair.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 900,
        tokenType: 'Bearer',
        sessionId: 'session-123',
      });

      await authCoreService.login(loginRequest, '127.0.0.1', 'test-agent', correlationId);

      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          failedLoginAttempts: 0,
          lastLoginAt: expect.any(String),
        }),
        correlationId
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = 'user-123';
      const sessionId = 'session-123';
      const correlationId = createCorrelationId();

      await authCoreService.logout(userId, sessionId, correlationId);

      expect(mockSessionService.revokeSession).toHaveBeenCalledWith(
        sessionId,
        userId,
        'User logout',
        correlationId
      );
      expect(mockAuditService.logAuthEvent).toHaveBeenCalledWith(
        userId,
        'LOGOUT',
        'authentication',
        { sessionId },
        '',
        '',
        true,
        correlationId
      );
    });

    it('should handle logout errors gracefully', async () => {
      const userId = 'user-123';
      const sessionId = 'session-123';
      const correlationId = createCorrelationId();

      mockSessionService.revokeSession.mockRejectedValue(new Error('Session error'));

      await expect(
        authCoreService.logout(userId, sessionId, correlationId)
      ).rejects.toThrow('Session error');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'refresh-token';
      const correlationId = createCorrelationId();
      const user = createMockUser();
      const session = createMockSession({ userId: user.id });
      const newTokenPair = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer' as const,
        sessionId: session.id,
      };

      mockJwtService.verifyRefreshToken.mockReturnValue({
        sub: user.id,
        sessionId: session.id,
        tokenVersion: 1,
      } as any);
      mockSessionService.getActiveSession.mockResolvedValue(session);
      mockAuthRepository.getUserById.mockResolvedValue(user);
      mockRbacService.getUserRoles.mockResolvedValue(['user']);
      mockRbacService.getUserPermissions.mockResolvedValue(['users:read']);
      mockJwtService.generateTokenPair.mockReturnValue(newTokenPair);
      mockSessionService.updateSessionActivity.mockResolvedValue(undefined);

      const result = await authCoreService.refreshToken(refreshToken, correlationId);

      expect(result).toEqual(newTokenPair);
      expect(mockAuditService.logAuthEvent).toHaveBeenCalledWith(
        user.id,
        'TOKEN_REFRESH',
        'authentication',
        { sessionId: session.id },
        '',
        '',
        true,
        correlationId
      );
    });

    it('should reject invalid refresh token', async () => {
      const correlationId = createCorrelationId();

      mockJwtService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authCoreService.refreshToken('invalid-token', correlationId)
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should reject refresh for inactive session', async () => {
      const refreshToken = 'refresh-token';
      const correlationId = createCorrelationId();

      mockJwtService.verifyRefreshToken.mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-123',
        tokenVersion: 1,
      } as any);
      mockSessionService.getActiveSession.mockResolvedValue(null);

      await expect(
        authCoreService.refreshToken(refreshToken, correlationId)
      ).rejects.toThrow('Session not found or inactive');
    });
  });
});