'use client'

import { useQuery } from '@tanstack/react-query'
import { MetricsService } from '@/lib/core/services/MetricsService'
import { useAuth } from '@/lib/auth/hooks/useAuth'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: (teamId: string) => [...dashboardKeys.all, 'metrics', teamId] as const,
  userPerformance: (userId: string) => [...dashboardKeys.all, 'performance', userId] as const,
  projectHealth: (projectId: string) => [...dashboardKeys.all, 'health', projectId] as const,
}

/**
 * 팀 대시보드 메트릭 Hook
 * MetricsService를 통해 종합 대시보드 데이터를 가져옴
 */
export function useDashboardMetrics(teamId?: string) {
  const metricsService = new MetricsService()
  
  return useQuery({
    queryKey: dashboardKeys.metrics(teamId || ''),
    queryFn: async () => {
      if (!teamId) {
        throw new Error('Team ID is required')
      }
      
      try {
        const metrics = await metricsService.getDashboardMetrics(teamId)
        return metrics
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error)
        throw error
      }
    },
    enabled: !!teamId,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 새로고침
    refetchOnWindowFocus: true,
  })
}

/**
 * 사용자 성과 메트릭 Hook
 * 개인 성과 및 생산성 데이터
 */
export function useUserPerformance() {
  const { user } = useAuth()
  const metricsService = new MetricsService()
  
  return useQuery({
    queryKey: dashboardKeys.userPerformance(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      
      try {
        const performance = await metricsService.getUserPerformanceMetrics(user.id)
        return performance
      } catch (error) {
        console.error('Failed to fetch user performance:', error)
        throw error
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 10 * 60 * 1000, // 10분
  })
}

/**
 * 프로젝트 상태 메트릭 Hook
 * 특정 프로젝트의 건강도 분석
 */
export function useProjectHealth(projectId?: string) {
  const metricsService = new MetricsService()
  
  return useQuery({
    queryKey: dashboardKeys.projectHealth(projectId || ''),
    queryFn: async () => {
      if (!projectId) {
        return null
      }
      
      try {
        const health = await metricsService.getProjectHealthMetrics(projectId)
        return health
      } catch (error) {
        console.error('Failed to fetch project health:', error)
        throw error
      }
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 15 * 60 * 1000, // 15분
  })
}

/**
 * 대시보드 데이터 프리페칭
 * SSR 또는 초기 로드 시 사용
 */
export async function prefetchDashboardData(queryClient: any, teamId: string, userId?: string) {
  const metricsService = new MetricsService()
  
  // 팀 메트릭 프리페칭
  await queryClient.prefetchQuery({
    queryKey: dashboardKeys.metrics(teamId),
    queryFn: () => metricsService.getDashboardMetrics(teamId),
    staleTime: 1 * 60 * 1000,
  })
  
  // 사용자 성과 프리페칭 (인증된 경우)
  if (userId) {
    await queryClient.prefetchQuery({
      queryKey: dashboardKeys.userPerformance(userId),
      queryFn: () => metricsService.getUserPerformanceMetrics(userId),
      staleTime: 2 * 60 * 1000,
    })
  }
}