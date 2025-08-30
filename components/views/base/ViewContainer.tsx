'use client'

import React, { memo, Suspense, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useViewStore } from '@/lib/views/store/viewStore'
import type { BaseViewProps, ViewType } from '@/lib/views/types'
import { cn } from '@/lib/utils'
import ViewSwitcher from './ViewSwitcher'
import ViewFilters from './ViewFilters'

interface ViewContainerProps extends Partial<BaseViewProps> {
  children?: React.ReactNode
  className?: string
  showSwitcher?: boolean
  showFilters?: boolean
  headerActions?: React.ReactNode
}

/**
 * 뷰 컨테이너 컴포넌트
 * 모든 뷰를 감싸는 공통 컨테이너로 뷰 전환, 필터링, 상태 관리를 담당
 */
export const ViewContainer = memo(function ViewContainer({
  children,
  className,
  showSwitcher = true,
  showFilters = true,
  headerActions,
  data = [],
  config,
  loading = false,
  error = null,
  onConfigChange,
}: ViewContainerProps) {
  const {
    currentView,
    viewConfigs,
    transitionConfig,
    isTransitioning,
    updateViewConfig,
  } = useViewStore()

  // 현재 뷰 설정 가져오기
  const currentConfig = config || viewConfigs.get(currentView)

  // 뷰 전환 애니메이션 설정
  const animationVariants = useMemo(
    () => ({
      initial: {
        opacity: 0,
        x: transitionConfig.preserveState ? 0 : 20,
      },
      animate: {
        opacity: 1,
        x: 0,
      },
      exit: {
        opacity: 0,
        x: transitionConfig.preserveState ? 0 : -20,
      },
    }),
    [transitionConfig.preserveState]
  )

  // 설정 변경 핸들러
  const handleConfigChange = (newConfig: Partial<typeof currentConfig>) => {
    if (onConfigChange) {
      onConfigChange(newConfig)
    } else if (currentConfig) {
      updateViewConfig(currentView, newConfig)
    }
  }

  // 에러 상태 렌더링
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-6xl">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900">오류가 발생했습니다</h3>
          <p className="text-sm text-gray-600 max-w-md">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 헤더 영역 */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 py-3 space-y-3">
          {/* 상단 툴바 */}
          <div className="flex items-center justify-between">
            {/* 뷰 전환기 */}
            {showSwitcher && (
              <ViewSwitcher
                currentView={currentView}
                disabled={isTransitioning || loading}
              />
            )}

            {/* 헤더 액션 (검색, 추가 버튼 등) */}
            {headerActions && (
              <div className="flex items-center gap-2">{headerActions}</div>
            )}
          </div>

          {/* 필터 영역 */}
          {showFilters && currentConfig && (
            <ViewFilters
              filters={currentConfig.filters}
              onFiltersChange={(filters) =>
                handleConfigChange({ ...currentConfig, filters })
              }
              disabled={loading}
            />
          )}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <ViewLoadingSkeleton type={currentView} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={animationVariants}
              transition={{
                duration: transitionConfig.duration ? transitionConfig.duration / 1000 : 0.3,
                ease: transitionConfig.easing || 'easeInOut',
              }}
              className="h-full"
            >
              <Suspense fallback={<ViewLoadingSkeleton type={currentView} />}>
                {children}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* 하단 상태바 (선택 개수, 페이지네이션 등) */}
      {currentConfig?.selection && currentConfig.selection.selectedIds.size > 0 && (
        <ViewStatusBar
          selectedCount={currentConfig.selection.selectedIds.size}
          totalCount={data.length}
        />
      )}
    </div>
  )
})

/**
 * 뷰 로딩 스켈레톤
 */
function ViewLoadingSkeleton({ type }: { type: ViewType }) {
  const skeletonByType = {
    table: (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse flex-1" />
            <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
            <div className="h-10 bg-gray-200 rounded animate-pulse w-24" />
          </div>
        ))}
      </div>
    ),
    kanban: (
      <div className="p-4 flex gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-1 space-y-3">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    ),
    calendar: (
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    ),
    timeline: (
      <div className="p-4 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-12 bg-gray-200 rounded animate-pulse w-48" />
            <div className="h-12 bg-gray-200 rounded animate-pulse flex-1" />
          </div>
        ))}
      </div>
    ),
    gallery: (
      <div className="p-4 grid grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    ),
    list: (
      <div className="p-4 space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-2" style={{ paddingLeft: `${(i % 3) * 20}px` }}>
            <div className="h-8 bg-gray-200 rounded animate-pulse flex-1" />
          </div>
        ))}
      </div>
    ),
  }

  return (
    <div className="h-full overflow-hidden">
      {skeletonByType[type] || skeletonByType.table}
    </div>
  )
}

/**
 * 뷰 상태바
 */
function ViewStatusBar({
  selectedCount,
  totalCount,
}: {
  selectedCount: number
  totalCount: number
}) {
  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {selectedCount}개 선택됨 / 전체 {totalCount}개
        </span>
        <button
          className="text-blue-600 hover:text-blue-700 font-medium"
          onClick={() => {
            // 선택 해제 로직
          }}
        >
          선택 해제
        </button>
      </div>
    </div>
  )
}

export default ViewContainer