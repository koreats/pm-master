'use client'

import React, { memo, useState, useMemo, useRef, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import type { TimelineViewProps } from '@/lib/views/types'
import type { Task } from '@/lib/core/domain/entities/Task'
import type { Project } from '@/lib/core/domain/entities/Project'
import { TimelineBar } from './TimelineBar'
import { TimelineHeader, ZoomLevel } from './TimelineHeader'
import { cn } from '@/lib/utils'
import { 
  differenceInDays, 
  addDays, 
  subDays, 
  startOfDay, 
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  min,
  max,
} from 'date-fns'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * 타임라인 뷰 컴포넌트
 * 간트 차트 형태의 타임라인
 */
export const TimelineView = memo(function TimelineView({
  data = [],
  config,
  loading,
  error,
  onItemClick,
  onItemUpdate,
  onItemDelete,
  onBarMove,
  startDate: propStartDate,
  endDate: propEndDate,
  zoomLevel: propZoomLevel = 'week',
  showDependencies = false,
  className,
}: TimelineViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(propZoomLevel)
  const [viewStartDate, setViewStartDate] = useState<Date>(() => {
    if (propStartDate) return startOfDay(propStartDate)
    
    // 데이터에서 가장 빠른 날짜 찾기
    const dates = data
      .map(item => {
        if ('getStartDate' in item && item.getStartDate) {
          const getStartDate = item.getStartDate as () => Date | undefined
          return getStartDate()
        } else if ('getDueDate' in item && item.getDueDate) {
          const dueDate = item.getDueDate()
          return dueDate ? subDays(dueDate, 7) : null // 마감일 1주일 전부터 시작
        }
        return null
      })
      .filter(Boolean) as Date[]
    
    return dates.length > 0 ? startOfDay(min(dates)) : startOfMonth(new Date())
  })
  
  const [viewEndDate, setViewEndDate] = useState<Date>(() => {
    if (propEndDate) return endOfDay(propEndDate)
    
    // 데이터에서 가장 늦은 날짜 찾기
    const dates = data
      .map(item => {
        if ('getEndDate' in item && item.getEndDate) {
          const getEndDate = item.getEndDate as () => Date | undefined
          return getEndDate()
        } else if ('getDueDate' in item && item.getDueDate) {
          return item.getDueDate()
        }
        return null
      })
      .filter(Boolean) as Date[]
    
    return dates.length > 0 ? endOfDay(max(dates)) : endOfMonth(addDays(new Date(), 90))
  })

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 포인터 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // 줌 레벨에 따른 일별 너비 계산
  const dayWidth = useMemo(() => {
    switch (zoomLevel) {
      case 'day':
        return 80
      case 'week':
        return 30
      case 'month':
        return 10
      case 'quarter':
        return 4
      default:
        return 30
    }
  }, [zoomLevel])

  // 타임라인 너비 계산
  const timelineWidth = useMemo(() => {
    const days = differenceInDays(viewEndDate, viewStartDate) + 1
    return days * dayWidth
  }, [viewStartDate, viewEndDate, dayWidth])

  // 아이템별 날짜 계산
  const itemsWithDates = useMemo(() => {
    return data.map(item => {
      let startDate: Date
      let endDate: Date

      if ('getStartDate' in item && item.getStartDate && 'getEndDate' in item && item.getEndDate) {
        // Project 타입
        const getStartDate = item.getStartDate as () => Date | undefined
        const getEndDate = item.getEndDate as () => Date | undefined
        startDate = getStartDate() || viewStartDate
        endDate = getEndDate() || viewEndDate
      } else if ('getDueDate' in item && item.getDueDate) {
        // Task 타입
        const dueDate = item.getDueDate()
        if (dueDate) {
          const estimatedHours = 'getEstimatedHours' in item ? item.getEstimatedHours() || 8 : 8
          const estimatedDays = Math.ceil(estimatedHours / 8)
          startDate = subDays(dueDate, estimatedDays)
          endDate = dueDate
        } else {
          startDate = viewStartDate
          endDate = addDays(viewStartDate, 7)
        }
      } else {
        startDate = viewStartDate
        endDate = addDays(viewStartDate, 7)
      }

      return {
        item,
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate),
      }
    })
  }, [data, viewStartDate, viewEndDate])

  // 드래그 중인 아이템 찾기
  const activeItem = activeId 
    ? itemsWithDates.find(({ item }) => item.getId() === activeId)
    : null

  // 드래그 시작
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // 드래그 종료
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event

    if (!onBarMove) {
      setActiveId(null)
      return
    }

    const itemId = active.id as string
    const itemData = itemsWithDates.find(({ item }) => item.getId() === itemId)
    
    if (itemData) {
      const daysMoved = Math.round(delta.x / dayWidth)
      const newStartDate = addDays(itemData.startDate, daysMoved)
      const newEndDate = addDays(itemData.endDate, daysMoved)
      
      await onBarMove(itemId, newStartDate, newEndDate)
    }

    setActiveId(null)
  }

  // 줌 레벨 변경
  const handleZoomIn = () => {
    const levels: ZoomLevel[] = ['quarter', 'month', 'week', 'day']
    const currentIndex = levels.indexOf(zoomLevel)
    if (currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1])
    }
  }

  const handleZoomOut = () => {
    const levels: ZoomLevel[] = ['quarter', 'month', 'week', 'day']
    const currentIndex = levels.indexOf(zoomLevel)
    if (currentIndex > 0) {
      setZoomLevel(levels[currentIndex - 1])
    }
  }

  const handleFitToScreen = () => {
    // 데이터의 전체 범위에 맞춰 조정
    const dates = itemsWithDates.flatMap(({ startDate, endDate }) => [startDate, endDate])
    if (dates.length > 0) {
      setViewStartDate(subDays(min(dates), 7))
      setViewEndDate(addDays(max(dates), 7))
    }
  }

  // 네비게이션
  const handlePrevious = () => {
    const days = zoomLevel === 'day' ? 7 : zoomLevel === 'week' ? 14 : 30
    setViewStartDate(subDays(viewStartDate, days))
    setViewEndDate(subDays(viewEndDate, days))
  }

  const handleNext = () => {
    const days = zoomLevel === 'day' ? 7 : zoomLevel === 'week' ? 14 : 30
    setViewStartDate(addDays(viewStartDate, days))
    setViewEndDate(addDays(viewEndDate, days))
  }

  // 리사이즈 핸들러
  const handleResize = async (itemId: string, newStart: Date, newEnd: Date) => {
    if (!onBarMove) return
    await onBarMove(itemId, newStart, newEnd)
  }

  // 오늘 날짜로 스크롤
  useEffect(() => {
    if (scrollContainerRef.current) {
      const today = new Date()
      const daysFromStart = differenceInDays(today, viewStartDate)
      const scrollPosition = daysFromStart * dayWidth - 200 // 오늘을 약간 왼쪽에 위치
      scrollContainerRef.current.scrollLeft = Math.max(0, scrollPosition)
    }
  }, [viewStartDate, dayWidth])

  // 로딩 상태
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-600">오류: {error.message}</div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('w-full h-full flex flex-col', className)}>
        {/* 툴바 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2">
              {zoomLevel === 'day' ? '일' : 
               zoomLevel === 'week' ? '주' : 
               zoomLevel === 'month' ? '월' : '분기'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFitToScreen}
              className="h-8 px-3"
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              화면 맞춤
            </Button>
          </div>
        </div>

        {/* 타임라인 본체 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 아이템 라벨 */}
          <div className="w-64 border-r overflow-y-auto">
            <div className="sticky top-0 bg-white border-b h-[73px] flex items-center px-4 font-medium text-sm">
              항목
            </div>
            {itemsWithDates.map(({ item }) => (
              <div
                key={item.getId()}
                className="h-12 border-b px-4 flex items-center hover:bg-gray-50 cursor-pointer"
                onClick={() => onItemClick?.(item)}
              >
                <div className="flex-1 truncate">
                  <div className="text-sm font-medium truncate">
                    {item.getTitle()}
                  </div>
                  {'getAssignedTo' in item && item.getAssignedTo && (
                    <div className="text-xs text-gray-500">
                      {item.getAssignedTo()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 타임라인 그리드 */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-auto"
          >
            <TimelineHeader
              startDate={viewStartDate}
              endDate={viewEndDate}
              zoomLevel={zoomLevel}
              dayWidth={dayWidth}
            />
            
            <div className="relative" style={{ width: timelineWidth }}>
              {/* 그리드 라인 */}
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: Math.ceil(timelineWidth / dayWidth) }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'absolute top-0 bottom-0 border-l',
                      i % 7 === 0 ? 'border-gray-300' : 'border-gray-200'
                    )}
                    style={{ left: `${i * dayWidth}px` }}
                  />
                ))}
              </div>

              {/* 타임라인 바 */}
              {itemsWithDates.map(({ item, startDate, endDate }, index) => (
                <div
                  key={item.getId()}
                  className="relative h-12 border-b"
                  style={{ marginTop: index === 0 ? 0 : undefined }}
                >
                  <TimelineBar
                    item={item}
                    startDate={startDate}
                    endDate={endDate}
                    dayWidth={dayWidth}
                    timelineStart={viewStartDate}
                    timelineEnd={viewEndDate}
                    onClick={() => onItemClick?.(item)}
                    onResize={handleResize}
                    showDependencies={showDependencies}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 드래그 오버레이 */}
      <DragOverlay>
        {activeItem && (
          <TimelineBar
            item={activeItem.item}
            startDate={activeItem.startDate}
            endDate={activeItem.endDate}
            dayWidth={dayWidth}
            timelineStart={viewStartDate}
            timelineEnd={viewEndDate}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
})

export default TimelineView