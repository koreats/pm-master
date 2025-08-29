'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'

export interface AuthGuardProps {
  children: React.ReactNode
  fallbackUrl?: string
  allowedRoles?: string[]
  requireEmailVerification?: boolean
  requireMfa?: boolean
  loadingComponent?: React.ReactNode
  unauthorizedComponent?: React.ReactNode
}

export function AuthGuard({
  children,
  fallbackUrl = '/auth/login',
  allowedRoles,
  requireEmailVerification = false,
  requireMfa = false,
  loadingComponent,
  unauthorizedComponent,
}: AuthGuardProps) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // Not authenticated
    if (!isAuthenticated || !user) {
      const returnUrl = encodeURIComponent(pathname)
      router.push(`${fallbackUrl}?returnUrl=${returnUrl}`)
      return
    }

    // Check email verification
    if (requireEmailVerification && !user.isEmailVerified()) {
      router.push('/auth/verify-email')
      return
    }

    // Check MFA requirement
    if (requireMfa && !user.isMfaEnabled()) {
      router.push('/auth/setup-mfa')
      return
    }

    // Check if account is locked
    if (user.isLocked()) {
      router.push('/auth/account-locked')
      return
    }

    // Check role requirements
    if (allowedRoles && allowedRoles.length > 0) {
      const userRoles = Array.from(user.getAllRoles().values()).map(role => role.getValue())
      const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role as any))
      
      if (!hasRequiredRole) {
        if (unauthorizedComponent) {
          return
        }
        router.push('/unauthorized')
        return
      }
    }
  }, [
    user,
    isAuthenticated,
    loading,
    pathname,
    fallbackUrl,
    requireEmailVerification,
    requireMfa,
    allowedRoles,
    router,
    unauthorizedComponent,
  ])

  // Show loading state
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  // Account is locked
  if (user.isLocked()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Account Locked</h2>
          <p className="text-gray-600">
            Your account has been locked due to {user.getLockReason() || 'security reasons'}.
          </p>
          {user.getLockedUntil() && (
            <p className="text-sm text-gray-500 mt-2">
              Locked until: {user.getLockedUntil()?.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Email verification required
  if (requireEmailVerification && !user.isEmailVerified()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Email Verification Required</h2>
          <p className="text-gray-600">
            Please verify your email address to continue.
          </p>
        </div>
      </div>
    )
  }

  // MFA required
  if (requireMfa && !user.isMfaEnabled()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Two-Factor Authentication Required</h2>
          <p className="text-gray-600">
            Please set up two-factor authentication to continue.
          </p>
        </div>
      </div>
    )
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = Array.from(user.getAllRoles().values()).map(role => role.getValue())
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role as any))
    
    if (!hasRequiredRole) {
      if (unauthorizedComponent) {
        return <>{unauthorizedComponent}</>
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Unauthorized</h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    }
  }

  // All checks passed
  return <>{children}</>
}