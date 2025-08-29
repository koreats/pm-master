import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { authMiddleware } from '@/lib/auth/presentation/middleware/authMiddleware'
import { securityHeaders } from '@/lib/auth/presentation/middleware/securityHeaders'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Define route categories
  const publicRoutes = [
    '/',
    '/about', 
    '/contact',
    '/privacy',
    '/terms'
  ]
  
  const authRoutes = [
    '/auth/login',
    '/auth/signup', 
    '/auth/callback',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/account-locked'
  ]
  
  const apiRoutes = ['/api']
  
  const protectedRoutes = [
    '/dashboard',
    '/profile', 
    '/settings',
    '/teams',
    '/projects',
    '/goals',
    '/tasks'
  ]

  // Check route types
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  const isApiRoute = apiRoutes.some(route => pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  try {
    // Apply security headers first (for all routes)
    let response = securityHeaders(request)
    
    // For static files and auth callback, only apply security headers
    if (pathname.startsWith('/_next/') || 
        pathname.includes('/favicon.ico') || 
        pathname.includes('.') ||
        pathname === '/auth/callback') {
      return response
    }

    // Apply comprehensive auth middleware for all non-static routes
    const authConfig = {
      publicRoutes,
      authRoutes,
      protectedRoutes,
      apiRoutes,
      enableRateLimit: true,
      enableCSRF: process.env.NODE_ENV === 'production', // Enable in production
      enableAccountLock: true,
      redirectUrl: '/auth/login',
    }

    // Apply auth middleware which includes rate limiting, CSRF, and account lock checks
    const authResponse = await authMiddleware(request, authConfig)
    
    // If auth middleware returned a redirect or error, return it with security headers
    if (authResponse.status !== 200 || authResponse.headers.get('Location')) {
      // Copy security headers to auth response
      response.headers.forEach((value, key) => {
        authResponse.headers.set(key, value)
      })
      return authResponse
    }

    // For auth routes with authenticated users, handle redirects
    if (isAuthRoute) {
      const supabaseResponse = await updateSession(request)
      
      // Copy security headers to supabase response
      response.headers.forEach((value, key) => {
        supabaseResponse.headers.set(key, value)
      })
      
      // If user is authenticated and trying to access auth routes, redirect to dashboard
      if (supabaseResponse.headers.get('X-User-Id')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      
      return supabaseResponse
    }

    // For protected routes or API routes, ensure session is valid
    if (isProtectedRoute || isApiRoute) {
      const supabaseResponse = await updateSession(request)
      
      // Copy security headers to supabase response
      response.headers.forEach((value, key) => {
        supabaseResponse.headers.set(key, value)
      })
      
      // If no user and not a public API route, updateSession will handle redirect
      return supabaseResponse
    }

    // For public routes, just apply security headers
    if (isPublicRoute) {
      return response
    }

    // Default to protected route behavior for unmatched routes
    const supabaseResponse = await updateSession(request)
    response.headers.forEach((value, key) => {
      supabaseResponse.headers.set(key, value)
    })
    
    return supabaseResponse

  } catch (error) {
    console.error('Middleware error:', error)
    
    // On error, return basic response with security headers
    const errorResponse = NextResponse.next()
    const securityResponse = securityHeaders(request)
    
    securityResponse.headers.forEach((value, key) => {
      errorResponse.headers.set(key, value)
    })
    
    return errorResponse
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
