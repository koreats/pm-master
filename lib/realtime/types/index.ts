import { RealtimeChannel, RealtimePresence } from '@supabase/supabase-js'

export type ChannelLevel = 'team' | 'project' | 'task'

export interface ChannelConfig {
  level: ChannelLevel
  id: string
  options?: {
    presence?: boolean
    broadcast?: boolean
    postgres_changes?: boolean
  }
}

export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'BROADCAST' | 'PRESENCE'
  table?: string
  record?: any
  old_record?: any
  payload?: any
  user?: string
}

export interface PresenceState {
  userId: string
  email?: string
  name?: string
  avatar?: string
  status: 'online' | 'away' | 'offline'
  lastSeen: Date
  currentView?: string
  currentEntity?: {
    type: 'goal' | 'project' | 'task'
    id: string
  }
  cursor?: {
    x: number
    y: number
  }
  selection?: {
    entityId: string
    field?: string
  }
}

export interface ChannelSubscription {
  channel: RealtimeChannel
  level: ChannelLevel
  id: string
  unsubscribe: () => Promise<void>
}

export interface RealtimeContextValue {
  subscriptions: Map<string, ChannelSubscription>
  presence: Map<string, PresenceState>
  subscribe: (config: ChannelConfig) => Promise<ChannelSubscription>
  unsubscribe: (channelKey: string) => Promise<void>
  unsubscribeAll: () => Promise<void>
  broadcast: (channel: string, event: string, payload: any) => Promise<void>
  updatePresence: (state: Partial<PresenceState>) => void
  isConnected: boolean
  reconnect: () => Promise<void>
}

export interface OptimisticUpdate<T = any> {
  id: string
  timestamp: number
  operation: 'create' | 'update' | 'delete'
  entity: 'goal' | 'project' | 'task'
  data: T
  rollback: () => void
  status: 'pending' | 'success' | 'failed'
}

export interface ConflictResolution {
  strategy: 'last-write-wins' | 'merge' | 'manual'
  resolve: (local: any, remote: any) => any
}