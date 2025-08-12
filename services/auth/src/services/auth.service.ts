/**
 * Authentication Service Facade
 * Orchestrates authentication operations across specialized services
 */

import { EntityId, CorrelationId } from '@template/shared-types';
import {
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IRegisterResponse,
  ITokenPair,
  IAuthContext,
  IChangePasswordRequest,
  IForgotPasswordRequest,
  IResetPasswordRequest,
  IMfaSetupResponse,
  IMfaVerifyRequest,
  IAuthConfig
} from '../types/auth';
import { JwtService } from './jwt.service';
import { PasswordService } from './password.service';
import { MfaService } from './mfa.service';
import { RbacService } from './rbac.service';
import { SessionService } from './session.service';
import { AuditService } from './audit.service';
import { AuthCoreService } from './auth-core.service';
import { AuthMfaService } from './auth-mfa.service';
import { AuthAccountService } from './auth-account.service';
import { AuthRepository } from '../database/repository';

export class AuthService {
  private authCoreService: AuthCoreService;
  private authMfaService: AuthMfaService;
  private authAccountService: AuthAccountService;

  constructor(
    config: IAuthConfig,
    jwtService: JwtService,
    passwordService: PasswordService,
    mfaService: MfaService,
    rbacService: RbacService,
    sessionService: SessionService,
    auditService: AuditService
  ) {
    const authRepository = new AuthRepository();

    // Initialize specialized services
    this.authCoreService = new AuthCoreService(
      config,
      jwtService,
      passwordService,
      mfaService,
      rbacService,
      sessionService,
      auditService,
      authRepository
    );

    this.authMfaService = new AuthMfaService(
      config,
      mfaService,
      auditService,
      authRepository
    );

    this.authAccountService = new AuthAccountService(
      config,
      jwtService,
      passwordService,
      rbacService,
      auditService,
      authRepository
    );
  }

  // Core authentication methods
  async login(
    loginRequest: ILoginRequest,
    ipAddress: string,
    userAgent: string,
    correlationId: CorrelationId
  ): Promise<ILoginResponse> {
    return this.authCoreService.login(loginRequest, ipAddress, userAgent, correlationId);
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress: string,
    correlationId: CorrelationId
  ): Promise<ITokenPair> {
    return this.authCoreService.refreshTokens(refreshToken, ipAddress, correlationId);
  }

  async logout(accessToken: string, correlationId: CorrelationId): Promise<void> {
    return this.authCoreService.logout(accessToken, correlationId);
  }

  async getAuthContext(accessToken: string, correlationId: CorrelationId): Promise<IAuthContext> {
    return this.authCoreService.getAuthContext(accessToken, correlationId);
  }

  // Account management methods
  async register(
    registerRequest: IRegisterRequest,
    ipAddress: string,
    userAgent: string,
    correlationId: CorrelationId
  ): Promise<IRegisterResponse> {
    return this.authAccountService.register(registerRequest, ipAddress, userAgent, correlationId);
  }

  async changePassword(
    userId: EntityId,
    request: IChangePasswordRequest,
    correlationId: CorrelationId
  ): Promise<void> {
    return this.authAccountService.changePassword(userId, request, correlationId);
  }

  async sendPasswordResetEmail(
    request: IForgotPasswordRequest,
    ipAddress: string,
    correlationId: CorrelationId
  ): Promise<void> {
    return this.authAccountService.sendPasswordResetEmail(request, ipAddress, correlationId);
  }

  async resetPassword(
    request: IResetPasswordRequest,
    ipAddress: string,
    correlationId: CorrelationId
  ): Promise<void> {
    return this.authAccountService.resetPassword(request, ipAddress, correlationId);
  }

  async verifyEmail(token: string, correlationId: CorrelationId): Promise<void> {
    return this.authAccountService.verifyEmail(token, correlationId);
  }

  async resendVerificationEmail(email: string, correlationId: CorrelationId): Promise<void> {
    return this.authAccountService.resendVerificationEmail(email, correlationId);
  }

  // MFA methods
  async setupMfa(userId: EntityId, correlationId: CorrelationId): Promise<IMfaSetupResponse> {
    return this.authMfaService.setupMfa(userId, correlationId);
  }

  async verifyAndEnableMfa(
    userId: EntityId,
    request: IMfaVerifyRequest,
    correlationId: CorrelationId
  ): Promise<void> {
    return this.authMfaService.verifyAndEnableMfa(userId, request, correlationId);
  }

  async disableMfa(
    userId: EntityId,
    request: IMfaVerifyRequest,
    correlationId: CorrelationId
  ): Promise<void> {
    return this.authMfaService.disableMfa(userId, request, correlationId);
  }

  async regenerateBackupCodes(
    userId: EntityId,
    request: IMfaVerifyRequest,
    correlationId: CorrelationId
  ): Promise<string[]> {
    return this.authMfaService.regenerateBackupCodes(userId, request, correlationId);
  }
}