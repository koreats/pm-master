import { CSRFProtection, CSRFToken } from '@/lib/auth/infrastructure/security/CSRFProtection'
import * as crypto from 'crypto'

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    set: jest.fn(),
    get: jest.fn(() => ({ value: null })),
    delete: jest.fn()
  }))
}))

describe('CSRFProtection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set environment for testing
    process.env.CSRF_SECRET = 'test-csrf-secret-key'
  })

  afterEach(() => {
    delete process.env.CSRF_SECRET
  })

  describe('generateToken', () => {
    it('should generate a CSRF token with required properties', () => {
      const token = CSRFProtection.generateToken()
      
      expect(token).toHaveProperty('token')
      expect(token).toHaveProperty('expiresAt')
      expect(token.token).toBeTruthy()
      expect(token.expiresAt).toBeInstanceOf(Date)
      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('should generate token with session ID when provided', () => {
      const sessionId = 'test-session-id'
      const token = CSRFProtection.generateToken(sessionId)
      
      expect(token.sessionId).toBe(sessionId)
    })

    it('should generate different tokens on each call', () => {
      const token1 = CSRFProtection.generateToken()
      const token2 = CSRFProtection.generateToken()
      
      expect(token1.token).not.toBe(token2.token)
    })

    it('should generate tokens that expire in 24 hours', () => {
      const token = CSRFProtection.generateToken()
      const now = new Date()
      const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      
      // Allow 1 second tolerance
      expect(Math.abs(token.expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(1000)
    })
  })

  describe('signToken', () => {
    it('should create a signed token string', () => {
      const token = CSRFProtection.generateToken()
      const signedToken = CSRFProtection.signToken(token)
      
      expect(typeof signedToken).toBe('string')
      expect(signedToken.includes('.')).toBe(true) // Should have payload.signature format
    })

    it('should create consistent signatures for same token', () => {
      const token = CSRFProtection.generateToken()
      const signedToken1 = CSRFProtection.signToken(token)
      const signedToken2 = CSRFProtection.signToken(token)
      
      expect(signedToken1).toBe(signedToken2)
    })

    it('should create different signatures for different tokens', () => {
      const token1 = CSRFProtection.generateToken()
      const token2 = CSRFProtection.generateToken()
      const signedToken1 = CSRFProtection.signToken(token1)
      const signedToken2 = CSRFProtection.signToken(token2)
      
      expect(signedToken1).not.toBe(signedToken2)
    })
  })

  describe('verifySignedToken', () => {
    it('should verify valid signed token', () => {
      const token = CSRFProtection.generateToken()
      const signedToken = CSRFProtection.signToken(token)
      const verified = CSRFProtection.verifySignedToken(signedToken)
      
      expect(verified).toBeTruthy()
      expect(verified?.token).toBe(token.token)
      expect(verified?.expiresAt.getTime()).toBe(token.expiresAt.getTime())
    })

    it('should reject invalid signature', () => {
      const token = CSRFProtection.generateToken()
      const signedToken = CSRFProtection.signToken(token)
      const tamperedToken = signedToken.slice(0, -5) + 'xxxxx' // Tamper with signature
      
      const verified = CSRFProtection.verifySignedToken(tamperedToken)
      
      expect(verified).toBeNull()
    })

    it('should reject malformed token', () => {
      const verified = CSRFProtection.verifySignedToken('invalid-token')
      
      expect(verified).toBeNull()
    })

    it('should reject expired token', () => {
      // Create expired token
      const expiredToken: CSRFToken = {
        token: 'test-token',
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        sessionId: 'test-session'
      }
      const signedToken = CSRFProtection.signToken(expiredToken)
      
      const verified = CSRFProtection.verifySignedToken(signedToken)
      
      expect(verified).toBeNull()
    })
  })

  describe('validateRequest', () => {
    beforeEach(() => {
      // Mock cookies().get to return a valid CSRF token cookie
      const { cookies } = require('next/headers')
      const token = CSRFProtection.generateToken()
      const signedToken = CSRFProtection.signToken(token)
      
      cookies.mockReturnValue({
        set: jest.fn(),
        get: jest.fn(() => ({ value: signedToken })),
        delete: jest.fn()
      })
    })

    it('should validate matching CSRF tokens', async () => {
      const token = CSRFProtection.generateToken()
      const signedToken = CSRFProtection.signToken(token)
      
      // Mock cookie to return the same signed token
      const { cookies } = require('next/headers')
      cookies.mockReturnValue({
        set: jest.fn(),
        get: jest.fn(() => ({ value: signedToken })),
        delete: jest.fn()
      })
      
      const isValid = await CSRFProtection.validateRequest(token.token)
      
      expect(isValid).toBe(true)
    })

    it('should reject mismatched CSRF tokens', async () => {
      const token1 = CSRFProtection.generateToken()
      const token2 = CSRFProtection.generateToken()
      const signedToken1 = CSRFProtection.signToken(token1)
      
      // Mock cookie to return different token
      const { cookies } = require('next/headers')
      cookies.mockReturnValue({
        set: jest.fn(),
        get: jest.fn(() => ({ value: signedToken1 })),
        delete: jest.fn()
      })
      
      const isValid = await CSRFProtection.validateRequest(token2.token)
      
      expect(isValid).toBe(false)
    })

    it('should reject missing request token', async () => {
      const isValid = await CSRFProtection.validateRequest(null)
      
      expect(isValid).toBe(false)
    })

    it('should reject when cookie token is missing', async () => {
      const { cookies } = require('next/headers')
      cookies.mockReturnValue({
        set: jest.fn(),
        get: jest.fn(() => null),
        delete: jest.fn()
      })
      
      const isValid = await CSRFProtection.validateRequest('some-token')
      
      expect(isValid).toBe(false)
    })
  })

  describe('getFromHeaders', () => {
    it('should extract CSRF token from headers', () => {
      const headers = new Headers()
      headers.set('X-CSRF-Token', 'test-csrf-token')
      
      const token = CSRFProtection.getFromHeaders(headers)
      
      expect(token).toBe('test-csrf-token')
    })

    it('should return null when header is missing', () => {
      const headers = new Headers()
      
      const token = CSRFProtection.getFromHeaders(headers)
      
      expect(token).toBeNull()
    })
  })

  describe('validateMutation', () => {
    it('should allow GET requests without CSRF check', async () => {
      const request = new Request('https://example.com/api/data', {
        method: 'GET'
      })
      
      const isValid = await CSRFProtection.validateMutation(request)
      
      expect(isValid).toBe(true)
    })

    it('should allow HEAD requests without CSRF check', async () => {
      const request = new Request('https://example.com/api/data', {
        method: 'HEAD'
      })
      
      const isValid = await CSRFProtection.validateMutation(request)
      
      expect(isValid).toBe(true)
    })

    it('should validate POST requests for CSRF token', async () => {
      const token = CSRFProtection.generateToken()
      const signedToken = CSRFProtection.signToken(token)
      
      // Mock cookie
      const { cookies } = require('next/headers')
      cookies.mockReturnValue({
        set: jest.fn(),
        get: jest.fn(() => ({ value: signedToken })),
        delete: jest.fn()
      })
      
      const request = new Request('https://example.com/api/data', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: 'test' })
      })
      
      const isValid = await CSRFProtection.validateMutation(request)
      
      expect(isValid).toBe(true)
    })
  })

  describe('double submit token pattern', () => {
    it('should create double submit token', () => {
      const token = CSRFProtection.createDoubleSubmitToken()
      
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // token.timestamp.signature
    })

    it('should verify valid double submit token', () => {
      const token = CSRFProtection.createDoubleSubmitToken()
      const isValid = CSRFProtection.verifyDoubleSubmitToken(token)
      
      expect(isValid).toBe(true)
    })

    it('should reject expired double submit token', async () => {
      const token = CSRFProtection.createDoubleSubmitToken()
      
      // Wait for 1ms to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 1))
      
      const isValid = CSRFProtection.verifyDoubleSubmitToken(token, 0) // 0ms max age
      
      expect(isValid).toBe(false)
    })

    it('should reject tampered double submit token', () => {
      const token = CSRFProtection.createDoubleSubmitToken()
      const tamperedToken = token.slice(0, -5) + 'xxxxx'
      const isValid = CSRFProtection.verifyDoubleSubmitToken(tamperedToken)
      
      expect(isValid).toBe(false)
    })
  })

  describe('utility methods', () => {
    it('should generate HTML meta tag', () => {
      const token = 'test-csrf-token'
      const metaTag = CSRFProtection.generateMetaTag(token)
      
      expect(metaTag).toContain('csrf-token')
      expect(metaTag).toContain(token)
      expect(metaTag).toMatch(/<meta[^>]*>/)
    })

    it('should generate hidden form field', () => {
      const token = 'test-csrf-token'
      const formField = CSRFProtection.generateFormField(token)
      
      expect(formField).toContain('_csrf')
      expect(formField).toContain(token)
      expect(formField).toContain('type="hidden"')
    })
  })

  describe('security considerations', () => {
    it('should use cryptographically secure random values', () => {
      const tokens = Array.from({ length: 100 }, () => CSRFProtection.generateToken().token)
      const uniqueTokens = new Set(tokens)
      
      // All tokens should be unique
      expect(uniqueTokens.size).toBe(100)
    })

    it('should use HMAC for token signing', () => {
      const token = CSRFProtection.generateToken()
      const signedToken = CSRFProtection.signToken(token)
      
      // Should contain payload and signature
      const parts = signedToken.split('.')
      expect(parts.length).toBe(2)
      
      // Signature should be base64url encoded
      expect(parts[1]).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('should have appropriate token length', () => {
      const token = CSRFProtection.generateToken()
      
      // Token should be sufficiently long for security
      expect(token.token.length).toBeGreaterThanOrEqual(32)
    })

    it('should have secure cookie settings', async () => {
      const { cookies } = require('next/headers')
      const mockSet = jest.fn()
      cookies.mockReturnValue({
        set: mockSet,
        get: jest.fn(() => null),
        delete: jest.fn()
      })
      
      const token = CSRFProtection.generateToken()
      await CSRFProtection.setCookie(token)
      
      expect(mockSet).toHaveBeenCalledWith(
        '__csrf',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/'
        })
      )
    })
  })
})