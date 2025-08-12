/**
 * Audit Service
 * Comprehensive audit logging for security and compliance
 */

import { EntityId, CorrelationId } from '@template/shared-types';
import {
  IAuthAuditLog,
  AuthAuditAction,
  ISecurityEvent,
  SecurityEventType,
  SecuritySeverity,
} from '../types/auth';
import { CorrelatedLogger } from '../utils/logger';

export class AuditService {
  private logger: CorrelatedLogger;

  constructor() {
    this.logger = new CorrelatedLogger('audit-service');
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(
    userId: EntityId | undefined,
    action: AuthAuditAction,
    resource: string,
    details: Record<string, unknown>,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    correlationId: CorrelationId,
    sessionId?: EntityId,
    errorMessage?: string
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const auditLog: IAuthAuditLog = {
        id: this.generateId(),
        userId,
        action,
        resource,
        details,
        ipAddress,
        userAgent,
        success,
        errorMessage,
        correlationId,
        sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId || 'system',
        updatedBy: userId || 'system',
      };

      // Save to database
      await this.saveAuditLog(auditLog);

      // Log to application logger as well for immediate visibility
      const logLevel = success ? 'info' : 'warn';
      this.logger[logLevel]('Auth event logged', {
        userId,
        action,
        resource,
        success,
        sessionId,
        ipAddress: this.maskIpAddress(ipAddress),
      });
    } catch (error) {
      this.logger.error('Failed to log auth event', {
        userId,
        action,
        resource,
        success,
        error: (error as Error).message,
      });
      // Don't throw - audit failures shouldn't break auth flow
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    description: string,
    metadata: Record<string, unknown>,
    correlationId: CorrelationId,
    userId?: EntityId,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      const securityEvent: ISecurityEvent = {
        id: this.generateId(),
        type,
        severity,
        userId,
        description,
        metadata,
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        correlationId,
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId || 'system',
        updatedBy: userId || 'system',
      };

      // Save to database
      await this.saveSecurityEvent(securityEvent);

      // Log to application logger with appropriate level
      const logLevel = this.getLogLevelForSeverity(severity);
      this.logger[logLevel]('Security event logged', {
        type,
        severity,
        userId,
        description,
        ipAddress: ipAddress ? this.maskIpAddress(ipAddress) : undefined,
      });

      // For critical events, also trigger alerts
      if (severity === SecuritySeverity.CRITICAL) {
        await this.triggerSecurityAlert(securityEvent);
      }
    } catch (error) {
      this.logger.error('Failed to log security event', {
        type,
        severity,
        userId,
        description,
        error: (error as Error).message,
      });
      // Don't throw - audit failures shouldn't break auth flow
    }
  }

