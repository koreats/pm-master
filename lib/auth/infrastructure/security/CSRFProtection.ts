import * as crypto from 'crypto'
import { cookies } from 'next/headers'

export interface CSRFToken {
  token: string
  expiresAt: Date
  sessionId?: string
}

export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32
  private static readonly TOKEN_EXPIRY_HOURS = 24
  private static readonly COOKIE_NAME = '__csrf'
  private static readonly HEADER_NAME = 'X-CSRF-Token'
  private static readonly SECRET_KEY = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'

  /**
   * Generate a new CSRF token
   */
  static generateToken(sessionId?: string): CSRFToken {
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('base64url')
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
    
    return {
      token,
      expiresAt,
      sessionId,
    }
  }

  /**
   * Create a signed token string
   */
  static signToken(token: CSRFToken): string {
    const payload = JSON.stringify({
      token: token.token,
      expiresAt: token.expiresAt.toISOString(),
      sessionId: token.sessionId,
    })
    
    const signature = crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(payload)
      .digest('base64url')
    
    return `${Buffer.from(payload).toString('base64url')}.${signature}`
  }

  /**
   * Verify and parse a signed token string
   */
  static verifySignedToken(signedToken: string): CSRFToken | null {
    try {
      const [payloadBase64, signature] = signedToken.split('.')
      
      if (!payloadBase64 || !signature) {
        return null
      }

      const payload = Buffer.from(payloadBase64, 'base64url').toString()
      
      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.SECRET_KEY)
        .update(payload)
        .digest('base64url')
      
      if (signature !== expectedSignature) {
        console.error('CSRF token signature mismatch')
        return null
      }

      const data = JSON.parse(payload)
      
      // Check expiration
      if (new Date(data.expiresAt) < new Date()) {
        console.error('CSRF token expired')
        return null
      }

      return {
        token: data.token,
        expiresAt: new Date(data.expiresAt),
        sessionId: data.sessionId,
      }
    } catch (error) {
      console.error('Failed to verify CSRF token:', error)
      return null
    }
  }

  /**
   * Set CSRF token cookie
   */
  static async setCookie(token: CSRFToken): Promise<void> {
    const cookieStore = await cookies()
    const signedToken = this.signToken(token)
    
    cookieStore.set(this.COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: token.expiresAt,
      path: '/',
    })
  }

  /**
   * Get CSRF token from cookie
   */
  static async getFromCookie(): Promise<CSRFToken | null> {
    const cookieStore = await cookies()
    const signedToken = cookieStore.get(this.COOKIE_NAME)?.value
    
    if (!signedToken) {
      return null
    }

    return this.verifySignedToken(signedToken)
  }

  /**
   * Validate CSRF token from request
   */
  static async validateRequest(
    requestToken: string | null,
    sessionId?: string
  ): Promise<boolean> {
    if (!requestToken) {
      console.error('CSRF token missing from request')
      return false
    }

    // Get token from cookie
    const cookieToken = await this.getFromCookie()
    
    if (!cookieToken) {
      console.error('CSRF token missing from cookie')
      return false
    }

    // Compare tokens
    if (cookieToken.token !== requestToken) {
      console.error('CSRF token mismatch')
      return false
    }

    // Verify session ID if provided
    if (sessionId && cookieToken.sessionId && cookieToken.sessionId !== sessionId) {
      console.error('CSRF token session ID mismatch')
      return false
    }

    // Check expiration
    if (cookieToken.expiresAt < new Date()) {
      console.error('CSRF token expired')
      return false
    }

    return true
  }

  /**
   * Extract CSRF token from request headers
   */
  static getFromHeaders(headers: Headers): string | null {
    return headers.get(this.HEADER_NAME)
  }

  /**
   * Generate and set a new CSRF token
   */
  static async generateAndSet(sessionId?: string): Promise<string> {
    const token = this.generateToken(sessionId)
    await this.setCookie(token)
    return token.token
  }

  /**
   * Middleware helper to validate CSRF for mutations
   */
  static async validateMutation(request: Request): Promise<boolean> {
    // Skip CSRF check for GET requests
    if (request.method === 'GET' || request.method === 'HEAD') {
      return true
    }

    // Get token from header or body
    const headerToken = this.getFromHeaders(request.headers)
    
    let bodyToken: string | null = null
    if (request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await request.clone().json()
        bodyToken = body.csrfToken || body._csrf || null
      } catch {
        // Body parsing failed
      }
    }

    const requestToken = headerToken || bodyToken
    
    return this.validateRequest(requestToken)
  }

  /**
   * Clear CSRF token cookie
   */
  static async clearCookie(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(this.COOKIE_NAME)
  }

  /**
   * Rotate CSRF token (generate new one while keeping session)
   */
  static async rotateToken(sessionId?: string): Promise<string> {
    const currentToken = await this.getFromCookie()
    const newToken = this.generateToken(sessionId || currentToken?.sessionId)
    await this.setCookie(newToken)
    return newToken.token
  }

  /**
   * Create a double-submit cookie pattern token
   * This creates a token that must be submitted both as a cookie and in the request
   */
  static createDoubleSubmitToken(): string {
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('base64url')
    const timestamp = Date.now()
    const data = `${token}.${timestamp}`
    
    const signature = crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(data)
      .digest('base64url')
    
    return `${data}.${signature}`
  }

  /**
   * Verify a double-submit token
   */
  static verifyDoubleSubmitToken(token: string, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return false
      }

      const [tokenPart, timestampPart, signature] = parts
      const timestamp = parseInt(timestampPart, 10)
      
      // Check age
      if (Date.now() - timestamp > maxAgeMs) {
        return false
      }

      // Verify signature
      const data = `${tokenPart}.${timestampPart}`
      const expectedSignature = crypto
        .createHmac('sha256', this.SECRET_KEY)
        .update(data)
        .digest('base64url')
      
      return signature === expectedSignature
    } catch (error) {
      console.error('Failed to verify double-submit token:', error)
      return false
    }
  }

  /**
   * Generate HTML meta tag for CSRF token
   */
  static generateMetaTag(token: string): string {
    return `<meta name="csrf-token" content="${token}" />`
  }

  /**
   * Generate hidden form field for CSRF token
   */
  static generateFormField(token: string): string {
    return `<input type="hidden" name="_csrf" value="${token}" />`
  }
}