import { createServiceRoleClient } from '@/lib/supabase/server'
import { AuditLogService } from '../services/AuditLogService'

export interface AccountLockConfig {
  maxAttempts: number
  lockDurationMinutes: number
  checkWindowMinutes: number
}

export interface LockStatus {
  isLocked: boolean
  lockedUntil?: Date
  reason?: string
  attemptCount: number
  remainingAttempts: number
}

export class AccountLockService {
  private static readonly DEFAULT_CONFIG: AccountLockConfig = {
    maxAttempts: 5, // ISMS-P requirement
    lockDurationMinutes: 5, // ISMS-P requirement  
    checkWindowMinutes: 15,
  }

  private auditLog: AuditLogService

  constructor() {
    this.auditLog = new AuditLogService()
  }

  async checkLockStatus(
    userId?: string,
    email?: string,
    config: AccountLockConfig = AccountLockService.DEFAULT_CONFIG
  ): Promise<LockStatus> {
    if (!userId && !email) {
      throw new Error('Either userId or email must be provided')
    }

    try {
      const supabase = await createServiceRoleClient()
      
      // Check for active locks
      let lockQuery = supabase
        .from('account_locks')
        .select('*')
        .gt('locked_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      if (userId) {
        lockQuery = lockQuery.eq('user_id', userId)
      } else if (email) {
        lockQuery = lockQuery.eq('email', email)
      }

      const { data: lockData, error: lockError } = await lockQuery.maybeSingle()

      if (lockError) {
        console.error('Failed to check lock status:', lockError)
      }

      // Check if account is currently locked
      if (lockData && new Date(lockData.locked_until) > new Date()) {
        return {
          isLocked: true,
          lockedUntil: new Date(lockData.locked_until),
          reason: lockData.reason,
          attemptCount: config.maxAttempts,
          remainingAttempts: 0,
        }
      }

      // Count recent failed attempts
      const attemptCount = await this.getFailedAttemptCount(email || '', config.checkWindowMinutes)
      const remainingAttempts = Math.max(0, config.maxAttempts - attemptCount)

      return {
        isLocked: false,
        attemptCount,
        remainingAttempts,
      }
    } catch (error) {
      console.error('Check lock status error:', error)
      // On error, don't lock the account
      return {
        isLocked: false,
        attemptCount: 0,
        remainingAttempts: config.maxAttempts,
      }
    }
  }

