import { createServiceRoleClient } from '@/lib/supabase/server'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests allowed in the window
  keyPrefix?: string // Prefix for the rate limit key
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number // Seconds until the rate limit resets
}

export class RateLimiter {
  private static readonly DEFAULT_CONFIGS = {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      keyPrefix: 'login',
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      keyPrefix: 'register',
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      keyPrefix: 'reset',
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      keyPrefix: 'api',
    },
    mfa: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 5,
      keyPrefix: 'mfa',
    },
  }

  async checkLimit(
    identifier: string,
    action: keyof typeof RateLimiter.DEFAULT_CONFIGS | RateLimitConfig
  ): Promise<RateLimitResult> {
    const config = typeof action === 'string' 
      ? RateLimiter.DEFAULT_CONFIGS[action]
      : action

    const key = `${config.keyPrefix}:${identifier}`
    const now = Date.now()
    const windowStart = now - config.windowMs

    try {
      const supabase = await createServiceRoleClient()
      
      // Get rate limit records for this key within the window
      const { data, error } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .gte('created_at', new Date(windowStart).toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Rate limit check error:', error)
        // On error, allow the request but log it
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetAt: new Date(now + config.windowMs),
        }
      }

      const requestCount = data?.length || 0
      const remaining = Math.max(0, config.maxRequests - requestCount)
      const oldestRequest = data?.[data.length - 1]
      const resetAt = oldestRequest 
        ? new Date(new Date(oldestRequest.created_at).getTime() + config.windowMs)
        : new Date(now + config.windowMs)

      if (requestCount >= config.maxRequests) {
        const retryAfter = Math.ceil((resetAt.getTime() - now) / 1000)
        
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter,
        }
      }

      // Record this request
      await this.recordRequest(key, identifier, config.keyPrefix || 'unknown')

      return {
        allowed: true,
        remaining: remaining - 1,
        resetAt,
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // On error, allow the request but log it
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now + config.windowMs),
      }
    }
  }

  async recordRequest(key: string, identifier: string, action: string): Promise<void> {
    try {
      const supabase = await createServiceRoleClient()
      
      const { error } = await supabase
        .from('rate_limits')
        .insert({
          key,
          identifier,
          action,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Failed to record rate limit:', error)
      }
    } catch (error) {
      console.error('Record request error:', error)
    }
  }

  async resetLimit(identifier: string, action: string): Promise<void> {
    try {
      const supabase = await createServiceRoleClient()
      const config = RateLimiter.DEFAULT_CONFIGS[action as keyof typeof RateLimiter.DEFAULT_CONFIGS]
      
      if (!config) {
        throw new Error(`Unknown action: ${action}`)
      }

      const key = `${config.keyPrefix}:${identifier}`
      
      const { error } = await supabase
        .from('rate_limits')
        .delete()
        .eq('key', key)

      if (error) {
        console.error('Failed to reset rate limit:', error)
      }
    } catch (error: any) {
      console.error('Reset limit error:', error)
      // Re-throw validation errors for proper error handling
      if (error.message && error.message.includes('Unknown action:')) {
        throw error
      }
    }
  }

  async cleanupExpiredRecords(): Promise<number> {
    try {
      const supabase = await createServiceRoleClient()
      
      // Find the maximum window size
      const maxWindow = Math.max(
        ...Object.values(RateLimiter.DEFAULT_CONFIGS).map(c => c.windowMs)
      )
      
      // Delete records older than the maximum window
      const cutoff = new Date(Date.now() - maxWindow)
      
      const { data, error } = await supabase
        .from('rate_limits')
        .delete()
        .lt('created_at', cutoff.toISOString())
        .select('id')

      if (error) {
        console.error('Failed to cleanup rate limits:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Cleanup expired records error:', error)
      return 0
    }
  }

  async getRequestCount(
    identifier: string,
    action: string,
    windowMs?: number
  ): Promise<number> {
    try {
      const supabase = await createServiceRoleClient()
      const config = RateLimiter.DEFAULT_CONFIGS[action as keyof typeof RateLimiter.DEFAULT_CONFIGS]
      
      if (!config) {
        return 0
      }

      const window = windowMs || config.windowMs
      const windowStart = new Date(Date.now() - window)
      const key = `${config.keyPrefix}:${identifier}`
      
      const { count, error } = await supabase
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('key', key)
        .gte('created_at', windowStart.toISOString())

      if (error) {
        console.error('Failed to get request count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Get request count error:', error)
      return 0
    }
  }

  createCustomConfig(
    windowMs: number,
    maxRequests: number,
    keyPrefix: string
  ): RateLimitConfig {
    return {
      windowMs,
      maxRequests,
      keyPrefix,
    }
  }

  async checkIpRateLimit(ipAddress: string, action: string): Promise<RateLimitResult> {
    // Use IP address as identifier for IP-based rate limiting
    return this.checkLimit(ipAddress, action as keyof typeof RateLimiter.DEFAULT_CONFIGS)
  }

  async checkUserRateLimit(userId: string, action: string): Promise<RateLimitResult> {
    // Use user ID as identifier for user-based rate limiting
    return this.checkLimit(userId, action as keyof typeof RateLimiter.DEFAULT_CONFIGS)
  }

  async checkCompositeLimit(
    userId: string,
    ipAddress: string,
    action: string
  ): Promise<RateLimitResult> {
    // Check both user and IP rate limits, return the most restrictive
    const [userLimit, ipLimit] = await Promise.all([
      this.checkUserRateLimit(userId, action),
      this.checkIpRateLimit(ipAddress, action),
    ])

    if (!userLimit.allowed || !ipLimit.allowed) {
      return {
        allowed: false,
        remaining: Math.min(userLimit.remaining, ipLimit.remaining),
        resetAt: userLimit.resetAt > ipLimit.resetAt ? userLimit.resetAt : ipLimit.resetAt,
        retryAfter: Math.max(userLimit.retryAfter || 0, ipLimit.retryAfter || 0),
      }
    }

    return {
      allowed: true,
      remaining: Math.min(userLimit.remaining, ipLimit.remaining),
      resetAt: userLimit.resetAt > ipLimit.resetAt ? userLimit.resetAt : ipLimit.resetAt,
    }
  }
}