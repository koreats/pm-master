'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/auth/hooks/useUser'
import { ChannelManager } from './channels/ChannelManager'
import {
  RealtimeContextValue,
  ChannelConfig,
  ChannelSubscription,
  PresenceState,
  RealtimeEvent
} from './types'

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

interface RealtimeProviderProps {
  children: React.ReactNode
  teamId?: string
}

export function RealtimeProvider({ children, teamId }: RealtimeProviderProps) {
  const supabase = createClient()
  const { user } = useUser()
  const [isConnected, setIsConnected] = useState(false)
  const [subscriptions] = useState(new Map<string, ChannelSubscription>())
  const [presence] = useState(new Map<string, PresenceState>())
  const channelManagerRef = useRef<ChannelManager | null>(null)
  const presenceUpdateTimerRef = useRef<NodeJS.Timeout>()

  // Initialize channel manager
  useEffect(() => {
    if (!channelManagerRef.current) {
      channelManagerRef.current = new ChannelManager(supabase)
      setIsConnected(true)
    }

    return () => {
      if (channelManagerRef.current) {
        channelManagerRef.current.unsubscribeAll()
        channelManagerRef.current = null
        setIsConnected(false)
      }
    }
  }, [supabase])

  // Subscribe to a channel
  const subscribe = useCallback(async (config: ChannelConfig): Promise<ChannelSubscription> => {
    if (!channelManagerRef.current) {
      throw new Error('Channel manager not initialized')
    }

    try {
      const subscription = await channelManagerRef.current.subscribe(config)
      const channelKey = `collaboration:${config.level}:${config.id}`
      subscriptions.set(channelKey, subscription)

      // Set up event handler for this channel
      const unsubscribeHandler = channelManagerRef.current.onChannelEvent(
        channelKey,
        (event: RealtimeEvent) => {
          handleRealtimeEvent(event, channelKey)
        }
      )

      // Store the handler cleanup in the subscription
      const originalUnsubscribe = subscription.unsubscribe
      subscription.unsubscribe = async () => {
        unsubscribeHandler()
        await originalUnsubscribe()
        subscriptions.delete(channelKey)
      }

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to channel:', error)
      throw error
    }
  }, [subscriptions])

  // Unsubscribe from a channel
  const unsubscribe = useCallback(async (channelKey: string) => {
    const subscription = subscriptions.get(channelKey)
    if (subscription) {
      await subscription.unsubscribe()
      subscriptions.delete(channelKey)
    }
  }, [subscriptions])

  // Unsubscribe from all channels
  const unsubscribeAll = useCallback(async () => {
    if (channelManagerRef.current) {
      await channelManagerRef.current.unsubscribeAll()
      subscriptions.clear()
      presence.clear()
    }
  }, [subscriptions, presence])

  // Broadcast an event
  const broadcast = useCallback(async (channel: string, event: string, payload: any) => {
    if (channelManagerRef.current) {
      await channelManagerRef.current.broadcast(channel, event, payload)
    }
  }, [])

  // Update user presence
  const updatePresence = useCallback((state: Partial<PresenceState>) => {
    if (!user) return

    const newState: PresenceState = {
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.name || 'Anonymous',
      avatar: user.user_metadata?.avatar_url,
      status: state.status || 'online',
      lastSeen: new Date(),
      ...state
    }

    // Update presence for all active channels
    subscriptions.forEach((_, channelKey) => {
      if (channelManagerRef.current) {
        channelManagerRef.current.updatePresence(channelKey, newState)
      }
    })

    // Update local presence state
    presence.set(user.id, newState)

    // Debounce presence updates
    if (presenceUpdateTimerRef.current) {
      clearTimeout(presenceUpdateTimerRef.current)
    }
    presenceUpdateTimerRef.current = setTimeout(() => {
      // Additional presence update logic if needed
    }, 1000)
  }, [user, subscriptions, presence])

  // Handle realtime events
  const handleRealtimeEvent = useCallback((event: RealtimeEvent, channelKey: string) => {
    switch (event.type) {
      case 'PRESENCE':
        handlePresenceEvent(event.payload)
        break
      case 'INSERT':
      case 'UPDATE':
      case 'DELETE':
        // These events will be handled by specific hooks
        console.log(`Realtime ${event.type} event on ${channelKey}:`, event)
        break
      case 'BROADCAST':
        // Handle broadcast events
        console.log(`Broadcast event on ${channelKey}:`, event.payload)
        break
    }
  }, [])

  // Handle presence events
  const handlePresenceEvent = useCallback((payload: any) => {
    if (payload.event === 'sync') {
      // Sync all presence states
      Object.entries(payload).forEach(([key, value]: [string, any]) => {
        if (key !== 'event') {
          presence.set(key, value as PresenceState)
        }
      })
    } else if (payload.event === 'join') {
      // User joined
      payload.presences.forEach((p: PresenceState) => {
        presence.set(p.userId, p)
      })
    } else if (payload.event === 'leave') {
      // User left
      payload.presences.forEach((p: PresenceState) => {
        presence.delete(p.userId)
      })
    }
  }, [presence])

  // Reconnect to channels
  const reconnect = useCallback(async () => {
    if (channelManagerRef.current) {
      setIsConnected(false)
      await channelManagerRef.current.unsubscribeAll()
      channelManagerRef.current = new ChannelManager(supabase)
      setIsConnected(true)
    }
  }, [supabase])

  // Auto-subscribe to team channel if teamId is provided
  useEffect(() => {
    if (teamId && user && isConnected) {
      subscribe({
        level: 'team',
        id: teamId,
        options: {
          presence: true,
          broadcast: true,
          postgres_changes: true
        }
      })
    }
  }, [teamId, user, isConnected, subscribe])

  // Update presence on mount and periodically
  useEffect(() => {
    if (user && isConnected) {
      updatePresence({ status: 'online' })

      const interval = setInterval(() => {
        updatePresence({ status: 'online' })
      }, 30000) // Every 30 seconds

      // Set status to away on window blur
      const handleBlur = () => updatePresence({ status: 'away' })
      const handleFocus = () => updatePresence({ status: 'online' })
      
      window.addEventListener('blur', handleBlur)
      window.addEventListener('focus', handleFocus)

      return () => {
        clearInterval(interval)
        window.removeEventListener('blur', handleBlur)
        window.removeEventListener('focus', handleFocus)
        updatePresence({ status: 'offline' })
      }
    }
  }, [user, isConnected, updatePresence])

  const contextValue: RealtimeContextValue = {
    subscriptions,
    presence,
    subscribe,
    unsubscribe,
    unsubscribeAll,
    broadcast,
    updatePresence,
    isConnected,
    reconnect
  }

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}