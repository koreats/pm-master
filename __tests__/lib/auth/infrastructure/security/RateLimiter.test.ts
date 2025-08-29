import { RateLimiter, RateLimitConfig, RateLimitResult } from '@/lib/auth/infrastructure/security/RateLimiter'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
        lt: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }))
}))

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    rateLimiter = new RateLimiter()
    jest.clearAllMocks()
  })

  describe('checkLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await rateLimiter.checkLimit('test-user', 'login')
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
      expect(result.resetAt).toBeInstanceOf(Date)
    })

    it('should handle custom rate limit config', async () => {
      const customConfig: RateLimitConfig = {
        windowMs: 60000, // 1 minute
        maxRequests: 10,
        keyPrefix: 'custom'
      }
      
      const result = await rateLimiter.checkLimit('test-user', customConfig)
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9) // One request recorded
    })

    it('should respect rate limit windows', async () => {
      // First, we would need to mock the database to return existing requests
      // For now, testing the structure
      const result = await rateLimiter.checkLimit('test-user', 'api')
      
      expect(result).toHaveProperty('allowed')
      expect(result).toHaveProperty('remaining')
      expect(result).toHaveProperty('resetAt')
    })
  })

  describe('rate limit configurations', () => {
    it('should have correct default config for login', () => {
      const loginConfig = (RateLimiter as any).DEFAULT_CONFIGS.login
      
      expect(loginConfig.windowMs).toBe(15 * 60 * 1000) // 15 minutes
      expect(loginConfig.maxRequests).toBe(5)
      expect(loginConfig.keyPrefix).toBe('login')
    })

    it('should have correct default config for registration', () => {
      const regConfig = (RateLimiter as any).DEFAULT_CONFIGS.registration
      
      expect(regConfig.windowMs).toBe(60 * 60 * 1000) // 1 hour
      expect(regConfig.maxRequests).toBe(3)
      expect(regConfig.keyPrefix).toBe('register')
    })

    it('should have correct default config for API', () => {
      const apiConfig = (RateLimiter as any).DEFAULT_CONFIGS.api
      
      expect(apiConfig.windowMs).toBe(60 * 1000) // 1 minute
      expect(apiConfig.maxRequests).toBe(100)
      expect(apiConfig.keyPrefix).toBe('api')
    })

    it('should have correct default config for password reset', () => {
      const resetConfig = (RateLimiter as any).DEFAULT_CONFIGS.passwordReset
      
      expect(resetConfig.windowMs).toBe(60 * 60 * 1000) // 1 hour
      expect(resetConfig.maxRequests).toBe(3)
      expect(resetConfig.keyPrefix).toBe('reset')
    })

    it('should have correct default config for MFA', () => {
      const mfaConfig = (RateLimiter as any).DEFAULT_CONFIGS.mfa
      
      expect(mfaConfig.windowMs).toBe(5 * 60 * 1000) // 5 minutes
      expect(mfaConfig.maxRequests).toBe(5)
      expect(mfaConfig.keyPrefix).toBe('mfa')
    })
  })

  describe('createCustomConfig', () => {
    it('should create custom rate limit config', () => {
      const config = rateLimiter.createCustomConfig(
        30000, // 30 seconds
        20,    // 20 requests
        'test' // test prefix
      )
      
      expect(config.windowMs).toBe(30000)
      expect(config.maxRequests).toBe(20)
      expect(config.keyPrefix).toBe('test')
    })
  })

  describe('checkIpRateLimit', () => {
    it('should check rate limit by IP address', async () => {
      const result = await rateLimiter.checkIpRateLimit('192.168.1.1', 'login')
      
      expect(result).toHaveProperty('allowed')
      expect(result).toHaveProperty('remaining')
      expect(result).toHaveProperty('resetAt')
    })
  })

  describe('checkUserRateLimit', () => {
    it('should check rate limit by user ID', async () => {
      const result = await rateLimiter.checkUserRateLimit('user-123', 'api')
      
      expect(result).toHaveProperty('allowed')
      expect(result).toHaveProperty('remaining')
      expect(result).toHaveProperty('resetAt')
    })
  })

  describe('checkCompositeLimit', () => {
    it('should check both user and IP rate limits', async () => {
      const result = await rateLimiter.checkCompositeLimit(
        'user-123',
        '192.168.1.1',
        'login'
      )
      
      expect(result).toHaveProperty('allowed')
      expect(result).toHaveProperty('remaining')
      expect(result).toHaveProperty('resetAt')
    })
  })

  describe('resetLimit', () => {
    it('should reset rate limit for identifier', async () => {
      // Should not throw error
      await expect(rateLimiter.resetLimit('test-user', 'login')).resolves.not.toThrow()
    })

    it('should handle unknown action by throwing error', async () => {
      await expect(rateLimiter.resetLimit('test-user', 'unknown' as any)).rejects.toThrow('Unknown action: unknown')
    })
  })

  describe('cleanupExpiredRecords', () => {
    it('should clean up expired records', async () => {
      const deletedCount = await rateLimiter.cleanupExpiredRecords()
      
      expect(typeof deletedCount).toBe('number')
      expect(deletedCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getRequestCount', () => {
    it('should get request count for identifier and action', async () => {
      const count = await rateLimiter.getRequestCount('test-user', 'login')
      
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should return 0 for unknown action', async () => {
      const count = await rateLimiter.getRequestCount('test-user', 'unknown')
      
      expect(count).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ 
                  data: null, 
                  error: { message: 'Database error' } 
                }))
              }))
            }))
          }))
        }))
      }
      
      const { createServiceRoleClient } = require('@/lib/supabase/server')
      createServiceRoleClient.mockReturnValue(mockSupabase)
      
      const result = await rateLimiter.checkLimit('test-user', 'login')
      
      // Should allow request on error (fail-open policy)
      expect(result.allowed).toBe(true)
    })
  })

  describe('security considerations', () => {
    it('should use different limits for different actions', () => {
      const configs = (RateLimiter as any).DEFAULT_CONFIGS
      
      // Login should be more restrictive than API
      expect(configs.login.maxRequests).toBeLessThan(configs.api.maxRequests)
      
      // Registration should be more restrictive than login
      expect(configs.registration.maxRequests).toBeLessThan(configs.login.maxRequests)
      
      // MFA should have reasonable limits
      expect(configs.mfa.maxRequests).toBe(5)
      expect(configs.mfa.windowMs).toBe(5 * 60 * 1000)
    })

    it('should have appropriate time windows', () => {
      const configs = (RateLimiter as any).DEFAULT_CONFIGS
      
      // API should have shorter window
      expect(configs.api.windowMs).toBe(60 * 1000) // 1 minute
      
      // Authentication should have longer windows
      expect(configs.login.windowMs).toBe(15 * 60 * 1000) // 15 minutes
      expect(configs.registration.windowMs).toBe(60 * 60 * 1000) // 1 hour
    })
  })
})