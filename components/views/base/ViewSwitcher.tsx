'use client'

import React, { memo } from 'react'
import { 
  Table2, 
  LayoutGrid, 
  Calendar, 
  GanttChart, 
  Images, 
  List 
} from 'lucide-react'
import { useViewStore } from '@/lib/views/store/viewStore'
import type { ViewType } from '@/lib/views/types'
import { cn } from '@/lib/utils'

interface ViewSwitcherProps {
  currentView: ViewType
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * 뷰 전환 컴포넌트
 * 6가지 뷰 타입 간 전환을 담당
 */
export const ViewSwitcher = memo(function ViewSwitcher({
  currentView,
  disabled = false,
  className,
  size = 'md',
}: ViewSwitcherProps) {
  const { setCurrentView } = useViewStore()

  const viewOptions: Array<{
    type: ViewType
    label: string
    icon: React.ComponentType<{ className?: string }>
    description: string
  }> = [
    {
      type: 'table',
      label: '테이블',
      icon: Table2,
      description: '정렬과 필터링이 가능한 테이블 뷰',
    },
    {
      type: 'kanban',
      label: '칸반',
      icon: LayoutGrid,
      description: '드래그 앤 드롭이 가능한 보드 뷰',
    },
    {
      type: 'calendar',
      label: '캘린더',
      icon: Calendar,
      description: '일정을 확인할 수 있는 캘린더 뷰',
    },
    {
      type: 'timeline',
      label: '타임라인',
      icon: GanttChart,
      description: '간트 차트 형태의 타임라인 뷰',
    },
    {
      type: 'gallery',
      label: '갤러리',
      icon: Images,
      description: '카드 형태의 갤러리 뷰',
    },
    {
      type: 'list',
      label: '리스트',
      icon: List,
      description: '계층 구조를 보여주는 리스트 뷰',
    },
  ]

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  }

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
        {viewOptions.map((option) => {
          const Icon = option.icon
          const isActive = currentView === option.type

          return (
            <button
              key={option.type}
              onClick={() => !disabled && setCurrentView(option.type)}
              disabled={disabled}
              title={option.description}
              className={cn(
                'group relative inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                sizeClasses[size],
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              aria-label={`${option.label} 뷰로 전환`}
              aria-pressed={isActive}
            >
              <Icon className={cn(iconSizeClasses[size], 'transition-transform')} />
              
              {/* 호버 시 툴팁 */}
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-10">
                <span className="bg-gray-900 text-white text-xs rounded-md py-1 px-2 whitespace-nowrap">
                  {option.label}
                </span>
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
              </span>
            </button>
          )
        })}
      </div>

      {/* 뷰 히스토리 네비게이션 */}
      <ViewHistoryNav disabled={disabled} />
    </div>
  )
})

/**
 * 뷰 히스토리 네비게이션
 * 뒤로가기/앞으로가기 버튼
 */
function ViewHistoryNav({ disabled }: { disabled?: boolean }) {
  const { navigateBack, navigateForward } = useViewStore()
  const { canGoBack, canGoForward } = useViewStore((state) => ({
    canGoBack: state.historyIndex > 0,
    canGoForward: state.historyIndex < state.viewHistory.length - 1,
  }))

  return (
    <div className="ml-4 flex items-center gap-1">
      <button
        onClick={navigateBack}
        disabled={disabled || !canGoBack}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          canGoBack && !disabled
            ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            : 'text-gray-300 cursor-not-allowed'
        )}
        aria-label="이전 뷰로"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={navigateForward}
        disabled={disabled || !canGoForward}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          canGoForward && !disabled
            ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            : 'text-gray-300 cursor-not-allowed'
        )}
        aria-label="다음 뷰로"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  )
}

export default ViewSwitcher