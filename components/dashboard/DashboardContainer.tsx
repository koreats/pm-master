'use client'

import React, { memo, Suspense } from 'react'
import { useDashboardMetrics, useUserPerformance } from '@/lib/dashboard/hooks/useDashboardMetrics'
import { useRealtimeSubscription } from '@/lib/dashboard/hooks/useRealtimeSubscription'
import { PrimaryMetricsGrid, ProgressMetricsGrid } from './metrics/MetricsGrid'
import { ProgressRingGroup } from './metrics/ProgressRing'
import { useAuth } from '@/lib/auth/hooks/useAuth'
import { cn } from '@/lib/utils'

interface DashboardContainerProps {
  teamId: string
  className?: string
}

/**
 * 대시보드 컨테이너 컴포넌트
 * 데이터 fetching과 실시간 업데이트 관리
 */
export const DashboardContainer = memo(function DashboardContainer({
  teamId,
  className
}: DashboardContainerProps) {
  const { user } = useAuth()
  
  // 데이터 fetching
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useDashboardMetrics(teamId)
  const { data: performance, isLoading: perfLoading } = useUserPerformance()
  
  // 실시간 업데이트 구독
  useRealtimeSubscription({
    teamId,
    userId: user?.id,
    debounceMs: 500
  })
  
  // 에러 상태
  if (metricsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">대시보드 데이터를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-sm text-gray-600 mt-2">{(metricsError as Error).message}</p>
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* 헤더 섹션 */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal">대시보드</h1>
        <p className="text-gray-600 mt-2">
          프로젝트 진행 상황을 한눈에 확인하세요
        </p>
      </div>
      
      {/* 주요 메트릭 */}
      <section>
        <h2 className="text-lg font-semibold text-charcoal mb-4">현재 상태</h2>
        <PrimaryMetricsGrid
          activeGoals={metrics?.overview.activeGoals || 0}
          activeProjects={metrics?.overview.activeProjects || 0}
          todayTasks={metrics?.productivity.tasksCompletedToday || 0}
          teamMembers={1} // TODO: 실제 팀 멤버 수 가져오기
          loading={metricsLoading}
        />
      </section>
      
      {/* 진행률 메트릭 */}
      <section>
        <h2 className="text-lg font-semibold text-charcoal mb-4">진행 현황</h2>
        <ProgressMetricsGrid
          goalsProgress={metrics?.progress.averageGoalProgress || 0}
          projectsProgress={metrics?.progress.projectsCompletionRate || 0}
          tasksProgress={metrics?.progress.tasksCompletionRate || 0}
          loading={metricsLoading}
        />
      </section>
      
      {/* 개인 성과 */}
      {performance && (
        <section>
          <h2 className="text-lg font-semibold text-charcoal mb-4">내 성과</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <ProgressRingGroup
              items={[
                {
                  label: '오늘 완료',
                  progress: performance.completion.tasksCompletedToday || 0,
                  color: 'primary'
                },
                {
                  label: '이번 주',
                  progress: performance.completion.tasksCompletedThisWeek || 0,
                  color: 'secondary'
                },
                {
                  label: '정시 완료율',
                  progress: performance.quality.onTimeCompletionRate || 0,
                  color: 'success'
                }
              ]}
              size={100}
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-charcoal">
                  {performance.overview.assignedTasks}
                </p>
                <p className="text-sm text-gray-600">할당된 작업</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-charcoal">
                  {performance.overview.completedTasks}
                </p>
                <p className="text-sm text-gray-600">완료한 작업</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-charcoal">
                  {performance.time.averageTaskTime.toFixed(1)}h
                </p>
                <p className="text-sm text-gray-600">평균 작업 시간</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-charcoal">
                  {performance.completion.completionStreak}
                </p>
                <p className="text-sm text-gray-600">연속 완료일</p>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* 생산성 트렌드 */}
      {metrics && (
        <section>
          <h2 className="text-lg font-semibold text-charcoal mb-4">생산성 분석</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">오늘 완료</p>
                <p className="text-3xl font-bold text-charcoal">
                  {metrics.productivity.tasksCompletedToday}
                </p>
                <p className="text-xs text-gray-500 mt-1">작업</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">이번 주 완료</p>
                <p className="text-3xl font-bold text-charcoal">
                  {metrics.productivity.tasksCompletedThisWeek}
                </p>
                <p className="text-xs text-gray-500 mt-1">작업</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">생산성 트렌드</p>
                <p className={cn(
                  "text-3xl font-bold",
                  metrics.productivity.productivityTrend > 0 ? "text-green-600" :
                  metrics.productivity.productivityTrend < 0 ? "text-red-600" :
                  "text-gray-600"
                )}>
                  {metrics.productivity.productivityTrend > 0 ? '+' : ''}
                  {metrics.productivity.productivityTrend}%
                </p>
                <p className="text-xs text-gray-500 mt-1">지난 주 대비</p>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* 시간 관리 */}
      {metrics && metrics.time.mostTimeConsumingProjects.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-charcoal mb-4">시간 소요 프로젝트</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="space-y-4">
                {metrics.time.mostTimeConsumingProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-charcoal">{project.title}</p>
                      <div className="flex gap-4 mt-1">
                        <p className="text-sm text-gray-600">
                          예상: {project.estimatedHours}h
                        </p>
                        <p className="text-sm text-gray-600">
                          실제: {project.actualHours}h
                        </p>
                        <p className={cn(
                          "text-sm font-medium",
                          project.variance > 0 ? "text-red-600" : "text-green-600"
                        )}>
                          {project.variance > 0 ? '+' : ''}{project.variance}h
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">효율성</p>
                      <p className={cn(
                        "text-lg font-bold",
                        project.actualHours <= project.estimatedHours ? "text-green-600" : "text-red-600"
                      )}>
                        {project.estimatedHours > 0 
                          ? Math.round((project.estimatedHours / project.actualHours) * 100) 
                          : 100}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
})