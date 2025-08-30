import { useEffect, useRef, useState, useCallback } from 'react'
import { PresenceManager, UserPresence, PresenceConfig } from '../presence/PresenceManager'
import { useUser } from '@/lib/auth/hooks/useUser'
import { usePresenceStore } from '@/lib/stores/presenceStore'

interface UsePresenceOptions {
  channelName: string
  autoConnect?: boolean
  autoTrackCursor?: boolean
  autoTrackSelection?: boolean
  heartbeatInterval?: number
}

export function usePresence(options: UsePresenceOptions) {
  const { user } = useUser()
  const managerRef = useRef<PresenceManager | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const {
    presences,
    localPresence,
    setPresences,
    setLocalPresence,
    addPresence,
    removePresence,
    updatePresence,
    clearPresences
  } = usePresenceStore()

  // Initialize presence manager
  useEffect(() => {
    if (!user) return

    const config: PresenceConfig = {
      channelName: options.channelName,
      userId: user.id,
      userData: {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name,
        avatarUrl: user.user_metadata?.avatar_url
      },
      autoTrackCursor: options.autoTrackCursor,
      autoTrackSelection: options.autoTrackSelection,
      heartbeatInterval: options.heartbeatInterval
    }

    managerRef.current = new PresenceManager(config)

    // Subscribe to presence changes
    const unsubscribe = managerRef.current.onPresenceChange((state) => {
      const presenceArray = Array.from(state.values())
      setPresences(presenceArray)
    })

    // Auto-connect if specified
    if (options.autoConnect) {
      connect()
    }

    return () => {
      unsubscribe()
      disconnect()
    }
  }, [user, options.channelName])

  /**
   * Connect to presence channel
   */
  const connect = useCallback(async () => {
    if (!managerRef.current || isConnected) return

    try {
      await managerRef.current.connect()
      setIsConnected(true)
      setError(null)
      
      // Set local presence
      const localPresence = managerRef.current.getLocalPresence()
      if (localPresence) {
        setLocalPresence(localPresence)
      }
    } catch (err) {
      setError(err as Error)
      console.error('Failed to connect to presence channel:', err)
    }
  }, [isConnected, setLocalPresence])

  /**
   * Disconnect from presence channel
   */
  const disconnect = useCallback(async () => {
    if (!managerRef.current || !isConnected) return

    try {
      await managerRef.current.disconnect()
      setIsConnected(false)
      clearPresences()
    } catch (err) {
      setError(err as Error)
      console.error('Failed to disconnect from presence channel:', err)
    }
  }, [isConnected, clearPresences])

  /**
   * Update user status
   */
  const updateStatus = useCallback(async (status: UserPresence['status']) => {
    if (!managerRef.current || !isConnected) return

    try {
      await managerRef.current.updateStatus(status)
      if (localPresence) {
        updatePresence(localPresence.userId, { status })
      }
    } catch (err) {
      setError(err as Error)
      console.error('Failed to update status:', err)
    }
  }, [isConnected, localPresence, updatePresence])

  /**
   * Update current entity
   */
  const updateCurrentEntity = useCallback(async (entity: UserPresence['currentEntity']) => {
    if (!managerRef.current || !isConnected) return

    try {
      await managerRef.current.updateCurrentEntity(entity)
      if (localPresence) {
        updatePresence(localPresence.userId, { currentEntity: entity })
      }
    } catch (err) {
      setError(err as Error)
      console.error('Failed to update current entity:', err)
    }
  }, [isConnected, localPresence, updatePresence])

  /**
   * Update cursor position
   */
  const updateCursor = useCallback(async (cursor: UserPresence['cursor']) => {
    if (!managerRef.current || !isConnected) return

    try {
      await managerRef.current.updateCursor(cursor)
      if (localPresence) {
        updatePresence(localPresence.userId, { cursor })
      }
    } catch (err) {
      setError(err as Error)
      console.error('Failed to update cursor:', err)
    }
  }, [isConnected, localPresence, updatePresence])

  /**
   * Update selection
   */
  const updateSelection = useCallback(async (selection: UserPresence['selection']) => {
    if (!managerRef.current || !isConnected) return

    try {
      await managerRef.current.updateSelection(selection)
      if (localPresence) {
        updatePresence(localPresence.userId, { selection })
      }
    } catch (err) {
      setError(err as Error)
      console.error('Failed to update selection:', err)
    }
  }, [isConnected, localPresence, updatePresence])

  /**
   * Get online users
   */
  const getOnlineUsers = useCallback((): UserPresence[] => {
    return presences.filter(p => p.status === 'online')
  }, [presences])

  /**
   * Get users viewing specific entity
   */
  const getUsersViewingEntity = useCallback((
    entityType: string,
    entityId: string
  ): UserPresence[] => {
    return presences.filter(
      p => p.currentEntity?.type === entityType && p.currentEntity?.id === entityId
    )
  }, [presences])

  /**
   * Get user by ID
   */
  const getUserById = useCallback((userId: string): UserPresence | undefined => {
    return presences.find(p => p.userId === userId)
  }, [presences])

  return {
    // State
    isConnected,
    error,
    presences,
    localPresence,
    
    // Actions
    connect,
    disconnect,
    updateStatus,
    updateCurrentEntity,
    updateCursor,
    updateSelection,
    
    // Getters
    getOnlineUsers,
    getUsersViewingEntity,
    getUserById
  }
}

/**
 * Hook for task-specific presence
 */
export function useTaskPresence(taskId: string, options?: Partial<UsePresenceOptions>) {
  const presence = usePresence({
    channelName: `task:${taskId}`,
    autoConnect: true,
    autoTrackCursor: true,
    autoTrackSelection: true,
    ...options
  })

  // Auto-update current entity on mount
  useEffect(() => {
    if (presence.isConnected) {
      presence.updateCurrentEntity({
        type: 'task',
        id: taskId
      })
    }
  }, [presence.isConnected, taskId])

  return presence
}

/**
 * Hook for project-specific presence
 */
export function useProjectPresence(projectId: string, options?: Partial<UsePresenceOptions>) {
  const presence = usePresence({
    channelName: `project:${projectId}`,
    autoConnect: true,
    autoTrackCursor: false,
    autoTrackSelection: false,
    ...options
  })

  // Auto-update current entity on mount
  useEffect(() => {
    if (presence.isConnected) {
      presence.updateCurrentEntity({
        type: 'project',
        id: projectId
      })
    }
  }, [presence.isConnected, projectId])

  return presence
}

/**
 * Hook for team-wide presence
 */
export function useTeamPresence(teamId: string, options?: Partial<UsePresenceOptions>) {
  const presence = usePresence({
    channelName: `team:${teamId}`,
    autoConnect: true,
    autoTrackCursor: false,
    autoTrackSelection: false,
    heartbeatInterval: 60000, // 1 minute for team-level
    ...options
  })

  return presence
}