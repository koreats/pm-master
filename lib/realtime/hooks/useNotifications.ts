import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationManager, Notification, NotificationConfig } from '../notifications/NotificationManager'
import { useUser } from '@/lib/auth/hooks/useUser'

export interface UseNotificationsOptions {
  enabled?: boolean
  enableSound?: boolean
  enableDesktopNotification?: boolean
  maxNotifications?: number
  onNotification?: (notification: Notification) => void
  onError?: (error: Error) => void
}

export function useNotifications(teamId: string, options: UseNotificationsOptions = {}) {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [manager, setManager] = useState<NotificationManager | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Initialize notification manager
  useEffect(() => {
    if (!user?.id || !teamId || !options.enabled) return

    const config: NotificationConfig = {
      channelName: `notifications:${teamId}`,
      teamId,
      userId: user.id,
      maxNotifications: options.maxNotifications || 100,
      enableSound: options.enableSound || false,
      enableDesktopNotification: options.enableDesktopNotification || false,
      onNotification: (notification) => {
        if (options.onNotification) {
          options.onNotification(notification)
        }
      },
      onError: (error) => {
        setError(error)
        if (options.onError) {
          options.onError(error)
        }
      }
    }

    const notificationManager = new NotificationManager(supabase, config)
    setManager(notificationManager)

    // Connect and subscribe
    notificationManager.connect()
      .then(() => {
        setIsConnected(true)
        setError(null)
      })
      .catch((err) => {
        setError(err)
        setIsConnected(false)
      })

    // Subscribe to notifications
    const unsubscribe = notificationManager.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications)
    })

    return () => {
      unsubscribe()
      notificationManager.disconnect()
      setIsConnected(false)
    }
  }, [user?.id, teamId, options.enabled, supabase])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    if (!manager) return
    manager.markAsRead(notificationId)
  }, [manager])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    if (!manager) return
    manager.markAllAsRead()
  }, [manager])

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    if (!manager) return
    manager.clearNotifications()
  }, [manager])

  // Enable/disable sound
  const setSound = useCallback((enabled: boolean) => {
    if (!manager) return
    manager.enableSound(enabled)
  }, [manager])

  // Enable/disable desktop notifications
  const setDesktopNotifications = useCallback(async (enabled: boolean) => {
    if (!manager) return
    await manager.enableDesktopNotifications(enabled)
  }, [manager])

  // Get unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length
  }, [notifications])

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {}
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    notifications.forEach(notification => {
      const date = new Date(notification.timestamp)
      let group: string

      if (date >= today) {
        group = 'Today'
      } else if (date >= yesterday) {
        group = 'Yesterday'
      } else if (date >= weekAgo) {
        group = 'This Week'
      } else {
        group = 'Older'
      }

      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(notification)
    })

    return groups
  }, [notifications])

  return {
    notifications,
    groupedNotifications,
    unreadCount,
    isConnected,
    error,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    setSound,
    setDesktopNotifications
  }
}

// Hook for creating activity logs
export function useActivityLog() {
  const { user } = useUser()
  const supabase = useMemo(() => createClient(), [])

  const logActivity = useCallback(async (
    teamId: string,
    entityType: 'goal' | 'project' | 'task',
    entityId: string,
    action: string,
    metadata?: Record<string, any>
  ) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          team_id: teamId,
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          action,
          metadata
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }, [user?.id, supabase])

  return { logActivity }
}