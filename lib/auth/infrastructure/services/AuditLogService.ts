import { createServiceRoleClient } from '@/lib/supabase/server'

export interface AuditLogEntry {
  userId?: string
  action: string
  entityType?: string
  entityId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  severity?: 'info' | 'warning' | 'error' | 'critical'
  timestamp?: Date
}

export interface AuthAttemptLog {
  email: string
  userId?: string
  success: boolean
  ipAddress: string
  userAgent: string
  errorMessage?: string
  action?: 'login' | 'signup' | 'password_reset'
}

export interface SecurityAlert {
  userId?: string
  alertType: 'suspicious_login' | 'multiple_failed_attempts' | 'account_locked' | 'privilege_escalation' | 'data_breach_attempt'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata?: Record<string, any>
  resolved?: boolean
}

export class AuditLogService {
  private readonly RETENTION_DAYS = 365 // ISMS-P requirement: 1+ year retention

  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const supabase = await createServiceRoleClient()
      
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: entry.userId || null,
          action: entry.action,
          entity_type: entry.entityType || null,
          entity_id: entry.entityId || null,
          ip_address: entry.ipAddress || null,
          user_agent: entry.userAgent || null,
          metadata: entry.metadata || {},
          severity: entry.severity || 'info',
          created_at: (entry.timestamp || new Date()).toISOString(),
        })

      if (error) {
        console.error('Failed to log audit action:', error)
        // Don't throw - audit logging should not break the application
      }
    } catch (error) {
      console.error('Audit log error:', error)
    }
  }

  async logAuthAttempt(attempt: AuthAttemptLog): Promise<void> {
    try {
      const supabase = await createServiceRoleClient()
      
      // Log to auth_attempts table
      const { error: attemptError } = await supabase
        .from('auth_attempts')
        .insert({
          email: attempt.email,
          user_id: attempt.userId || null,
          ip_address: attempt.ipAddress,
          user_agent: attempt.userAgent,
          success: attempt.success,
          error_message: attempt.errorMessage || null,
          created_at: new Date().toISOString(),
        })

      if (attemptError) {
        console.error('Failed to log auth attempt:', attemptError)
      }

      // Also log to main audit log
      await this.logAction({
        userId: attempt.userId,
        action: attempt.action || (attempt.success ? 'auth_success' : 'auth_failed'),
        metadata: {
          email: attempt.email,
          success: attempt.success,
          errorMessage: attempt.errorMessage,
        },
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
        severity: attempt.success ? 'info' : 'warning',
      })

      // Check for suspicious patterns
      if (!attempt.success) {
        await this.checkSuspiciousActivity(attempt.email, attempt.ipAddress)
      }
    } catch (error) {
      console.error('Auth attempt log error:', error)
    }
  }

  async createSecurityAlert(alert: SecurityAlert): Promise<void> {
    try {
      const supabase = await createServiceRoleClient()
      
      const { error } = await supabase
        .from('security_alerts')
        .insert({
          user_id: alert.userId || null,
          alert_type: alert.alertType,
          severity: alert.severity,
          description: alert.description,
          metadata: alert.metadata || {},
          resolved: alert.resolved || false,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Failed to create security alert:', error)
      }

      // Log critical alerts to audit log
      if (alert.severity === 'critical' || alert.severity === 'high') {
        await this.logAction({
          userId: alert.userId,
          action: 'security_alert_created',
          metadata: {
            alertType: alert.alertType,
            severity: alert.severity,
            description: alert.description,
          },
          severity: 'critical',
        })
      }
    } catch (error) {
      console.error('Security alert error:', error)
    }
  }

  async getRecentActions(
    userId?: string,
    limit: number = 100,
    actions?: string[]
  ): Promise<AuditLogEntry[]> {
    try {
      const supabase = await createServiceRoleClient()
      
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (actions && actions.length > 0) {
        query = query.in('action', actions)
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to fetch audit logs:', error)
        return []
      }

      return data.map(this.mapToAuditLogEntry)
    } catch (error) {
      console.error('Get recent actions error:', error)
      return []
    }
  }

  async getFailedLoginAttempts(
    email: string,
    sinceMinutes: number = 15
  ): Promise<number> {
    try {
      const supabase = await createServiceRoleClient()
      const since = new Date(Date.now() - sinceMinutes * 60 * 1000)
      
      const { count, error } = await supabase
        .from('auth_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', since.toISOString())

      if (error) {
        console.error('Failed to count login attempts:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Get failed login attempts error:', error)
      return 0
    }
  }

  async checkSuspiciousActivity(email: string, ipAddress: string): Promise<void> {
    try {
      // Check for multiple failed attempts
      const failedAttempts = await this.getFailedLoginAttempts(email, 15)
      
      if (failedAttempts >= 3 && failedAttempts < 5) {
        await this.createSecurityAlert({
          alertType: 'multiple_failed_attempts',
          severity: 'medium',
          description: `Multiple failed login attempts (${failedAttempts}) for ${this.maskEmail(email)} from ${ipAddress}`,
          metadata: {
            email: this.maskEmail(email),
            ipAddress,
            attemptCount: failedAttempts,
          },
        })
      } else if (failedAttempts >= 5) {
        await this.createSecurityAlert({
          alertType: 'account_locked',
          severity: 'high',
          description: `Account locked due to ${failedAttempts} failed attempts for ${this.maskEmail(email)}`,
          metadata: {
            email: this.maskEmail(email),
            ipAddress,
            attemptCount: failedAttempts,
          },
        })
      }

      // Check for suspicious IP patterns
      await this.checkSuspiciousIpActivity(ipAddress)
    } catch (error) {
      console.error('Check suspicious activity error:', error)
    }
  }

  private async checkSuspiciousIpActivity(ipAddress: string): Promise<void> {
    try {
      const supabase = await createServiceRoleClient()
      const since = new Date(Date.now() - 60 * 60 * 1000) // Last hour
      
      // Count failed attempts from this IP
      const { count, error } = await supabase
        .from('auth_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .eq('success', false)
        .gte('created_at', since.toISOString())

      if (error) {
        console.error('Failed to check IP activity:', error)
        return
      }

      // Alert if too many failed attempts from same IP
      if (count && count >= 10) {
        await this.createSecurityAlert({
          alertType: 'suspicious_login',
          severity: 'high',
          description: `Suspicious activity detected from IP ${ipAddress}: ${count} failed attempts in the last hour`,
          metadata: {
            ipAddress,
            attemptCount: count,
            timeWindow: '1 hour',
          },
        })
      }
    } catch (error) {
      console.error('Check suspicious IP activity error:', error)
    }
  }

  async cleanupOldLogs(): Promise<number> {
    try {
      const supabase = await createServiceRoleClient()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS)
      
      // Delete old audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id')

      if (auditError) {
        console.error('Failed to cleanup audit logs:', auditError)
      }

      // Delete old auth attempts
      const { data: attemptData, error: attemptError } = await supabase
        .from('auth_attempts')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id')

      if (attemptError) {
        console.error('Failed to cleanup auth attempts:', attemptError)
      }

      const deletedCount = (auditData?.length || 0) + (attemptData?.length || 0)
      
      if (deletedCount > 0) {
        await this.logAction({
          action: 'audit_logs_cleanup',
          metadata: {
            deletedCount,
            cutoffDate: cutoffDate.toISOString(),
          },
          severity: 'info',
        })
      }

      return deletedCount
    } catch (error) {
      console.error('Cleanup old logs error:', error)
      return 0
    }
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@')
    if (localPart.length <= 2) {
      return `**@${domain}`
    }
    return `${localPart.substring(0, 2)}***@${domain}`
  }

  private mapToAuditLogEntry(data: any): AuditLogEntry {
    return {
      userId: data.user_id,
      action: data.action,
      entityType: data.entity_type,
      entityId: data.entity_id,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      metadata: data.metadata,
      severity: data.severity,
      timestamp: new Date(data.created_at),
    }
  }
}