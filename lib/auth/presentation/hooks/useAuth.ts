'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '../../domain/entities/User'
import { SupabaseAuthService } from '../../infrastructure/services/SupabaseAuthService'
import { createClient } from '@/lib/supabase/client'
import { CSRFProtection } from '../../infrastructure/security/CSRFProtection'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  csrfToken: string | null
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  verifyMfa: (code: string, sessionId: string) => Promise<{ success: boolean; error?: string }>
  refreshSession: () => Promise<void>
  clearError: () => void
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    csrfToken: null,
  })

  const router = useRouter()
  const authService = new SupabaseAuthService()
  const supabase = createClient()

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }))
        
        // Get current user
        const currentUser = await authService.getCurrentUser()
        
        // Generate CSRF token for forms
        const csrfToken = crypto.randomUUID() // Simplified for client-side
        
        setState({
          user: currentUser,
          isAuthenticated: !!currentUser,
          loading: false,
          error: null,
          csrfToken,
        })
      } catch (error) {
        console.error('Auth initialization error:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to initialize authentication',
        }))
      }
    }

    initAuth()

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const currentUser = await authService.getCurrentUser()
        setState(prev => ({
          ...prev,
          user: currentUser,
          isAuthenticated: true,
          error: null,
        }))
      } else if (event === 'SIGNED_OUT') {
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
        }))
        router.push('/auth/login')
      } else if (event === 'TOKEN_REFRESHED') {
        const currentUser = await authService.getCurrentUser()
        setState(prev => ({
          ...prev,
          user: currentUser,
        }))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      // Get client info for logging
      const ipAddress = 'client-ip' // Would be obtained from request headers in real app
      const userAgent = navigator.userAgent
      
      const result = await authService.signIn(
        { email, password },
        ipAddress,
        userAgent
      )
      
      if (result.success && result.user) {
        setState(prev => ({
          ...prev,
          user: result.user || null,
          isAuthenticated: true,
          loading: false,
          error: null,
        }))
        
        router.push('/dashboard')
        return { success: true }
      } else if (result.requiresMfa) {
        setState(prev => ({ ...prev, loading: false }))
        return { 
          success: false, 
          error: 'MFA_REQUIRED',
          mfaSessionId: result.mfaSessionId,
        } as any
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Authentication failed',
        }))
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      return { success: false, error: errorMessage }
    }
  }, [router])

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const ipAddress = 'client-ip' // Would be obtained from request headers
      const userAgent = navigator.userAgent
      
      const result = await authService.signUp(
        { email, password, name },
        ipAddress,
        userAgent
      )
      
      if (result.success && result.user) {
        setState(prev => ({
          ...prev,
          user: result.user || null,
          isAuthenticated: true,
          loading: false,
          error: null,
        }))
        
        router.push('/dashboard')
        return { success: true }
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Sign up failed',
        }))
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      return { success: false, error: errorMessage }
    }
  }, [router])

  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      await authService.signOut()
      
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        csrfToken: null,
      })
      
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Sign out failed',
      }))
    }
  }, [router])

  const resetPassword = useCallback(async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const result = await authService.resetPassword(email)
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: result.success ? null : result.error || null,
      }))
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const result = await authService.updatePassword(newPassword)
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: result.success ? null : result.error || null,
      }))
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  const verifyMfa = useCallback(async (code: string, sessionId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const result = await authService.verifyMfaCode(code, sessionId)
      
      if (result.success && result.user) {
        setState(prev => ({
          ...prev,
          user: result.user || null,
          isAuthenticated: true,
          loading: false,
          error: null,
        }))
        
        router.push('/dashboard')
        return { success: true }
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'MFA verification failed',
        }))
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MFA verification failed'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      return { success: false, error: errorMessage }
    }
  }, [router])

  const refreshSession = useCallback(async () => {
    try {
      const result = await authService.refreshSession()
      if (!result.success) {
        throw new Error(result.error || 'Session refresh failed')
      }
      
      const currentUser = await authService.getCurrentUser()
      setState(prev => ({
        ...prev,
        user: currentUser,
        isAuthenticated: !!currentUser,
      }))
    } catch (error) {
      console.error('Session refresh error:', error)
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: 'Session expired',
      }))
      router.push('/auth/login')
    }
  }, [router])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    verifyMfa,
    refreshSession,
    clearError,
  }
}