  /**
   * Get audit logs for user
   */
  async getUserAuditLogs(
    userId: EntityId,
    startDate?: Date,
    endDate?: Date,
    actions?: AuthAuditAction[],
    limit: number = 100
  ): Promise<IAuthAuditLog[]> {
    try {
      const auditLogs = await this.getAuditLogsFromDatabase({
        userId,
        startDate,
        endDate,
        actions,
        limit,
      });

      this.logger.debug('Retrieved user audit logs', {
        userId,
        logCount: auditLogs.length,
        startDate,
        endDate,
      });

      return auditLogs;
    } catch (error) {
      this.logger.error('Failed to get user audit logs', {
        userId,
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * Get security events
   */
  async getSecurityEvents(
    startDate?: Date,
    endDate?: Date,
    types?: SecurityEventType[],
    severities?: SecuritySeverity[],
    resolved?: boolean,
    limit: number = 100
  ): Promise<ISecurityEvent[]> {
    try {
      const securityEvents = await this.getSecurityEventsFromDatabase({
        startDate,
        endDate,
        types,
        severities,
        resolved,
        limit,
      });

      this.logger.debug('Retrieved security events', {
        eventCount: securityEvents.length,
        startDate,
        endDate,
        types,
        severities,
        resolved,
      });

      return securityEvents;
    } catch (error) {
      this.logger.error('Failed to get security events', {
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * Resolve security event
   */
  async resolveSecurityEvent(
    eventId: EntityId,
    resolvedBy: EntityId,
    correlationId: CorrelationId
  ): Promise<void> {
    this.logger.setCorrelationId(correlationId);

    try {
      await this.updateSecurityEventResolution(eventId, resolvedBy, new Date());

      this.logger.info('Security event resolved', {
        eventId,
        resolvedBy,
      });
    } catch (error) {
      this.logger.error('Failed to resolve security event', {
        eventId,
        resolvedBy,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    eventsByAction: Record<AuthAuditAction, number>;
    securityEventsBySeverity: Record<SecuritySeverity, number>;
    uniqueUsers: number;
    uniqueIpAddresses: number;
  }> {
    try {
      const stats = await this.getAuditStatsFromDatabase(startDate, endDate);

      this.logger.debug('Retrieved audit statistics', {
        startDate,
        endDate,
        totalEvents: stats.totalEvents,
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get audit statistics', {
        startDate,
        endDate,
        error: (error as Error).message,
      });

      // Return empty stats object
      return {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        eventsByAction: {} as Record<AuthAuditAction, number>,
        securityEventsBySeverity: {} as Record<SecuritySeverity, number>,
        uniqueUsers: 0,
        uniqueIpAddresses: 0,
      };
    }
  }

  /**
   * Export audit logs for compliance
   */
  async exportAuditLogs(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const auditLogs = await this.getAuditLogsFromDatabase({
        startDate,
        endDate,
        limit: 10000, // Large limit for export
      });

      const securityEvents = await this.getSecurityEventsFromDatabase({
        startDate,
        endDate,
        limit: 10000,
      });

      let exportData: string;

      if (format === 'json') {
        exportData = JSON.stringify(
          {
            exportDate: new Date().toISOString(),
            dateRange: { startDate, endDate },
            auditLogs,
            securityEvents,
          },
          null,
          2
        );
      } else {
        // CSV format implementation would go here
        exportData = this.convertToCSV(auditLogs, securityEvents);
      }

      this.logger.info('Audit logs exported', {
        startDate,
        endDate,
        format,
        auditLogCount: auditLogs.length,
        securityEventCount: securityEvents.length,
      });

      return exportData;
    } catch (error) {
      this.logger.error('Failed to export audit logs', {
        startDate,
        endDate,
        format,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Private helper methods
  private maskIpAddress(ipAddress: string): string {
    // Mask last octet for privacy while keeping audit trail
    const parts = ipAddress.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    return 'xxx.xxx.xxx.xxx';
  }

  private getLogLevelForSeverity(severity: SecuritySeverity): 'info' | 'warn' | 'error' {
    switch (severity) {
      case SecuritySeverity.LOW:
      case SecuritySeverity.MEDIUM:
        return 'info';
      case SecuritySeverity.HIGH:
        return 'warn';
      case SecuritySeverity.CRITICAL:
        return 'error';
      default:
        return 'info';
    }
  }

  private async triggerSecurityAlert(event: ISecurityEvent): Promise<void> {
    // Implementation would integrate with alerting system
    this.logger.error('CRITICAL SECURITY EVENT DETECTED', {
      eventId: event.id,
      type: event.type,
      description: event.description,
      userId: event.userId,
      ipAddress: event.ipAddress,
    });
  }

  private convertToCSV(auditLogs: IAuthAuditLog[], securityEvents: ISecurityEvent[]): string {
    // Basic CSV conversion - real implementation would be more robust
    const headers = 'Type,Timestamp,UserId,Action,Success,IPAddress,Description\n';

    const auditRows = auditLogs
      .map(
        log =>
          `AUDIT,${log.createdAt},${log.userId || ''},${log.action},${log.success},${this.maskIpAddress(log.ipAddress)},${log.resource}`
      )
      .join('\n');

    const securityRows = securityEvents
      .map(
        event =>
          `SECURITY,${event.createdAt},${event.userId || ''},${event.type},${!event.resolved},${this.maskIpAddress(event.ipAddress)},${event.description}`
      )
      .join('\n');

    return headers + auditRows + '\n' + securityRows;
  }

  private generateId(): EntityId {
    return require('uuid').v4() as EntityId;
  }

  // Database operation stubs - would be implemented with actual database
  private async saveAuditLog(auditLog: IAuthAuditLog): Promise<void> {
    // Database save implementation
  }

  private async saveSecurityEvent(securityEvent: ISecurityEvent): Promise<void> {
    // Database save implementation
  }

  private async getAuditLogsFromDatabase(params: {
    userId?: EntityId;
    startDate?: Date;
    endDate?: Date;
    actions?: AuthAuditAction[];
    limit: number;
  }): Promise<IAuthAuditLog[]> {
    // Database query implementation
    return [];
  }

  private async getSecurityEventsFromDatabase(params: {
    startDate?: Date;
    endDate?: Date;
    types?: SecurityEventType[];
    severities?: SecuritySeverity[];
    resolved?: boolean;
    limit: number;
  }): Promise<ISecurityEvent[]> {
    // Database query implementation
    return [];
  }

  private async updateSecurityEventResolution(
    eventId: EntityId,
    resolvedBy: EntityId,
    resolvedAt: Date
  ): Promise<void> {
    // Database update implementation
  }

  private async getAuditStatsFromDatabase(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    eventsByAction: Record<AuthAuditAction, number>;
    securityEventsBySeverity: Record<SecuritySeverity, number>;
    uniqueUsers: number;
    uniqueIpAddresses: number;
  }> {
    // Database aggregation query implementation
    return {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      eventsByAction: {} as Record<AuthAuditAction, number>,
      securityEventsBySeverity: {} as Record<SecuritySeverity, number>,
      uniqueUsers: 0,
      uniqueIpAddresses: 0,
    };
  }
}
