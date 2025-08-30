'use client'

import React, { memo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { Task } from '@/lib/core/domain/entities/Task'
import { cn } from '@/lib/utils'
import { Clock, Flag, User } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface CalendarEventProps {
  task: Task
  view: 'month' | 'week' | 'day'
  onClick?: () => void
  isDragging?: boolean
  style?: React.CSSProperties
}

/**
 * 캘린더 이벤트 컴포넌트
 * 태스크를 캘린더에 표시하는 이벤트 카드
 */
export const CalendarEvent = memo(function CalendarEvent({
  task,
  view,
  onClick,
  isDragging = false,
  style,
}: CalendarEventProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: task.getId(),
    data: {
      type: 'calendar-event',
      task,
    },
  })

  const dragStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  // 우선순위별 색상
  const priorityColors = {
    low: 'bg-gray-100 border-gray-300 text-gray-700',
    medium: 'bg-blue-100 border-blue-300 text-blue-700',
    high: 'bg-orange-100 border-orange-300 text-orange-700',
    urgent: 'bg-red-100 border-red-300 text-red-700',
  }

  // 상태별 스타일
  const statusStyles = {
    todo: '',
    in_progress: 'ring-2 ring-blue-400',
    review: 'ring-2 ring-yellow-400',
    done: 'opacity-60 line-through',
    cancelled: 'opacity-40 line-through',
  }

  const priority = task.getPriority()
  const status = task.getStatus()
  const dueDate = task.getDueDate()
  const estimatedHours = task.getEstimatedHours()
  const assignedTo = task.getAssignedTo()

  // 뷰에 따른 표시 스타일
  const isCompactView = view === 'month'

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border px-2 py-1 cursor-pointer transition-all',
        'hover:shadow-md select-none',
        priorityColors[priority],
        statusStyles[status],
        isDragging && 'opacity-50 shadow-lg scale-105',
        isCompactView ? 'text-xs' : 'text-sm'
      )}
      style={{ ...style, ...dragStyle }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {isCompactView ? (
        // 월 뷰 - 간단한 표시
        <div className="flex items-center gap-1">
          {dueDate && (
            <span className="font-medium">
              {format(dueDate, 'HH:mm', { locale: ko })}
            </span>
          )}
          <span className="truncate flex-1">{task.getTitle()}</span>
          {priority === 'urgent' && (
            <Flag className="h-3 w-3 flex-shrink-0" />
          )}
        </div>
      ) : (
        // 주/일 뷰 - 상세 표시
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-1">
            <span className="font-medium truncate flex-1">
              {task.getTitle()}
            </span>
            <Flag className={cn('h-3 w-3 flex-shrink-0')} />
          </div>
          
          {task.getDescription() && (
            <p className="text-xs opacity-80 line-clamp-2">
              {task.getDescription()}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs opacity-80">
            {dueDate && (
              <div className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                <span>{format(dueDate, 'HH:mm', { locale: ko })}</span>
              </div>
            )}
            
            {estimatedHours && (
              <span>{estimatedHours}h</span>
            )}
            
            {assignedTo && (
              <div className="flex items-center gap-0.5">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[60px]">{assignedTo}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})