import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import { ChannelConfig, ChannelSubscription, ChannelLevel, RealtimeEvent } from '../types'

export class ChannelManager {
  private supabase: SupabaseClient
  private channels: Map<string, ChannelSubscription>
  private eventHandlers: Map<string, Set<(event: RealtimeEvent) => void>>
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
    this.channels = new Map()
    this.eventHandlers = new Map()
  }

  private getChannelKey(level: ChannelLevel, id: string): string {
    return `collaboration:${level}:${id}`
  }

  async subscribe(config: ChannelConfig): Promise<ChannelSubscription> {
    const channelKey = this.getChannelKey(config.level, config.id)
    
    // Return existing subscription if already subscribed
    if (this.channels.has(channelKey)) {
      return this.channels.get(channelKey)!
    }

    const channel = this.supabase.channel(channelKey, {
      config: {
        broadcast: {
          self: false,
          ack: true
        },
        presence: {
          key: config.id
        }
      }
    })

    // Configure postgres changes if needed
    if (config.options?.postgres_changes !== false) {
      this.setupPostgresChanges(channel, config)
    }

    // Configure presence if needed
    if (config.options?.presence) {
      this.setupPresence(channel, config)
    }

    // Configure broadcast if needed
    if (config.options?.broadcast) {
      this.setupBroadcast(channel, config)
    }

    // Subscribe to channel
    const subscription = await new Promise<ChannelSubscription>((resolve, reject) => {
      channel
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Channel ${channelKey} subscribed successfully`)
            const sub: ChannelSubscription = {
              channel,
              level: config.level,
              id: config.id,
              unsubscribe: async () => {
                await this.unsubscribe(channelKey)
              }
            }
            this.channels.set(channelKey, sub)
            resolve(sub)
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Channel ${channelKey} subscription error`)
            reject(new Error(`Failed to subscribe to channel ${channelKey}`))
          } else if (status === 'TIMED_OUT') {
            console.warn(`Channel ${channelKey} subscription timeout`)
            this.handleReconnect(config)
          }
        })
    })

    return subscription
  }

  private setupPostgresChanges(channel: RealtimeChannel, config: ChannelConfig) {
    const tables = this.getTablesForLevel(config.level)
    
    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: this.getFilterForLevel(config.level, config.id, table)
        },
        (payload) => {
          this.handlePostgresChange(config, payload)
        }
      )
    })
  }

  private setupPresence(channel: RealtimeChannel, config: ChannelConfig) {
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        this.emitEvent(this.getChannelKey(config.level, config.id), {
          type: 'PRESENCE',
          payload: state
        })
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.emitEvent(this.getChannelKey(config.level, config.id), {
          type: 'PRESENCE',
          payload: { event: 'join', key, presences: newPresences }
        })
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.emitEvent(this.getChannelKey(config.level, config.id), {
          type: 'PRESENCE',
          payload: { event: 'leave', key, presences: leftPresences }
        })
      })
  }

  private setupBroadcast(channel: RealtimeChannel, config: ChannelConfig) {
    channel.on('broadcast', { event: '*' }, (payload) => {
      this.emitEvent(this.getChannelKey(config.level, config.id), {
        type: 'BROADCAST',
        payload: payload
      })
    })
  }

  private getTablesForLevel(level: ChannelLevel): string[] {
    switch (level) {
      case 'team':
        return ['goals', 'projects', 'tasks', 'comments', 'activity_logs']
      case 'project':
        return ['projects', 'tasks', 'comments']
      case 'task':
        return ['tasks', 'comments']
      default:
        return []
    }
  }

  private getFilterForLevel(level: ChannelLevel, id: string, table: string): string | undefined {
    switch (level) {
      case 'team':
        if (table === 'goals' || table === 'activity_logs') {
          return `team_id=eq.${id}`
        }
        return undefined
      case 'project':
        if (table === 'projects') {
          return `id=eq.${id}`
        }
        if (table === 'tasks' || table === 'comments') {
          return `project_id=eq.${id}`
        }
        return undefined
      case 'task':
        if (table === 'tasks') {
          return `id=eq.${id}`
        }
        if (table === 'comments') {
          return `task_id=eq.${id}`
        }
        return undefined
      default:
        return undefined
    }
  }

  private handlePostgresChange(config: ChannelConfig, payload: any) {
    const event: RealtimeEvent = {
      type: payload.eventType,
      table: payload.table,
      record: payload.new,
      old_record: payload.old,
      user: payload.new?.user_id || payload.old?.user_id
    }
    
    this.emitEvent(this.getChannelKey(config.level, config.id), event)
  }

  private emitEvent(channelKey: string, event: RealtimeEvent) {
    const handlers = this.eventHandlers.get(channelKey)
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
  }

  onChannelEvent(channelKey: string, handler: (event: RealtimeEvent) => void) {
    if (!this.eventHandlers.has(channelKey)) {
      this.eventHandlers.set(channelKey, new Set())
    }
    this.eventHandlers.get(channelKey)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(channelKey)
      if (handlers) {
        handlers.delete(handler)
      }
    }
  }

  async unsubscribe(channelKey: string): Promise<void> {
    const subscription = this.channels.get(channelKey)
    if (subscription) {
      await this.supabase.removeChannel(subscription.channel)
      this.channels.delete(channelKey)
      this.eventHandlers.delete(channelKey)
      console.log(`Channel ${channelKey} unsubscribed`)
    }
  }

  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.channels.keys()).map(key => 
      this.unsubscribe(key)
    )
    await Promise.all(unsubscribePromises)
  }

  async broadcast(channelKey: string, event: string, payload: any): Promise<void> {
    const subscription = this.channels.get(channelKey)
    if (subscription) {
      await subscription.channel.send({
        type: 'broadcast',
        event,
        payload
      })
    }
  }

  async updatePresence(channelKey: string, state: any): Promise<void> {
    const subscription = this.channels.get(channelKey)
    if (subscription) {
      await subscription.channel.track(state)
    }
  }

  private async handleReconnect(config: ChannelConfig): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for channel ${this.getChannelKey(config.level, config.id)}`)
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect channel in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      await this.subscribe(config)
      this.reconnectAttempts = 0
    } catch (error) {
      console.error('Reconnection failed:', error)
      await this.handleReconnect(config)
    }
  }

  getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }

  isChannelSubscribed(channelKey: string): boolean {
    return this.channels.has(channelKey)
  }
}