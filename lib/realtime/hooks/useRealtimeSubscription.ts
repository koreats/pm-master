'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRealtime } from '../RealtimeProvider'
import { ChannelConfig, RealtimeEvent } from '../types'
import { dashboardKeys } from '@/lib/dashboard/hooks/useDashboardMetrics'
import { goalKeys } from '@/lib/core/hooks/useGoals'
import { projectKeys } from '@/lib/core/hooks/useProjects'
import { taskKeys } from '@/lib/core/hooks/useTasks'

interface UseRealtimeSubscriptionOptions extends Omit<ChannelConfig, 'level' | 'id'> {
  level: 'team' | 'project' | 'task'
  id: string
  onUpdate?: (event: RealtimeEvent) => void
  debounceMs?: number
  autoSubscribe?: boolean
}

/**
 * Enhanced Realtime Subscription Hook
 * Extends the existing dashboard hook with hierarchical channel support
 */
export function useRealtimeSubscription({
  level,
  id,
  options,
  onUpdate,
  debounceMs = 300,
  autoSubscribe = true
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient()
  const { subscribe, unsubscribe, isConnected } = useRealtime()
  const subscriptionRef = useRef<string | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const eventHandlersRef = useRef<Map<string, (event: RealtimeEvent) => void>>(new Map())

  // Debounced query invalidation
  const debouncedInvalidate = useCallback((keys: readonly unknown[]) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: keys })
    }, debounceMs)
  }, [queryClient, debounceMs])

  // Handle realtime events with intelligent query invalidation
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    // Call custom handler if provided
    if (onUpdate) {
      onUpdate(event)
    }

    // Invalidate queries based on event type and table
    switch (event.table) {
      case 'goals':
        if (level === 'team') {
          debouncedInvalidate(goalKeys.list(id))
          debouncedInvalidate(dashboardKeys.metrics(id))
        }
        break
        
      case 'projects':
        if (level === 'team' || level === 'project') {
          debouncedInvalidate(projectKeys.all)
          if (level === 'team') {
            debouncedInvalidate(dashboardKeys.metrics(id))
          }
          if (event.record?.id) {
            debouncedInvalidate(dashboardKeys.projectHealth(event.record.id))
          }
        }
        break
        
      case 'tasks':
        debouncedInvalidate(taskKeys.all)
        if (level === 'team') {
          debouncedInvalidate(dashboardKeys.metrics(id))
        }
        if (event.record?.assigned_to) {
          debouncedInvalidate(dashboardKeys.userPerformance(event.record.assigned_to))
        }
        break
        
      case 'comments':
      case 'activity_logs':
        // Invalidate activity feed
        debouncedInvalidate(['activity', id])
        break
    }

    // Handle presence and broadcast events
    if (event.type === 'PRESENCE' || event.type === 'BROADCAST') {
      // These are handled by the RealtimeProvider
      console.log(`${event.type} event received:`, event.payload)
    }
  }, [level, id, onUpdate, debouncedInvalidate])

  // Subscribe to channel
  const subscribeToChannel = useCallback(async () => {
    if (!isConnected || !autoSubscribe) return

    const channelKey = `collaboration:${level}:${id}`
    
    try {
      const subscription = await subscribe({
        level,
        id,
        options: {
          presence: options?.presence ?? true,
          broadcast: options?.broadcast ?? true,
          postgres_changes: options?.postgres_changes ?? true
        }
      })

      subscriptionRef.current = channelKey

      // Store event handler
      eventHandlersRef.current.set(channelKey, handleRealtimeEvent)

      console.log(`Subscribed to ${channelKey}`)
    } catch (error) {
      console.error(`Failed to subscribe to ${channelKey}:`, error)
    }
  }, [level, id, options, isConnected, autoSubscribe, subscribe, handleRealtimeEvent])

  // Unsubscribe from channel
  const unsubscribeFromChannel = useCallback(async () => {
    if (subscriptionRef.current) {
      await unsubscribe(subscriptionRef.current)
      eventHandlersRef.current.delete(subscriptionRef.current)
      subscriptionRef.current = null
    }
  }, [unsubscribe])

  // Auto-subscribe on mount and when parameters change
  useEffect(() => {
    if (autoSubscribe) {
      subscribeToChannel()
    }

    return () => {
      unsubscribeFromChannel()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [autoSubscribe, subscribeToChannel, unsubscribeFromChannel])

  // Manual refresh function
  const refresh = useCallback(() => {
    switch (level) {
      case 'team':
        queryClient.invalidateQueries({ queryKey: dashboardKeys.metrics(id) })
        queryClient.invalidateQueries({ queryKey: goalKeys.list(id) })
        break
      case 'project':
        queryClient.invalidateQueries({ queryKey: projectKeys.all })
        queryClient.invalidateQueries({ queryKey: taskKeys.all })
        break
      case 'task':
        queryClient.invalidateQueries({ queryKey: taskKeys.all })
        break
    }
  }, [queryClient, level, id])

  return {
    isSubscribed: !!subscriptionRef.current,
    isConnected,
    refresh,
    subscribe: subscribeToChannel,
    unsubscribe: unsubscribeFromChannel
  }
}

/**
 * Team-level realtime subscription
 */
export function useTeamRealtime(teamId: string, options?: Partial<UseRealtimeSubscriptionOptions>) {
  return useRealtimeSubscription({
    level: 'team',
    id: teamId,
    ...options
  })
}

/**
 * Project-level realtime subscription
 */
export function useProjectRealtime(projectId: string, options?: Partial<UseRealtimeSubscriptionOptions>) {
  return useRealtimeSubscription({
    level: 'project',
    id: projectId,
    ...options
  })
}

/**
 * Task-level realtime subscription
 */
export function useTaskRealtime(taskId: string, options?: Partial<UseRealtimeSubscriptionOptions>) {
  return useRealtimeSubscription({
    level: 'task',
    id: taskId,
    ...options
  })
}