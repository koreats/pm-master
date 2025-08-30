'use client'

import React, { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, TaskPriority } from '@/lib/core/domain/entities/Task'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Clock,
  Flag,
  User,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface KanbanCardProps {
  task: Task
  isDragging?: boolean
  onClick?: () => void
  onUpdate?: (task: Task) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
}

/**
 * 칸반 카드 컴포넌트
 * 드래그 가능한 태스크 카드
 */
export const KanbanCard = memo(function KanbanCard({
  task,
  isDragging = false,
  onClick,
  onUpdate,
  onDelete,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.getId(),
    data: {
      type: 'task',
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // 우선순위 설정
  const priorityConfig = {
    low: { icon: Flag, color: 'text-gray-400', label: '낮음' },
    medium: { icon: Flag, color: 'text-blue-500', label: '보통' },
    high: { icon: Flag, color: 'text-orange-500', label: '높음' },
    urgent: { icon: AlertCircle, color: 'text-red-500', label: '긴급' },
  }

  const priority = task.getPriority()
  const PriorityIcon = priorityConfig[priority].icon

  // 마감일 계산
  const dueDate = task.getDueDate()
  const isOverdue = dueDate && dueDate < new Date() && task.getStatus() !== 'done'
  const isDueSoon = dueDate && !isOverdue && 
    (dueDate.getTime() - new Date().getTime()) < 86400000 * 2 // 2일 이내

  // 담당자 정보
  const assignedTo = task.getAssignedTo()
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // 진행률 계산 (상태 기반)
  const status = task.getStatus()
  let progress = 0
  if (status === 'done') progress = 100
  else if (status === 'cancelled') progress = 0
  else if (status === 'in_progress') progress = 50
  else if (status === 'review') progress = 75

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer',
        'select-none touch-none',
        (isSortableDragging || isDragging) && 'opacity-50 shadow-lg scale-105',
        isOverdue && 'border-red-300 bg-red-50/50'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="p-3 space-y-2">
        {/* 헤더 영역 */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">
            {task.getTitle()}
          </h4>
          <PriorityIcon
            className={cn('h-4 w-4 flex-shrink-0', priorityConfig[priority].color)}
          />
        </div>

        {/* 설명 (있는 경우) */}
        {task.getDescription() && (
          <p className="text-xs text-gray-500 line-clamp-2">
            {task.getDescription()}
          </p>
        )}

        {/* 메타 정보 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 마감일 */}
          {dueDate && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue && 'text-red-600 font-medium',
                isDueSoon && 'text-orange-600',
                !isOverdue && !isDueSoon && 'text-gray-500'
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>{format(dueDate, 'MM/dd', { locale: ko })}</span>
            </div>
          )}

          {/* 예상 시간 */}
          {task.getEstimatedHours() && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{task.getEstimatedHours()}h</span>
            </div>
          )}

          {/* 코멘트 수 (더미) */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MessageSquare className="h-3 w-3" />
            <span>0</span>
          </div>

          {/* 첨부파일 수 (더미) */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Paperclip className="h-3 w-3" />
            <span>0</span>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              progress === 100 ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 푸터 영역 */}
        <div className="flex items-center justify-between pt-1">
          {/* 프로젝트 태그 */}
          <Badge variant="outline" className="text-xs px-2 py-0">
            P-{task.getProjectId().slice(0, 6)}
          </Badge>

          {/* 담당자 */}
          {assignedTo ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={`/api/avatar/${assignedTo}`} />
              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                {getInitials(assignedTo)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
              <User className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </div>

        {/* 완료 표시 */}
        {status === 'done' && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>
    </div>
  )
})

export default KanbanCard