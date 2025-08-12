/**
 * Session Service
 * Manages user sessions with Redis for high performance
 */

import { EntityId, CorrelationId } from '@template/shared-types';
import { IUserSession } from '../types/auth';
import { CorrelatedLogger } from '../utils/logger';

export class SessionService {
  private logger: CorrelatedLogger;
  private redisClient: any; // Redis client would be injected

  constructor(redisClient?: any) {
    this.logger = new CorrelatedLogger('session-service');
    this.redisClient = redisClient;
  }

  /**
   * Create new session
   */
  async createSession(session: IUserSession): Promise<void> {
    try {
      // Store session in Redis with expiration
      const sessionKey = this.getSessionKey(session.id);
      const sessionData = JSON.stringify(session);
      
      // Calculate TTL from expiresAt
      const expiresAt = new Date(session.expiresAt);
      const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

      if (this.redisClient) {
        await this.redisClient.setex(sessionKey, ttlSeconds, sessionData);
      }

      // Also store in database for persistence
      await this.saveSessionToDatabase(session);

      this.logger.info('Session created successfully', {
        sessionId: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        ttl: ttlSeconds
      });

    } catch (error) {
      this.logger.error('Failed to create session', {
        sessionId: session.id,
        userId: session.userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: EntityId): Promise<IUserSession | null> {
    try {
      const sessionKey = this.getSessionKey(sessionId);

      // Try Redis first for performance
      if (this.redisClient) {
        const sessionData = await this.redisClient.get(sessionKey);
        if (sessionData) {
          const session = JSON.parse(sessionData) as IUserSession;
          
          this.logger.debug('Session retrieved from Redis', {
            sessionId,
            userId: session.userId
          });
          
          return session;
        }
      }

      // Fall back to database
      const session = await this.getSessionFromDatabase(sessionId);
      
      if (session) {
        // Check if session is still valid
        if (new Date(session.expiresAt) > new Date() && session.isActive) {
          // Cache in Redis for future requests
          if (this.redisClient) {
            const ttlSeconds = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000);
            await this.redisClient.setex(sessionKey, ttlSeconds, JSON.stringify(session));
          }
          
          this.logger.debug('Session retrieved from database', {
            sessionId,
            userId: session.userId
          });
          
          return session;
        } else {
          // Session expired or inactive
          await this.revokeSession(sessionId);
          return null;
        }
      }

      this.logger.debug('Session not found', { sessionId });
      return null;

    } catch (error) {
      this.logger.error('Failed to get session', {
        sessionId,
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Update session
   */
  async updateSession(
    sessionId: EntityId,
    updates: Partial<Pick<IUserSession, 'accessToken' | 'refreshToken' | 'lastAccessAt' | 'expiresAt'>>
  ): Promise<void> {
    try {
      // Get current session
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Apply updates
      const updatedSession: IUserSession = {
        ...session,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Update in Redis
      if (this.redisClient) {
        const sessionKey = this.getSessionKey(sessionId);
        const ttlSeconds = Math.floor((new Date(updatedSession.expiresAt).getTime() - Date.now()) / 1000);
        await this.redisClient.setex(sessionKey, ttlSeconds, JSON.stringify(updatedSession));
      }

      // Update in database
      await this.updateSessionInDatabase(sessionId, updatedSession);

      this.logger.info('Session updated successfully', {
        sessionId,
        userId: session.userId,
        updates: Object.keys(updates)
      });

    } catch (error) {
      this.logger.error('Failed to update session', {
        sessionId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: EntityId): Promise<void> {
    try {
      // Remove from Redis
      if (this.redisClient) {
        const sessionKey = this.getSessionKey(sessionId);
        await this.redisClient.del(sessionKey);
      }

      // Mark as inactive in database
      await this.deactivateSessionInDatabase(sessionId);

      this.logger.info('Session revoked successfully', {
        sessionId
      });

    } catch (error) {
      this.logger.error('Failed to revoke session', {
        sessionId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Revoke all sessions for user
   */
  async revokeAllUserSessions(userId: EntityId): Promise<void> {
    try {
      // Get all user sessions from database
      const userSessions = await this.getUserSessionsFromDatabase(userId);

      // Remove from Redis
      if (this.redisClient && userSessions.length > 0) {
        const sessionKeys = userSessions.map(session => this.getSessionKey(session.id));
        await this.redisClient.del(...sessionKeys);
      }

      // Mark all as inactive in database
      await this.deactivateAllUserSessionsInDatabase(userId);

      this.logger.info('All user sessions revoked', {
        userId,
        sessionCount: userSessions.length
      });

    } catch (error) {
      this.logger.error('Failed to revoke all user sessions', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      // Get expired sessions from database
      const expiredSessions = await this.getExpiredSessionsFromDatabase();

      if (expiredSessions.length === 0) {
        return 0;
      }

      // Remove from Redis
      if (this.redisClient) {
        const sessionKeys = expiredSessions.map(session => this.getSessionKey(session.id));
        await this.redisClient.del(...sessionKeys);
      }

      // Remove from database
      const sessionIds = expiredSessions.map(session => session.id);
      await this.deleteExpiredSessionsFromDatabase(sessionIds);

      this.logger.info('Expired sessions cleaned up', {
        cleanupCount: expiredSessions.length
      });

      return expiredSessions.length;

    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', {
        error: (error as Error).message
      });
      return 0;
    }
  }

  /**
   * Get active sessions for user
   */
  async getUserActiveSessions(userId: EntityId): Promise<IUserSession[]> {
    try {
      const sessions = await this.getUserSessionsFromDatabase(userId);
      
      // Filter for active and non-expired sessions
      const activeSessions = sessions.filter(session => 
        session.isActive && new Date(session.expiresAt) > new Date()
      );

      this.logger.debug('Retrieved user active sessions', {
        userId,
        totalSessions: sessions.length,
        activeSessions: activeSessions.length
      });

      return activeSessions;

    } catch (error) {
      this.logger.error('Failed to get user active sessions', {
        userId,
        error: (error as Error).message
      });
      return [];
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(): Promise<{
    totalActiveSessions: number;
    totalExpiredSessions: number;
    sessionsInRedis: number;
  }> {
    try {
      const stats = await this.getSessionStatsFromDatabase();
      
      let sessionsInRedis = 0;
      if (this.redisClient) {
        const sessionKeys = await this.redisClient.keys(this.getSessionKey('*'));
        sessionsInRedis = sessionKeys.length;
      }

      return {
        ...stats,
        sessionsInRedis
      };

    } catch (error) {
      this.logger.error('Failed to get session statistics', {
        error: (error as Error).message
      });
      return {
        totalActiveSessions: 0,
        totalExpiredSessions: 0,
        sessionsInRedis: 0
      };
    }
  }

  // Private helper methods
  private getSessionKey(sessionId: EntityId): string {
    return `session:${sessionId}`;
  }

  private async saveSessionToDatabase(session: IUserSession): Promise<void> {
    // Database save implementation would go here
  }

  private async getSessionFromDatabase(sessionId: EntityId): Promise<IUserSession | null> {
    // Database query implementation would go here
    return null;
  }

  private async updateSessionInDatabase(sessionId: EntityId, session: IUserSession): Promise<void> {
    // Database update implementation would go here
  }

  private async deactivateSessionInDatabase(sessionId: EntityId): Promise<void> {
    // Database update implementation would go here
  }

  private async getUserSessionsFromDatabase(userId: EntityId): Promise<IUserSession[]> {
    // Database query implementation would go here
    return [];
  }

  private async deactivateAllUserSessionsInDatabase(userId: EntityId): Promise<void> {
    // Database update implementation would go here
  }

  private async getExpiredSessionsFromDatabase(): Promise<IUserSession[]> {
    // Database query implementation would go here
    return [];
  }

  private async deleteExpiredSessionsFromDatabase(sessionIds: EntityId[]): Promise<void> {
    // Database deletion implementation would go here
  }

  private async getSessionStatsFromDatabase(): Promise<{
    totalActiveSessions: number;
    totalExpiredSessions: number;
  }> {
    // Database query implementation would go here
    return {
      totalActiveSessions: 0,
      totalExpiredSessions: 0
    };
  }
}