'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { dashboardKeys } from './useDashboardMetrics'
import { goalKeys } from '@/lib/core/hooks/useGoals'
import { projectKeys } from '@/lib/core/hooks/useProjects'
import { taskKeys } from '@/lib/core/hooks/useTasks'

interface RealtimeEvent {
  table: string
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  record: any
  old_record?: any
}

interface RealtimeOptions {
  teamId?: string
  userId?: string
  onUpdate?: (event: RealtimeEvent) => void
  debounceMs?: number
}

/**
 * Supabase Realtime 구독 Hook
 * 대시보드 데이터 실시간 업데이트
 */
export function useRealtimeSubscription({
  teamId,
  userId,
  onUpdate,
  debounceMs = 300
}: RealtimeOptions) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  
  // Debounced 업데이트 함수
  const debouncedInvalidate = useCallback((keys: readonly unknown[]) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: keys })
    }, debounceMs)
  }, [queryClient, debounceMs])
  
  // 이벤트 핸들러
  const handleRealtimeEvent = useCallback((payload: any) => {
    const event: RealtimeEvent = {
      table: payload.table,
      type: payload.eventType,
      record: payload.new,
      old_record: payload.old
    }
    
    // 커스텀 핸들러 실행
    if (onUpdate) {
      onUpdate(event)
    }
    
    // 테이블별 쿼리 무효화
    switch (event.table) {
      case 'goals':
        if (teamId) {
          debouncedInvalidate(goalKeys.list(teamId))
          debouncedInvalidate(dashboardKeys.metrics(teamId))
        }
        break
        
      case 'projects':
        if (teamId) {
          debouncedInvalidate(projectKeys.all)
          debouncedInvalidate(dashboardKeys.metrics(teamId))
          
          // 프로젝트 건강도 업데이트
          if (event.record?.id) {
            debouncedInvalidate(dashboardKeys.projectHealth(event.record.id))
          }
        }
        break
        
      case 'tasks':
        if (teamId) {
          debouncedInvalidate(taskKeys.all)
          debouncedInvalidate(dashboardKeys.metrics(teamId))
        }
        if (userId) {
          debouncedInvalidate(dashboardKeys.userPerformance(userId))
        }
        break
        
      case 'comments':
      case 'activity_logs':
        // 활동 피드 업데이트
        if (teamId) {
          debouncedInvalidate(['activity', teamId])
        }
        break
    }
  }, [teamId, userId, onUpdate, debouncedInvalidate])
  
  useEffect(() => {
    if (!teamId) return
    
    // Realtime 채널 생성
    const channel = supabase
      .channel(`dashboard:${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `team_id=eq.${teamId}`
        },
        handleRealtimeEvent
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        handleRealtimeEvent
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        handleRealtimeEvent
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs',
          filter: `team_id=eq.${teamId}`
        },
        handleRealtimeEvent
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Dashboard realtime subscription active')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Dashboard realtime subscription error')
        } else if (status === 'TIMED_OUT') {
          console.warn('Dashboard realtime subscription timeout')
        }
      })
    
    channelRef.current = channel
    
    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [teamId, userId, supabase, handleRealtimeEvent])
  
  // 수동 새로고침 함수
  const refresh = useCallback(() => {
    if (teamId) {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.metrics(teamId) })
    }
    if (userId) {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.userPerformance(userId) })
    }
  }, [queryClient, teamId, userId])
  
  return {
    isSubscribed: !!channelRef.current,
    refresh
  }
}

/**
 * 낙관적 업데이트를 위한 Hook
 * UI 즉각 반영 후 서버 동기화
 */
export function useOptimisticUpdate() {
  const queryClient = useQueryClient()
  
  const optimisticUpdate = useCallback(<T,>(
    queryKey: readonly unknown[],
    updater: (old: T) => T
  ) => {
    // 이전 데이터 백업
    const previousData = queryClient.getQueryData<T>(queryKey)
    
    // 낙관적 업데이트
    queryClient.setQueryData(queryKey, updater)
    
    // 롤백 함수 반환
    return () => {
      queryClient.setQueryData(queryKey, previousData)
    }
  }, [queryClient])
  
  return optimisticUpdate
}