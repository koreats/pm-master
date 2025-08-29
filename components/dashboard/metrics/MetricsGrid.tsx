'use client'

import React, { memo } from 'react'
import { MetricCard, MetricCardProps, MetricCardSkeleton } from './MetricCard'
import { useResponsiveGrid } from '@/lib/dashboard/hooks/useResponsive'
import { cn } from '@/lib/utils'

interface MetricsGridProps {
  metrics: MetricCardProps[]
  loading?: boolean
  className?: string
  skeletonCount?: number
}

/**
 * 메트릭 그리드 컴포넌트
 * 반응형 그리드 레이아웃으로 메트릭 카드 배치
 */
export const MetricsGrid = memo(function MetricsGrid({
  metrics,
  loading = false,
  className,
  skeletonCount = 4
}: MetricsGridProps) {
  const { gridClassName } = useResponsiveGrid(metrics.length || skeletonCount)
  
  if (loading) {
    return (
      <div className={cn(gridClassName, className)}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <MetricCardSkeleton key={index} />
        ))}
      </div>
    )
  }
  
  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>표시할 메트릭이 없습니다</p>
      </div>
    )
  }
  
  return (
    <div className={cn(gridClassName, className)}>
      {metrics.map((metric, index) => (
        <MetricCard key={`${metric.title}-${index}`} {...metric} />
      ))}
    </div>
  )
})

/**
 * 주요 메트릭 그리드
 * 대시보드 상단에 표시되는 핵심 지표
 */
export const PrimaryMetricsGrid = memo(function PrimaryMetricsGrid({
  activeGoals,
  activeProjects,
  todayTasks,
  teamMembers,
  loading = false
}: {
  activeGoals: number
  activeProjects: number
  todayTasks: number
  teamMembers: number
  loading?: boolean
}) {
  const metrics: MetricCardProps[] = [
    {
      title: '활성 목표',
      value: activeGoals,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBgColor: 'bg-primary-mint-100',
      iconColor: 'text-primary-mint-600'
    },
    {
      title: '진행 중 프로젝트',
      value: activeProjects,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      iconBgColor: 'bg-accent-sky-100',
      iconColor: 'text-accent-sky-600'
    },
    {
      title: '오늘의 작업',
      value: todayTasks,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBgColor: 'bg-secondary-peach-100',
      iconColor: 'text-secondary-peach-600'
    },
    {
      title: '팀 멤버',
      value: teamMembers,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ]
  
  return <MetricsGrid metrics={metrics} loading={loading} />
})

/**
 * 진행률 메트릭 그리드
 * 목표, 프로젝트, 작업 완료율 표시
 */
export const ProgressMetricsGrid = memo(function ProgressMetricsGrid({
  goalsProgress,
  projectsProgress,
  tasksProgress,
  loading = false
}: {
  goalsProgress: number
  projectsProgress: number
  tasksProgress: number
  loading?: boolean
}) {
  const metrics: MetricCardProps[] = [
    {
      title: '목표 달성률',
      value: goalsProgress,
      format: 'percentage',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      iconBgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      title: '프로젝트 완료율',
      value: projectsProgress,
      format: 'percentage',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: '작업 완료율',
      value: tasksProgress,
      format: 'percentage',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={`${metric.title}-${index}`} {...metric} />
      ))}
    </div>
  )
})