'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Session } from '../../domain/entities/Session'
import { SessionRepository } from '../../infrastructure/repositories/SessionRepository'
import { useAuth } from './useAuth'

export interface SessionState {
  session: Session | null
  isActive: boolean
  expiresIn: number | null // milliseconds
  idleTime: number | null // milliseconds
  shouldRefresh: boolean
  deviceInfo: {
    fingerprint: string
    ipAddress: string
    userAgent: string
  } | null
}

export interface SessionActions {
  extendSession: () => Promise<void>
  revokeSession: () => Promise<void>
  revokeAllSessions: () => Promise<void>
  checkSessionHealth: () => Promise<boolean>
  updateActivity: () => void
}

export function useSession(): SessionState & SessionActions {
  const [state, setState] = useState<SessionState>({
    session: null,
    isActive: false,
    expiresIn: null,
    idleTime: null,
    shouldRefresh: false,
    deviceInfo: null,
  })

  const { user, refreshSession } = useAuth()
  const router = useRouter()
  const sessionRepository = new SessionRepository()
  const activityTimerRef = useRef<NodeJS.Timeout>()
  const refreshTimerRef = useRef<NodeJS.Timeout>()
  const lastActivityRef = useRef<Date>(new Date())

  // Generate device fingerprint
  const getDeviceFingerprint = useCallback((): string => {
    // Simplified fingerprinting - in production, use a library like FingerprintJS
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('fingerprint', 2, 2)
    }
    
    const data = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width,
      screen.height,
      screen.colorDepth,
    ].join('|')
    
    return btoa(data).substring(0, 32)
  }, [])

  // Get client IP (would need server-side implementation in production)
  const getClientIp = useCallback((): string => {
    // In production, this would come from the server
    return '0.0.0.0'
  }, [])

  // Initialize session
  useEffect(() => {
    if (!user) {
      setState({
        session: null,
        isActive: false,
        expiresIn: null,
        idleTime: null,
        shouldRefresh: false,
        deviceInfo: null,
      })
      return
    }

    const initSession = async () => {
      try {
        // Create new session
        const session = Session.create({
          userId: user.getId(),
          deviceFingerprint: getDeviceFingerprint(),
          ipAddress: getClientIp(),
          userAgent: navigator.userAgent,
        })

        // Save session
        await sessionRepository.save(session)

        const deviceInfo = {
          fingerprint: session.getDeviceFingerprint() || '',
          ipAddress: session.getIpAddress() || '0.0.0.0',
          userAgent: session.getUserAgent() || '',
        }

        setState({
          session,
          isActive: true,
          expiresIn: session.getRemainingTime(),
          idleTime: 0,
          shouldRefresh: false,
          deviceInfo,
        })

        lastActivityRef.current = new Date()
      } catch (error) {
        console.error('Session initialization error:', error)
      }
    }

    initSession()
  }, [user])

  // Monitor session health
  useEffect(() => {
    if (!state.session || !state.isActive) return

    const checkSession = () => {
      const now = new Date()
      const idleTime = now.getTime() - lastActivityRef.current.getTime()
      const remainingTime = state.session!.getRemainingTime()
      const shouldRefresh = state.session!.shouldRefresh()

      setState(prev => ({
        ...prev,
        idleTime,
        expiresIn: remainingTime,
        shouldRefresh,
      }))

      // Check if session expired
      if (!state.session!.isValid()) {
        handleSessionExpired()
      }
      // Auto-refresh if needed
      else if (shouldRefresh) {
        refreshSession()
      }
      // Warn user if session is about to expire
      else if (remainingTime < 60000) { // Less than 1 minute
        console.warn('Session expiring soon')
      }
    }

    activityTimerRef.current = setInterval(checkSession, 10000) // Check every 10 seconds

    return () => {
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current)
      }
    }
  }, [state.session, state.isActive])

  const handleSessionExpired = useCallback(() => {
    setState({
      session: null,
      isActive: false,
      expiresIn: null,
      idleTime: null,
      shouldRefresh: false,
      deviceInfo: null,
    })
    
    router.push('/auth/login?reason=session_expired')
  }, [router])

  const updateActivity = useCallback(() => {
    lastActivityRef.current = new Date()
    
    if (state.session && state.session.isValid()) {
      try {
        state.session.updateActivity()
        sessionRepository.update(state.session)
        
        setState(prev => ({
          ...prev,
          idleTime: 0,
          expiresIn: state.session!.getRemainingTime(),
        }))
      } catch (error) {
        console.error('Failed to update activity:', error)
      }
    }
  }, [state.session])

  const extendSession = useCallback(async () => {
    if (!state.session || !state.session.isValid()) {
      throw new Error('No valid session to extend')
    }

    try {
      state.session.extend()
      await sessionRepository.update(state.session)
      
      setState(prev => ({
        ...prev,
        expiresIn: state.session!.getRemainingTime(),
        shouldRefresh: false,
      }))
    } catch (error) {
      console.error('Failed to extend session:', error)
      throw error
    }
  }, [state.session])

  const revokeSession = useCallback(async () => {
    if (!state.session) return

    try {
      await sessionRepository.revoke(state.session.getId())
      
      setState({
        session: null,
        isActive: false,
        expiresIn: null,
        idleTime: null,
        shouldRefresh: false,
        deviceInfo: null,
      })
      
      router.push('/auth/login')
    } catch (error) {
      console.error('Failed to revoke session:', error)
      throw error
    }
  }, [state.session, router])

  const revokeAllSessions = useCallback(async () => {
    if (!user) return

    try {
      await sessionRepository.revokeAllForUser(user.getId())
      
      setState({
        session: null,
        isActive: false,
        expiresIn: null,
        idleTime: null,
        shouldRefresh: false,
        deviceInfo: null,
      })
      
      router.push('/auth/login')
    } catch (error) {
      console.error('Failed to revoke all sessions:', error)
      throw error
    }
  }, [user, router])

  const checkSessionHealth = useCallback(async (): Promise<boolean> => {
    if (!state.session) return false

    try {
      const session = await sessionRepository.findById(state.session.getId())
      
      if (!session || !session.isValid()) {
        handleSessionExpired()
        return false
      }

      // Check if session is from same device
      const currentFingerprint = getDeviceFingerprint()
      if (!session.isFromSameDevice(currentFingerprint)) {
        console.warn('Session device mismatch')
        // Could trigger additional security checks here
      }

      return true
    } catch (error) {
      console.error('Session health check failed:', error)
      return false
    }
  }, [state.session, handleSessionExpired])

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    
    const handleActivity = () => {
      updateActivity()
    }

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [updateActivity])

  // Monitor page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause activity tracking
        if (activityTimerRef.current) {
          clearInterval(activityTimerRef.current)
        }
      } else {
        // Page is visible, resume activity tracking and check session
        updateActivity()
        checkSessionHealth()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [updateActivity, checkSessionHealth])

  return {
    ...state,
    extendSession,
    revokeSession,
    revokeAllSessions,
    checkSessionHealth,
    updateActivity,
  }
}