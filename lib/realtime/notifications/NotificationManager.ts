import { RealtimeChannel, RealtimePostgresInsertPayload, SupabaseClient } from '@supabase/supabase-js'

export interface ActivityLog {
  id: string
  team_id: string
  user_id: string
  entity_type: 'goal' | 'project' | 'task'
  entity_id: string
  action: string
  metadata?: Record<string, any>
  created_at: string
}

export interface Notification {
  id: string
  activity: ActivityLog
  user?: {
    id: string
    name: string
    avatar_url?: string
  }
  entity?: {
    type: 'goal' | 'project' | 'task'
    id: string
    name: string
  }
  read: boolean
  timestamp: string
}

export interface NotificationConfig {
  channelName: string
  teamId: string
  userId: string
  onNotification?: (notification: Notification) => void
  onError?: (error: Error) => void
  maxNotifications?: number
  enableSound?: boolean
  enableDesktopNotification?: boolean
}

export class NotificationManager {
  private supabase: SupabaseClient
  private channel: RealtimeChannel | null = null
  private config: NotificationConfig
  private notifications: Map<string, Notification> = new Map()
  private listeners: Set<(notifications: Notification[]) => void> = new Set()
  private soundEnabled: boolean = false
  private desktopPermission: NotificationPermission = 'default'

  constructor(supabase: SupabaseClient, config: NotificationConfig) {
    this.supabase = supabase
    this.config = {
      maxNotifications: 100,
      enableSound: false,
      enableDesktopNotification: false,
      ...config
    }
    this.soundEnabled = config.enableSound || false
    
    if (config.enableDesktopNotification && typeof window !== 'undefined') {
      this.requestDesktopPermission()
    }
  }

  async connect(): Promise<void> {
    if (this.channel) {
      await this.disconnect()
    }

    this.channel = this.supabase
      .channel(this.config.channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `team_id=eq.${this.config.teamId}`
        },
        async (payload: RealtimePostgresInsertPayload<ActivityLog>) => {
          await this.handleNewActivity(payload.new)
        }
      )
      .subscribe()

