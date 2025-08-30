'use client'

import React, { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { Task } from '@/lib/core/domain/entities/Task'
import { CalendarEvent } from './CalendarEvent'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface CalendarGridProps {
  date: Date
  tasks: Task[]
  view: 'month' | 'week' | 'day'
  isToday: boolean
  isCurrentMonth: boolean
  isWeekend: boolean
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
  timeSlot?: number // 시간 슬롯 (주/일 뷰에서 사용)
}

/**
 * 캘린더 그리드 셀 컴포넌트
 * 날짜별 태스크를 표시하는 그리드 셀
 */
export const CalendarGrid = memo(function CalendarGrid({
  date,
  tasks,
  view,
  isToday,
  isCurrentMonth,
  isWeekend,
  onTaskClick,
  onDateClick,
  timeSlot,
}: CalendarGridProps) {
  const dropId = timeSlot !== undefined 
    ? `${format(date, 'yyyy-MM-dd')}-${timeSlot}`
    : format(date, 'yyyy-MM-dd')

  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: {
      type: 'calendar-grid',
      date,
      timeSlot,
    },
  })

  // 시간대별 태스크 필터링 (주/일 뷰)
  const filteredTasks = timeSlot !== undefined
    ? tasks.filter(task => {
        const dueDate = task.getDueDate()
        return dueDate && dueDate.getHours() === timeSlot
      })
    : tasks

  // 뷰별 셀 높이
  const cellHeight = {
    month: 'min-h-[100px]',
    week: 'h-20',
    day: 'h-16',
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-r border-b p-2 transition-colors',
        cellHeight[view],
        isCurrentMonth ? 'bg-white' : 'bg-gray-50',
        isToday && 'bg-blue-50',
        isWeekend && isCurrentMonth && 'bg-gray-50/50',
        isOver && 'bg-blue-100',
        onDateClick && 'cursor-pointer hover:bg-gray-100'
      )}
      onClick={() => onDateClick?.(date)}
    >
      {/* 날짜 헤더 (월 뷰) */}
      {view === 'month' && (
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              'text-sm font-medium',
              isToday && 'text-blue-600',
              !isCurrentMonth && 'text-gray-400'
            )}
          >
            {date.getDate()}
          </span>
          {tasks.length > 0 && (
            <span className="text-xs text-gray-500">
              {tasks.length}
            </span>
          )}
        </div>
      )}

      {/* 시간 표시 (주/일 뷰) */}
      {view !== 'month' && timeSlot === 0 && (
        <div className="text-xs text-gray-500 mb-1">
          {format(date, 'MM/dd')}
        </div>
      )}

      {/* 태스크 목록 */}
      <div className="space-y-1 overflow-y-auto">
        {filteredTasks.slice(0, view === 'month' ? 3 : undefined).map(task => (
          <CalendarEvent
            key={task.getId()}
            task={task}
            view={view}
            onClick={() => onTaskClick?.(task)}
          />
        ))}
        
        {/* 더 많은 태스크 표시 (월 뷰) */}
        {view === 'month' && filteredTasks.length > 3 && (
          <button
            className="text-xs text-blue-600 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation()
              // 더 보기 모달 또는 일 뷰로 전환
              onDateClick?.(date)
            }}
          >
            +{filteredTasks.length - 3} more
          </button>
        )}
      </div>

      {/* 드롭 영역 표시 */}
      {isOver && (
        <div className="mt-1 h-8 border-2 border-dashed border-blue-400 rounded bg-blue-50/50 flex items-center justify-center">
          <p className="text-xs text-blue-600">놓기</p>
        </div>
      )}
    </div>
  )
})