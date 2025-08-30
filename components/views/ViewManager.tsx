'use client'

import React, { useCallback, useMemo, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Table2, 
  LayoutGrid, 
  Calendar, 
  BarChart3, 
  Images, 
  List,
  Settings,
  Filter,
  SortDesc,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import type { ViewType, BaseViewProps } from '@/lib/views/types'
import { useViewStore, useCurrentView, useViewHistory } from '@/lib/views/store/viewStore'

// Lazy load view components for better performance
const TableView = lazy(() => import('./table/TableView'))
const KanbanView = lazy(() => import('./kanban/KanbanView'))
const CalendarView = lazy(() => import('./calendar/CalendarView'))
const TimelineView = lazy(() => import('./timeline/TimelineView'))
const GalleryView = lazy(() => import('./gallery/GalleryView'))
const ListView = lazy(() => import('./list/ListView'))

interface ViewManagerProps extends BaseViewProps {
  /**
   * 현재 활성 뷰 타입 (외부에서 제어할 경우)
   */
  view?: ViewType
  /**
   * 뷰 변경 콜백
   */
  onViewChange?: (view: ViewType) => void
  /**
   * 사용 가능한 뷰 타입 목록
   */
  availableViews?: ViewType[]
  /**
   * 뷰 전환 애니메이션 활성화
   */
  enableTransition?: boolean
  /**
   * 뷰 설정 패널 표시
   */
  showSettings?: boolean
  /**
   * 뷰별 커스텀 설정 컴포넌트
   */
  customSettings?: Record<ViewType, React.ComponentType>
  /**
   * 내보내기 핸들러
   */
  onExport?: (view: ViewType) => void
  /**
   * 가져오기 핸들러
   */
  onImport?: (file: File) => void
  /**
   * 뷰 히스토리 네비게이션 표시
   */
  showNavigation?: boolean
}

/**
 * 뷰 전환 및 상태 관리를 담당하는 최상위 매니저 컴포넌트
 * 모든 뷰 시스템의 진입점 역할
 */
export function ViewManager({
  data = [],
  view: controlledView,
  onViewChange,
  availableViews = ['table', 'kanban', 'calendar', 'timeline', 'gallery', 'list'],
  enableTransition = true,
  showSettings = true,
  customSettings,
  onExport,
  onImport,
  showNavigation = true,
  loading,
  error,
  onItemClick,
  onItemUpdate,
  onItemDelete,
  onBulkAction,
  className,
  ...otherProps
}: ViewManagerProps) {
  // Store hooks
  const currentView = useCurrentView()
  const viewHistory = useViewHistory()
  const {
    setCurrentView,
    updateViewConfig,
    updateFilters,
    updateSorting,
    updateGrouping,
    clearFilters,
    navigateBack,
    navigateForward,
    isTransitioning,
    viewConfigs,
    globalFilters,
  } = useViewStore()

  // 실제 사용할 뷰 (controlled vs uncontrolled)
  const activeView = controlledView || currentView

  // 뷰 아이콘 매핑
  const viewIcons: Record<ViewType, React.ReactNode> = {
    table: <Table2 className="h-4 w-4" />,
    kanban: <LayoutGrid className="h-4 w-4" />,
    calendar: <Calendar className="h-4 w-4" />,
    timeline: <BarChart3 className="h-4 w-4" />,
    gallery: <Images className="h-4 w-4" />,
    list: <List className="h-4 w-4" />,
  }

  // 뷰 라벨 매핑
  const viewLabels: Record<ViewType, string> = {
    table: '테이블',
    kanban: '칸반',
    calendar: '캘린더',
    timeline: '타임라인',
    gallery: '갤러리',
    list: '리스트',
  }

  // 뷰 변경 핸들러
  const handleViewChange = useCallback((newView: ViewType) => {
    if (controlledView && onViewChange) {
      onViewChange(newView)
    } else {
      setCurrentView(newView, true)
    }
  }, [controlledView, onViewChange, setCurrentView])

  // 현재 뷰 설정 가져오기
  const currentViewConfig = useMemo(() => {
    return viewConfigs.get(activeView)
  }, [viewConfigs, activeView])

  // 필터 개수 계산
  const filterCount = useMemo(() => {
    const viewFilters = currentViewConfig?.filters || {}
    const globalFilterCount = Object.keys(globalFilters).length
    const viewFilterCount = Object.keys(viewFilters).length
    return globalFilterCount + viewFilterCount
  }, [currentViewConfig, globalFilters])

  // 설정 변경 핸들러
  const handleConfigChange = useCallback((config: any) => {
    updateViewConfig(activeView, config)
  }, [activeView, updateViewConfig])

  // 파일 입력 핸들러
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImport) {
      onImport(file)
    }
  }, [onImport])

  // 뷰 컴포넌트 렌더링
  const renderView = useCallback(() => {
    const viewProps = {
      data,
      config: currentViewConfig,
      onConfigChange: handleConfigChange,
      loading,
      error,
      onItemClick,
      onItemUpdate,
      onItemDelete,
      onBulkAction,
      ...otherProps,
    }

    switch (activeView) {
      case 'table':
        return <TableView {...viewProps} />
      case 'kanban':
        return <KanbanView {...viewProps} />
      case 'calendar':
        return <CalendarView {...viewProps} />
      case 'timeline':
        return <TimelineView {...viewProps} />
      case 'gallery':
        return <GalleryView {...viewProps} />
      case 'list':
        return <ListView {...viewProps} />
      default:
        return <TableView {...viewProps} />
    }
  }, [
    activeView,
    data,
    currentViewConfig,
    handleConfigChange,
    loading,
    error,
    onItemClick,
    onItemUpdate,
    onItemDelete,
    onBulkAction,
    otherProps,
  ])

  // 로딩 컴포넌트
  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 헤더 툴바 */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-2">
          {/* 뷰 히스토리 네비게이션 */}
          {showNavigation && (
            <div className="flex items-center gap-1 mr-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={navigateBack}
                      disabled={!viewHistory.canGoBack}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>이전 뷰</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={navigateForward}
                      disabled={!viewHistory.canGoForward}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>다음 뷰</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* 뷰 선택 버튼 그룹 */}
          <div className="flex items-center rounded-lg border bg-muted/50 p-1">
            {availableViews.map((viewType) => (
              <TooltipProvider key={viewType}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === viewType ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewChange(viewType)}
                      className="h-8 px-3"
                    >
                      {viewIcons[viewType]}
                      <span className="ml-2 hidden sm:inline">
                        {viewLabels[viewType]}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {viewLabels[viewType]} 뷰로 전환
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* 우측 액션 버튼들 */}
        <div className="flex items-center gap-2">
          {/* 필터 상태 표시 */}
          {filterCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Filter className="h-3 w-3" />
              {filterCount}개 필터 활성
            </Badge>
          )}

          {/* 설정 메뉴 */}
          {showSettings && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Settings className="h-4 w-4 mr-2" />
                  뷰 설정
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>뷰 설정</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => clearFilters(activeView)}
                  disabled={filterCount === 0}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  필터 초기화
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => updateSorting(activeView, { 
                    field: 'createdAt', 
                    direction: 'desc' 
                  })}
                >
                  <SortDesc className="h-4 w-4 mr-2" />
                  정렬 초기화
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {onExport && (
                  <DropdownMenuItem onClick={() => onExport(activeView)}>
                    <Download className="h-4 w-4 mr-2" />
                    데이터 내보내기
                  </DropdownMenuItem>
                )}

                {onImport && (
                  <DropdownMenuItem asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      데이터 가져오기
                      <input
                        type="file"
                        accept=".csv,.json,.xlsx"
                        className="hidden"
                        onChange={handleFileInput}
                      />
                    </label>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 뷰 컨텐츠 영역 */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {enableTransition ? (
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Suspense fallback={<LoadingFallback />}>
                {renderView()}
              </Suspense>
            </motion.div>
          ) : (
            <Suspense fallback={<LoadingFallback />}>
              {renderView()}
            </Suspense>
          )}
        </AnimatePresence>

        {/* 전환 중 오버레이 */}
        {isTransitioning && enableTransition && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
      </div>
    </div>
  )
}

export default ViewManager