    // Load recent notifications
    await this.loadRecentNotifications()
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel)
      this.channel = null
    }
  }

  private async handleNewActivity(activity: ActivityLog): Promise<void> {
    try {
      // Skip if this is our own activity
      if (activity.user_id === this.config.userId) {
        return
      }

      // Fetch user information
      const { data: userData } = await this.supabase
        .from('users')
        .select('id, name, avatar_url')
        .eq('id', activity.user_id)
        .single()

      // Fetch entity information
      let entityData = null
      if (activity.entity_type && activity.entity_id) {
        const tableName = `${activity.entity_type}s`
        const { data } = await this.supabase
          .from(tableName)
          .select('id, name')
          .eq('id', activity.entity_id)
          .single()
        
        if (data) {
          entityData = {
            type: activity.entity_type,
            id: data.id,
            name: data.name
          }
        }
      }

      const notification: Notification = {
        id: activity.id,
        activity,
        user: userData,
        entity: entityData,
        read: false,
        timestamp: activity.created_at
      }

      // Add to notifications
      this.notifications.set(notification.id, notification)
      
      // Limit notifications
      if (this.notifications.size > (this.config.maxNotifications || 100)) {
        const oldestKey = Array.from(this.notifications.keys())[0]
        this.notifications.delete(oldestKey)
      }

      // Notify listeners
      this.notifyListeners()

      // Call config callback
      if (this.config.onNotification) {
        this.config.onNotification(notification)
      }

      // Play sound if enabled
      if (this.soundEnabled) {
        this.playNotificationSound()
      }

      // Show desktop notification if enabled
      if (this.config.enableDesktopNotification && this.desktopPermission === 'granted') {
        this.showDesktopNotification(notification)
      }
    } catch (error) {
      console.error('Failed to handle activity:', error)
      if (this.config.onError) {
        this.config.onError(error as Error)
      }
    }
  }

  private async loadRecentNotifications(): Promise<void> {
    try {
      const { data: activities, error } = await this.supabase
        .from('activity_logs')
        .select(`
          *,
          user:users!user_id(id, name, avatar_url)
        `)
        .eq('team_id', this.config.teamId)
        .neq('user_id', this.config.userId)
        .order('created_at', { ascending: false })
        .limit(this.config.maxNotifications || 100)

      if (error) throw error

      for (const activity of activities || []) {
        // Fetch entity information
        let entityData = null
        if (activity.entity_type && activity.entity_id) {
          const tableName = `${activity.entity_type}s`
          const { data } = await this.supabase
            .from(tableName)
            .select('id, name')
            .eq('id', activity.entity_id)
            .single()
          
          if (data) {
            entityData = {
              type: activity.entity_type,
              id: data.id,
              name: data.name
            }
          }
        }

        const notification: Notification = {
          id: activity.id,
          activity: {
            id: activity.id,
            team_id: activity.team_id,
            user_id: activity.user_id,
            entity_type: activity.entity_type,
            entity_id: activity.entity_id,
            action: activity.action,
            metadata: activity.metadata,
            created_at: activity.created_at
          },
          user: activity.user,
          entity: entityData,
          read: false,
          timestamp: activity.created_at
        }

        this.notifications.set(notification.id, notification)
      }

      this.notifyListeners()
    } catch (error) {
      console.error('Failed to load recent notifications:', error)
      if (this.config.onError) {
        this.config.onError(error as Error)
      }
    }
  }

  private notifyListeners(): void {
    const notificationArray = Array.from(this.notifications.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    this.listeners.forEach(listener => listener(notificationArray))
  }

  private playNotificationSound(): void {
    if (typeof window === 'undefined') return
    
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  private async requestDesktopPermission(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    
    if (Notification.permission === 'default') {
      this.desktopPermission = await Notification.requestPermission()
    } else {
      this.desktopPermission = Notification.permission
    }
  }

  private showDesktopNotification(notification: Notification): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (this.desktopPermission !== 'granted') return
    
    const title = notification.user?.name || 'Unknown User'
    const body = this.formatNotificationBody(notification)
    const icon = notification.user?.avatar_url || '/favicon.ico'
    
    const desktopNotification = new Notification(title, {
      body,
      icon,
      tag: notification.id,
      requireInteraction: false
    })
    
    desktopNotification.onclick = () => {
      window.focus()
      desktopNotification.close()
      // Mark as read
      this.markAsRead(notification.id)
    }
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      desktopNotification.close()
    }, 5000)
  }

  private formatNotificationBody(notification: Notification): string {
    const action = notification.activity.action
    const entityName = notification.entity?.name || 'item'
    const entityType = notification.entity?.type || 'item'
    
    switch (action) {
      case 'created':
        return `Created new ${entityType}: ${entityName}`
      case 'updated':
        return `Updated ${entityType}: ${entityName}`
      case 'deleted':
        return `Deleted ${entityType}: ${entityName}`
      case 'completed':
        return `Completed ${entityType}: ${entityName}`
      case 'assigned':
        return `Assigned to ${entityType}: ${entityName}`
      case 'commented':
        return `Commented on ${entityType}: ${entityName}`
      default:
        return `${action} ${entityType}: ${entityName}`
    }
  }

  // Public methods
  getNotifications(): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.read).length
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId)
    if (notification) {
      notification.read = true
      this.notifyListeners()
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true
    })
    this.notifyListeners()
  }

  clearNotifications(): void {
    this.notifications.clear()
    this.notifyListeners()
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener)
    // Immediately call with current notifications
    listener(this.getNotifications())
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  enableSound(enabled: boolean): void {
    this.soundEnabled = enabled
  }

  async enableDesktopNotifications(enabled: boolean): Promise<void> {
    this.config.enableDesktopNotification = enabled
    if (enabled) {
      await this.requestDesktopPermission()
    }
  }
}