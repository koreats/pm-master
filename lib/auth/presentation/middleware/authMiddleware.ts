import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { RateLimiter } from '../../infrastructure/security/RateLimiter'
import { CSRFProtection } from '../../infrastructure/security/CSRFProtection'
import { AccountLockService } from '../../infrastructure/security/AccountLockService'

export interface AuthMiddlewareConfig {
  publicRoutes?: string[]
  authRoutes?: string[]
  protectedRoutes?: string[]
  apiRoutes?: string[]
  enableRateLimit?: boolean
  enableCSRF?: boolean
  enableAccountLock?: boolean
  redirectUrl?: string
}

const DEFAULT_CONFIG: AuthMiddlewareConfig = {
  publicRoutes: ['/', '/about', '/contact'],
  authRoutes: ['/auth/login', '/auth/signup', '/auth/reset-password'],
  protectedRoutes: ['/dashboard', '/profile', '/settings'],
  apiRoutes: ['/api'],
  enableRateLimit: true,
  enableCSRF: true,
  enableAccountLock: true,
  redirectUrl: '/auth/login',
}

export async function authMiddleware(
  request: NextRequest,
  config: AuthMiddlewareConfig = DEFAULT_CONFIG
) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname
  
  // Merge config with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Check if route is public
  const isPublicRoute = finalConfig.publicRoutes?.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if route is auth route (login, signup, etc.)
  const isAuthRoute = finalConfig.authRoutes?.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if route is protected
  const isProtectedRoute = finalConfig.protectedRoutes?.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if route is API
  const isApiRoute = finalConfig.apiRoutes?.some(route => 
    pathname.startsWith(route)
  )

  // Apply rate limiting
  if (finalConfig.enableRateLimit) {
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '0.0.0.0'
    
    const rateLimiter = new RateLimiter()
    let rateLimitAction: keyof typeof RateLimiter['DEFAULT_CONFIGS'] = 'api'
    
    if (pathname.includes('/login')) {
      rateLimitAction = 'login'
    } else if (pathname.includes('/signup') || pathname.includes('/register')) {
      rateLimitAction = 'registration'
    } else if (pathname.includes('/reset-password')) {
      rateLimitAction = 'passwordReset'
    }
    
    const rateLimitResult = await rateLimiter.checkIpRateLimit(ipAddress, rateLimitAction)
    
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Limit': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          },
        }
      )
    }
  }

  // Apply CSRF protection for mutations
  if (finalConfig.enableCSRF && request.method !== 'GET' && request.method !== 'HEAD') {
    const isValid = await CSRFProtection.validateMutation(request)
    
    if (!isValid) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get session
  const { data: { session }, error } = await supabase.auth.getSession()

  // Check account lock status if enabled
  if (finalConfig.enableAccountLock && session?.user) {
    const lockService = new AccountLockService()
    const lockStatus = await lockService.checkLockStatus(
      session.user.id,
      session.user.email
    )
    
    if (lockStatus.isLocked) {
      // Sign out locked user
      await supabase.auth.signOut()
      
      return NextResponse.redirect(
        new URL('/auth/account-locked', request.url)
      )
    }
  }

  // Handle auth routes (login, signup, etc.)
  if (isAuthRoute) {
    if (session) {
      // Already authenticated, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // Handle protected routes
  if (isProtectedRoute || (!isPublicRoute && !isAuthRoute)) {
    if (!session) {
      // Not authenticated, redirect to login
      const redirectUrl = finalConfig.redirectUrl || '/auth/login'
      const returnUrl = encodeURIComponent(pathname)
      return NextResponse.redirect(
        new URL(`${redirectUrl}?returnUrl=${returnUrl}`, request.url)
      )
    }
  }

  // Handle API routes
  if (isApiRoute) {
    if (!session && !isPublicRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    
    // Add user info to headers for API routes
    if (session) {
      response.headers.set('X-User-Id', session.user.id)
      response.headers.set('X-User-Email', session.user.email || '')
    }
  }

  return response
}

// Helper function to check if user has required role
export async function checkUserRole(
  userId: string,
  teamId: string,
  requiredRole: string
): Promise<boolean> {
  // This would need to be implemented with actual database queries
  // For now, returning true as a placeholder
  return true
}

// Helper function to check if user has required permission
export async function checkUserPermission(
  userId: string,
  teamId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // This would need to be implemented with actual permission checks
  // For now, returning true as a placeholder
  return true
}