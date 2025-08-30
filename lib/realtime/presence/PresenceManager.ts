import { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export interface UserPresence {
  userId: string
  user: {
    id: string
    email: string
    name?: string
    avatarUrl?: string
  }
  status: 'online' | 'away' | 'offline'
  lastSeen: string
  currentEntity?: {
    type: 'goal' | 'project' | 'task'
    id: string
    name?: string
  }
  cursor?: {
    x: number
    y: number
    elementId?: string
  }
  selection?: {
    start: number
    end: number
    fieldId?: string
  }
  color: string // User's unique color for cursor/selection
  device?: {
    type: 'desktop' | 'mobile' | 'tablet'
    browser?: string
  }
}

export interface PresenceConfig {
  channelName: string
  userId: string
  userData: UserPresence['user']
  autoTrackCursor?: boolean
  autoTrackSelection?: boolean
  heartbeatInterval?: number
}

export class PresenceManager {
  private channel: RealtimeChannel | null = null
  private supabase = createClient()
  private presenceState: Map<string, UserPresence> = new Map()
  private localPresence: UserPresence | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private cursorTrackingEnabled = false
  private selectionTrackingEnabled = false
  private listeners: Map<string, Set<(state: Map<string, UserPresence>) => void>> = new Map()

  constructor(private config: PresenceConfig) {
    this.localPresence = this.initializeLocalPresence()
    
    if (config.autoTrackCursor) {
      this.enableCursorTracking()
    }
    
    if (config.autoTrackSelection) {
      this.enableSelectionTracking()
    }
  }

  /**
   * Initialize local user presence
   */
  private initializeLocalPresence(): UserPresence {
    return {
      userId: this.config.userId,
      user: this.config.userData,
      status: 'online',
      lastSeen: new Date().toISOString(),
      color: this.generateUserColor(this.config.userId),
      device: this.detectDevice()
    }
  }

  /**
   * Connect to presence channel
   */
  async connect(): Promise<void> {
    if (this.channel) {
      console.warn('Already connected to presence channel')
      return
    }

    this.channel = this.supabase.channel(this.config.channelName, {
      config: {
        presence: {
          key: this.config.userId
        }
      }
    })

    // Track presence state changes
    this.channel.on('presence', { event: 'sync' }, () => {
      this.syncPresenceState()
    })

    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      this.handleUserJoin(key, newPresences)
    })

    this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      this.handleUserLeave(key, leftPresences)
    })

    // Subscribe and track initial presence
    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await this.trackPresence()
        this.startHeartbeat()
      }
    })
  }

  /**
   * Disconnect from presence channel
   */
  async disconnect(): Promise<void> {
    this.stopHeartbeat()
    
    if (this.channel) {
      await this.channel.untrack()
      await this.supabase.removeChannel(this.channel)
      this.channel = null
    }

    this.presenceState.clear()
    this.notifyListeners()
  }

  /**
   * Track user presence
   */
  private async trackPresence(): Promise<void> {
    if (!this.channel || !this.localPresence) return

    await this.channel.track(this.localPresence)
  }

  /**
   * Update local presence
   */
  async updatePresence(updates: Partial<UserPresence>): Promise<void> {
    if (!this.localPresence) return

    this.localPresence = {
      ...this.localPresence,
      ...updates,
      lastSeen: new Date().toISOString()
    }

    await this.trackPresence()
  }

  /**
   * Update user status
   */
  async updateStatus(status: UserPresence['status']): Promise<void> {
    await this.updatePresence({ status })
  }

  /**
   * Update current entity user is viewing/editing
   */
  async updateCurrentEntity(entity: UserPresence['currentEntity']): Promise<void> {
    await this.updatePresence({ currentEntity: entity })
  }

  /**
   * Update cursor position
   */
  async updateCursor(cursor: UserPresence['cursor']): Promise<void> {
    await this.updatePresence({ cursor })
  }

  /**
   * Update text selection
   */
  async updateSelection(selection: UserPresence['selection']): Promise<void> {
    await this.updatePresence({ selection })
  }

  /**
   * Sync presence state from channel
   */
  private syncPresenceState(): void {
    if (!this.channel) return

    const state = this.channel.presenceState()
    this.presenceState.clear()

    Object.entries(state).forEach(([key, presences]) => {
      if (Array.isArray(presences) && presences.length > 0) {
        // Use the most recent presence for each user
        const presence = presences[presences.length - 1] as UserPresence
        this.presenceState.set(key, presence)
      }
    })

    this.notifyListeners()
  }

  /**
   * Handle user join
   */
  private handleUserJoin(key: string, newPresences: any[]): void {
    if (newPresences.length > 0) {
      const presence = newPresences[newPresences.length - 1] as UserPresence
      this.presenceState.set(key, presence)
      this.notifyListeners()
    }
  }

  /**
   * Handle user leave
   */
  private handleUserLeave(key: string, leftPresences: any[]): void {
    this.presenceState.delete(key)
    this.notifyListeners()
  }

  /**
   * Start heartbeat to keep presence alive
   */
  private startHeartbeat(): void {
    const interval = this.config.heartbeatInterval || 30000 // 30 seconds

    this.heartbeatTimer = setInterval(async () => {
      await this.updatePresence({ lastSeen: new Date().toISOString() })
    }, interval)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Enable cursor tracking
   */
  private enableCursorTracking(): void {
    if (this.cursorTrackingEnabled) return

    this.cursorTrackingEnabled = true
    
    // Throttle cursor updates to avoid flooding
    let throttleTimer: NodeJS.Timeout | null = null
    
    document.addEventListener('mousemove', (e) => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          this.updateCursor({
            x: e.clientX,
            y: e.clientY,
            elementId: (e.target as HTMLElement)?.id
          })
          throttleTimer = null
        }, 50) // Update every 50ms max
      }
    })
  }

  /**
   * Enable selection tracking
   */
  private enableSelectionTracking(): void {
    if (this.selectionTrackingEnabled) return

    this.selectionTrackingEnabled = true
    
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection()
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const container = range.commonAncestorContainer
        
        // Find the nearest element with an ID
        let element = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement 
          : container as HTMLElement
          
        while (element && !element.id) {
          element = element.parentElement
        }

        if (element?.id) {
          this.updateSelection({
            start: range.startOffset,
            end: range.endOffset,
            fieldId: element.id
          })
        }
      }
    })
  }

  /**
   * Generate a unique color for a user
   */
  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#FFD93D', // Gold
      '#6C5CE7', // Purple
      '#A8E6CF', // Light Green
    ]

    // Simple hash function to get consistent color for user
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  /**
   * Detect device type
   */
  private detectDevice(): UserPresence['device'] {
    const userAgent = navigator.userAgent.toLowerCase()
    
    let type: UserPresence['device']['type'] = 'desktop'
    if (/mobile/i.test(userAgent)) {
      type = 'mobile'
    } else if (/tablet|ipad/i.test(userAgent)) {
      type = 'tablet'
    }

    let browser: string | undefined
    if (/chrome/i.test(userAgent)) {
      browser = 'Chrome'
    } else if (/firefox/i.test(userAgent)) {
      browser = 'Firefox'
    } else if (/safari/i.test(userAgent)) {
      browser = 'Safari'
    } else if (/edge/i.test(userAgent)) {
      browser = 'Edge'
    }

    return { type, browser }
  }

  /**
   * Subscribe to presence state changes
   */
  onPresenceChange(callback: (state: Map<string, UserPresence>) => void): () => void {
    const listenerId = Math.random().toString(36).substr(2, 9)
    
    if (!this.listeners.has(listenerId)) {
      this.listeners.set(listenerId, new Set())
    }
    
    this.listeners.get(listenerId)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(listenerId)?.delete(callback)
      if (this.listeners.get(listenerId)?.size === 0) {
        this.listeners.delete(listenerId)
      }
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callbacks => {
      callbacks.forEach(callback => {
        callback(this.presenceState)
      })
    })
  }

  /**
   * Get current presence state
   */
  getPresenceState(): Map<string, UserPresence> {
    return new Map(this.presenceState)
  }

  /**
   * Get online users
   */
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.presenceState.values()).filter(
      presence => presence.status === 'online'
    )
  }

  /**
   * Get users viewing specific entity
   */
  getUsersViewingEntity(entityType: string, entityId: string): UserPresence[] {
    return Array.from(this.presenceState.values()).filter(
      presence => 
        presence.currentEntity?.type === entityType &&
        presence.currentEntity?.id === entityId
    )
  }

  /**
   * Get local user presence
   */
  getLocalPresence(): UserPresence | null {
    return this.localPresence
  }
}