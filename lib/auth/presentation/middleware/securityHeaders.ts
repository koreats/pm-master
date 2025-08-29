import { NextRequest, NextResponse } from 'next/server'

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string
  strictTransportSecurity?: string
  xFrameOptions?: string
  xContentTypeOptions?: string
  referrerPolicy?: string
  permissionsPolicy?: string
  crossOriginOpenerPolicy?: string
  crossOriginResourcePolicy?: string
  crossOriginEmbedderPolicy?: string
  xDnsPrefechtrol?: string
  xPermittedCrossDomainPolicies?: string
}

const DEFAULT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.supabase.co",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.github.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "block-all-mixed-content",
  "upgrade-insecure-requests",
].join('; ')

const DEFAULT_PERMISSIONS_POLICY = [
  'accelerometer=()',
  'ambient-light-sensor=()',
  'autoplay=()',
  'battery=()',
  'camera=()',
  'cross-origin-isolated=()',
  'display-capture=()',
  'document-domain=()',
  'encrypted-media=()',
  'execution-while-not-rendered=()',
  'execution-while-out-of-viewport=()',
  'fullscreen=(self)',
  'geolocation=()',
  'gyroscope=()',
  'keyboard-map=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'navigation-override=()',
  'payment=()',
  'picture-in-picture=()',
  'publickey-credentials-get=()',
  'screen-wake-lock=()',
  'sync-xhr=()',
  'usb=()',
  'web-share=()',
  'xr-spatial-tracking=()',
].join(', ')

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: DEFAULT_CSP,
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: DEFAULT_PERMISSIONS_POLICY,
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
  crossOriginEmbedderPolicy: 'require-corp',
  xDnsPrefechtrol: 'off',
  xPermittedCrossDomainPolicies: 'none',
}

export function securityHeaders(
  request: NextRequest,
  config: SecurityHeadersConfig = DEFAULT_CONFIG
): NextResponse {
  const response = NextResponse.next()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Content Security Policy
  if (finalConfig.contentSecurityPolicy) {
    // In development, allow more permissive CSP for hot reload
    const csp = isDevelopment 
      ? finalConfig.contentSecurityPolicy.replace("'self'", "'self' 'unsafe-eval'")
      : finalConfig.contentSecurityPolicy
    
    response.headers.set('Content-Security-Policy', csp)
  }
  
  // Strict Transport Security (HSTS)
  if (finalConfig.strictTransportSecurity && !isDevelopment) {
    response.headers.set('Strict-Transport-Security', finalConfig.strictTransportSecurity)
  }
  
  // X-Frame-Options
  if (finalConfig.xFrameOptions) {
    response.headers.set('X-Frame-Options', finalConfig.xFrameOptions)
  }
  
  // X-Content-Type-Options
  if (finalConfig.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', finalConfig.xContentTypeOptions)
  }
  
  // Referrer Policy
  if (finalConfig.referrerPolicy) {
    response.headers.set('Referrer-Policy', finalConfig.referrerPolicy)
  }
  
  // Permissions Policy
  if (finalConfig.permissionsPolicy) {
    response.headers.set('Permissions-Policy', finalConfig.permissionsPolicy)
  }
  
  // Cross-Origin-Opener-Policy
  if (finalConfig.crossOriginOpenerPolicy) {
    response.headers.set('Cross-Origin-Opener-Policy', finalConfig.crossOriginOpenerPolicy)
  }
  
  // Cross-Origin-Resource-Policy
  if (finalConfig.crossOriginResourcePolicy) {
    response.headers.set('Cross-Origin-Resource-Policy', finalConfig.crossOriginResourcePolicy)
  }
  
  // Cross-Origin-Embedder-Policy
  if (finalConfig.crossOriginEmbedderPolicy && !isDevelopment) {
    response.headers.set('Cross-Origin-Embedder-Policy', finalConfig.crossOriginEmbedderPolicy)
  }
  
  // X-DNS-Prefetch-Control
  if (finalConfig.xDnsPrefechtrol) {
    response.headers.set('X-DNS-Prefetch-Control', finalConfig.xDnsPrefechtrol)
  }
  
  // X-Permitted-Cross-Domain-Policies
  if (finalConfig.xPermittedCrossDomainPolicies) {
    response.headers.set('X-Permitted-Cross-Domain-Policies', finalConfig.xPermittedCrossDomainPolicies)
  }
  
  // Remove potentially dangerous headers
  response.headers.delete('X-Powered-By')
  response.headers.delete('Server')
  
  return response
}

// Combined middleware for auth and security headers
export async function combinedSecurityMiddleware(
  request: NextRequest,
  authConfig?: any,
  headersConfig?: SecurityHeadersConfig
): Promise<NextResponse> {
  // Import auth middleware dynamically to avoid circular dependency
  const { authMiddleware } = await import('./authMiddleware')
  
  // Apply auth middleware first
  const authResponse = await authMiddleware(request, authConfig)
  
  // If auth middleware returned a redirect or error, return it
  if (authResponse.status !== 200 || authResponse.headers.get('Location')) {
    return authResponse
  }
  
  // Apply security headers
  return securityHeaders(request, headersConfig)
}

// CSP directive builder for dynamic CSP generation
export class CSPBuilder {
  private directives: Map<string, Set<string>> = new Map()
  
  constructor() {
    // Set default directives
    this.addDirective('default-src', "'self'")
    this.addDirective('object-src', "'none'")
    this.addDirective('base-uri', "'self'")
  }
  
  addDirective(directive: string, ...values: string[]): this {
    if (!this.directives.has(directive)) {
      this.directives.set(directive, new Set())
    }
    const set = this.directives.get(directive)!
    values.forEach(value => set.add(value))
    return this
  }
  
  removeDirective(directive: string): this {
    this.directives.delete(directive)
    return this
  }
  
  allowScript(...sources: string[]): this {
    return this.addDirective('script-src', ...sources)
  }
  
  allowStyle(...sources: string[]): this {
    return this.addDirective('style-src', ...sources)
  }
  
  allowImage(...sources: string[]): this {
    return this.addDirective('img-src', ...sources)
  }
  
  allowFont(...sources: string[]): this {
    return this.addDirective('font-src', ...sources)
  }
  
  allowConnect(...sources: string[]): this {
    return this.addDirective('connect-src', ...sources)
  }
  
  allowMedia(...sources: string[]): this {
    return this.addDirective('media-src', ...sources)
  }
  
  allowFrame(...sources: string[]): this {
    return this.addDirective('frame-src', ...sources)
  }
  
  allowFrameAncestors(...sources: string[]): this {
    return this.addDirective('frame-ancestors', ...sources)
  }
  
  requireSRI(): this {
    return this.addDirective('require-sri-for', 'script', 'style')
  }
  
  blockMixedContent(): this {
    return this.addDirective('block-all-mixed-content')
  }
  
  upgradeInsecureRequests(): this {
    return this.addDirective('upgrade-insecure-requests')
  }
  
  build(): string {
    const csp: string[] = []
    
    this.directives.forEach((values, directive) => {
      if (values.size > 0) {
        csp.push(`${directive} ${Array.from(values).join(' ')}`)
      } else {
        csp.push(directive)
      }
    })
    
    return csp.join('; ')
  }
}

// Nonce generator for inline scripts/styles
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

// Add nonce to CSP for inline scripts
export function addNonceToCSP(csp: string, nonce: string): string {
  return csp.replace(
    "script-src",
    `script-src 'nonce-${nonce}'`
  ).replace(
    "style-src",
    `style-src 'nonce-${nonce}'`
  )
}