  async lockAccount(
    userId: string | null,
    email: string,
    reason: string = 'Too many failed login attempts',
    config: AccountLockConfig = AccountLockService.DEFAULT_CONFIG
  ): Promise<void> {
    try {
      const supabase = await createServiceRoleClient()
      const lockedUntil = new Date(Date.now() + config.lockDurationMinutes * 60 * 1000)
      
      const { error } = await supabase
        .from('account_locks')
        .insert({
          user_id: userId,
          email,
          locked_until: lockedUntil.toISOString(),
          reason,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Failed to lock account:', error)
        throw new Error('Failed to lock account')
      }

      // Log the account lock
      await this.auditLog.logAction({
        userId: userId || undefined,
        action: 'account_locked',
        metadata: {
          email: this.maskEmail(email),
          reason,
          lockedUntil: lockedUntil.toISOString(),
          lockDurationMinutes: config.lockDurationMinutes,
        },
        severity: 'warning',
      })

      // Create security alert
      await this.auditLog.createSecurityAlert({
        userId: userId || undefined,
        alertType: 'account_locked',
        severity: 'high',
        description: `Account locked: ${this.maskEmail(email)}`,
        metadata: {
          email: this.maskEmail(email),
          reason,
          lockedUntil: lockedUntil.toISOString(),
        },
      })
    } catch (error) {
      console.error('Lock account error:', error)
      throw error
    }
  }

  async unlockAccount(userId?: string, email?: string): Promise<void> {
    if (!userId && !email) {
      throw new Error('Either userId or email must be provided')
    }

    try {
      const supabase = await createServiceRoleClient()
      
      // Update all active locks to expire immediately
      let query = supabase
        .from('account_locks')
        .update({
          locked_until: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .gt('locked_until', new Date().toISOString())

      if (userId) {
        query = query.eq('user_id', userId)
      } else if (email) {
        query = query.eq('email', email)
      }

      const { error } = await query

      if (error) {
        console.error('Failed to unlock account:', error)
        throw new Error('Failed to unlock account')
      }

      // Log the unlock
      await this.auditLog.logAction({
        userId,
        action: 'account_unlocked',
        metadata: {
          email: email ? this.maskEmail(email) : undefined,
        },
        severity: 'info',
      })
    } catch (error) {
      console.error('Unlock account error:', error)
      throw error
    }
  }

  async recordFailedAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    userId?: string,
    config: AccountLockConfig = AccountLockService.DEFAULT_CONFIG
  ): Promise<LockStatus> {
    try {
      const supabase = await createServiceRoleClient()
      
      // Record the failed attempt
      const { error } = await supabase
        .from('auth_attempts')
        .insert({
          user_id: userId || null,
          email,
          ip_address: ipAddress,
          user_agent: userAgent,
          success: false,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Failed to record attempt:', error)
      }

      // Check if we should lock the account
      const attemptCount = await this.getFailedAttemptCount(email, config.checkWindowMinutes)
      
      if (attemptCount >= config.maxAttempts) {
        // Lock the account
        await this.lockAccount(userId || null, email, 'Too many failed login attempts', config)
        
        return {
          isLocked: true,
          lockedUntil: new Date(Date.now() + config.lockDurationMinutes * 60 * 1000),
          reason: 'Too many failed login attempts',
          attemptCount,
          remainingAttempts: 0,
        }
      }

      return {
        isLocked: false,
        attemptCount,
        remainingAttempts: Math.max(0, config.maxAttempts - attemptCount),
      }
    } catch (error) {
      console.error('Record failed attempt error:', error)
      return {
        isLocked: false,
        attemptCount: 0,
        remainingAttempts: config.maxAttempts,
      }
    }
  }

  async recordSuccessfulAttempt(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const supabase = await createServiceRoleClient()
      
      // Record successful attempt
      const { error } = await supabase
        .from('auth_attempts')
        .insert({
          user_id: userId,
          email,
          ip_address: ipAddress,
          user_agent: userAgent,
          success: true,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Failed to record successful attempt:', error)
      }

      // Clear any failed attempts for this user
      await this.clearFailedAttempts(email)
    } catch (error) {
      console.error('Record successful attempt error:', error)
    }
  }

  private async getFailedAttemptCount(email: string, windowMinutes: number): Promise<number> {
    try {
      const supabase = await createServiceRoleClient()
      const since = new Date(Date.now() - windowMinutes * 60 * 1000)
      
      const { count, error } = await supabase
        .from('auth_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', since.toISOString())

      if (error) {
        console.error('Failed to count attempts:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Get failed attempt count error:', error)
      return 0
    }
  }

  private async clearFailedAttempts(email: string): Promise<void> {
    try {
      const supabase = await createServiceRoleClient()
      
      // We don't actually delete the attempts (for audit purposes)
      // but we can mark them as processed or add a cleared flag
      // For now, we'll just rely on the time window
      
      // Optional: Add a "cleared" flag to the attempts
      const { error } = await supabase
        .from('auth_attempts')
        .update({ cleared: true })
        .eq('email', email)
        .eq('success', false)
        .is('cleared', null)

      if (error) {
        console.error('Failed to clear attempts:', error)
      }
    } catch (error) {
      console.error('Clear failed attempts error:', error)
    }
  }

  async getLockedAccounts(): Promise<Array<{
    userId?: string
    email: string
    lockedUntil: Date
    reason: string
  }>> {
    try {
      const supabase = await createServiceRoleClient()
      
      const { data, error } = await supabase
        .from('account_locks')
        .select('*')
        .gt('locked_until', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to get locked accounts:', error)
        return []
      }

      return data.map(lock => ({
        userId: lock.user_id,
        email: lock.email,
        lockedUntil: new Date(lock.locked_until),
        reason: lock.reason,
      }))
    } catch (error) {
      console.error('Get locked accounts error:', error)
      return []
    }
  }

  async cleanupExpiredLocks(): Promise<number> {
    try {
      const supabase = await createServiceRoleClient()
      
      const { data, error } = await supabase
        .from('account_locks')
        .delete()
        .lt('locked_until', new Date().toISOString())
        .select('id')

      if (error) {
        console.error('Failed to cleanup expired locks:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Cleanup expired locks error:', error)
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
}