'use client'

import React, { memo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { Task } from '@/lib/core/domain/entities/Task'
import type { Project } from '@/lib/core/domain/entities/Project'
import { cn } from '@/lib/utils'
import { format, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'

interface TimelineBarProps {
  item: Task | Project
  startDate: Date
  endDate: Date
  dayWidth: number
  timelineStart: Date
  timelineEnd: Date
  onClick?: () => void
  onResize?: (itemId: string, newStart: Date, newEnd: Date) => Promise<void>
  showDependencies?: boolean
  isDragging?: boolean
}

/**
 * 타임라인 바 컴포넌트
 * 간트 차트의 개별 태스크/프로젝트 바
 */
export const TimelineBar = memo(function TimelineBar({
  item,
  startDate,
  endDate,
  dayWidth,
  timelineStart,
  timelineEnd,
  onClick,
  onResize,
  showDependencies,
  isDragging = false,
}: TimelineBarProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: item.getId(),
    data: {
      type: 'timeline-bar',
      item,
      startDate,
      endDate,
    },
  })

  // 위치 및 크기 계산
  const leftOffset = differenceInDays(startDate, timelineStart) * dayWidth
  const barWidth = differenceInDays(endDate, startDate) * dayWidth || dayWidth

  // 진행률 계산
  const progress = 'getProgress' in item ? item.getProgress() : 
                   'getStatus' in item ? 
                     (item.getStatus() === 'done' ? 100 : 
                      item.getStatus() === 'in_progress' ? 50 : 0) : 0

  // 우선순위별 색상
  const priorityColors = {
    low: 'bg-gray-200 border-gray-300',
    medium: 'bg-blue-200 border-blue-300',
    high: 'bg-orange-200 border-orange-300',
    urgent: 'bg-red-200 border-red-300',
  }

  // 상태별 스타일
  const statusStyles = {
    todo: '',
    planning: '',
    in_progress: 'ring-2 ring-blue-400',
    review: 'ring-2 ring-yellow-400',
    done: 'opacity-80',
    completed: 'opacity-80',
    cancelled: 'opacity-40',
    on_hold: 'opacity-60',
  }

  const priority = item.getPriority()
  const status = 'getStatus' in item ? item.getStatus() : 'planning'
  const title = item.getTitle()
  const assignedTo = 'getAssignedTo' in item ? item.getAssignedTo() : undefined

  const dragStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  // 리사이즈 핸들러
  const handleResizeStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation()
    if (!onResize) return

    const startX = e.clientX
    const originalLeft = leftOffset
    const originalWidth = barWidth

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaDays = Math.round(deltaX / dayWidth)

      if (side === 'left') {
        const newStartDate = new Date(startDate)
        newStartDate.setDate(newStartDate.getDate() + deltaDays)
        if (newStartDate < endDate) {
          onResize(item.getId(), newStartDate, endDate)
        }
      } else {
        const newEndDate = new Date(endDate)
        newEndDate.setDate(newEndDate.getDate() + deltaDays)
        if (newEndDate > startDate) {
          onResize(item.getId(), startDate, newEndDate)
        }
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute h-8 rounded border-2 cursor-pointer transition-all',
        'hover:shadow-md select-none',
        priorityColors[priority],
        statusStyles[status],
        isDragging && 'opacity-50 shadow-lg scale-105 z-50'
      )}
      style={{
        left: `${leftOffset}px`,
        width: `${barWidth}px`,
        ...dragStyle,
      }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {/* 진행률 바 */}
      <div
        className="absolute inset-0 bg-green-400 opacity-30 rounded"
        style={{ width: `${progress}%` }}
      />

      {/* 리사이즈 핸들 - 왼쪽 */}
      {onResize && (
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-400 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleResizeStart(e, 'left')}
        />
      )}

      {/* 컨텐츠 */}
      <div className="flex items-center justify-between h-full px-2">
        <span className="text-xs font-medium truncate flex-1">
          {title}
        </span>
        {assignedTo && (
          <span className="text-xs opacity-75 ml-1">
            {assignedTo.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* 리사이즈 핸들 - 오른쪽 */}
      {onResize && (
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-400 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleResizeStart(e, 'right')}
        />
      )}

      {/* 툴팁 (호버시 표시) */}
      <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded shadow-lg opacity-0 hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
        <div className="text-xs space-y-1">
          <div className="font-medium">{title}</div>
          <div>{format(startDate, 'MM/dd', { locale: ko })} - {format(endDate, 'MM/dd', { locale: ko })}</div>
          <div>진행률: {progress}%</div>
          {assignedTo && <div>담당자: {assignedTo}</div>}
        </div>
      </div>
    </div>
  )
})