'use client'

import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import type { Task } from '@/lib/core/domain/entities/Task'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, Flag, User } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface UseTableColumnsProps {
  onEdit?: (task: Task) => void | Promise<void>
  onDelete?: (taskId: string) => void | Promise<void>
  onView?: (task: Task) => void
}

/**
 * 테이블 컬럼 정의 훅
 * Task 엔티티를 위한 기본 컬럼 설정 제공
 */
export function useTableColumns({
  onEdit,
  onDelete,
  onView,
}: UseTableColumnsProps = {}): ColumnDef<Task>[] {
  return useMemo(() => {
    const columns: ColumnDef<Task>[] = [
      // 제목 컬럼
      {
        accessorFn: (row) => row.getTitle(),
        id: 'title',
        header: '제목',
        cell: ({ row }) => {
          const task = row.original
          const title = task.getTitle()
          const description = task.getDescription()
          return (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onView?.(task)}
                className="text-left font-medium text-gray-900 hover:text-blue-600 transition-colors"
              >
                {title}
              </button>
              {description && (
                <span className="text-xs text-gray-500 line-clamp-1">
                  {description}
                </span>
              )}
            </div>
          )
        },
        size: 300,
      },

      // 상태 컬럼
      {
        accessorFn: (row) => row.getStatus(),
        id: 'status',
        header: '상태',
        cell: ({ row }) => {
          const task = row.original
          const status = task.getStatus()
          const statusConfig = {
            todo: { label: '할 일', className: 'bg-gray-100 text-gray-700' },
            in_progress: { label: '진행 중', className: 'bg-blue-100 text-blue-700' },
            review: { label: '검토 중', className: 'bg-yellow-100 text-yellow-700' },
            done: { label: '완료', className: 'bg-green-100 text-green-700' },
            cancelled: { label: '취소됨', className: 'bg-red-100 text-red-700' },
          }

          const config = statusConfig[status]
          return (
            <Badge className={cn('font-normal', config.className)}>
              {config.label}
            </Badge>
          )
        },
        size: 120,
      },

      // 우선순위 컬럼
      {
        accessorFn: (row) => row.getPriority(),
        id: 'priority',
        header: '우선순위',
        cell: ({ row }) => {
          const task = row.original
          const priority = task.getPriority()
          const priorityConfig = {
            low: { label: '낮음', icon: '🔵', className: 'text-gray-500' },
            medium: { label: '보통', icon: '🟢', className: 'text-blue-500' },
            high: { label: '높음', icon: '🟡', className: 'text-orange-500' },
            urgent: { label: '긴급', icon: '🔴', className: 'text-red-500' },
          }

          const config = priorityConfig[priority]
          return (
            <div className={cn('flex items-center gap-1.5', config.className)}>
              <Flag className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{config.label}</span>
            </div>
          )
        },
        size: 100,
      },

      // 담당자 컬럼
      {
        accessorFn: (row) => row.getAssignedTo(),
        id: 'assignedTo',
        header: '담당자',
        cell: ({ row }) => {
          const task = row.original
          const assignedTo = task.getAssignedTo()
          
          if (!assignedTo) {
            return <span className="text-gray-400 text-sm">미할당</span>
          }

          // 실제 구현에서는 사용자 정보를 가져와야 함
          const getInitials = (name: string) => {
            return name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          }

          return (
            <div className="flex items-center gap-2" title={assignedTo}>
              <Avatar className="h-7 w-7">
                <AvatarImage src={`/api/avatar/${assignedTo}`} />
                <AvatarFallback className="text-xs">
                  {getInitials(assignedTo)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-700">{assignedTo}</span>
            </div>
          )
        },
        size: 150,
      },

      // 진행률 컬럼
      {
        accessorFn: (row) => {
          // 진행률 계산 로직 (실제 구현 시 태스크의 서브태스크나 체크리스트 기반으로 계산)
          const status = row.getStatus()
          if (status === 'done') return 100
          if (status === 'cancelled') return 0
          if (status === 'in_progress') return 50
          if (status === 'review') return 75
          return 0
        },
        id: 'progress',
        header: '진행률',
        cell: ({ row }) => {
          const task = row.original
          const status = task.getStatus()
          let progress = 0
          if (status === 'done') progress = 100
          else if (status === 'cancelled') progress = 0
          else if (status === 'in_progress') progress = 50
          else if (status === 'review') progress = 75
          
          return (
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 min-w-[35px] text-right">
                {progress}%
              </span>
            </div>
          )
        },
        size: 120,
      },

      // 마감일 컬럼
      {
        accessorFn: (row) => row.getDueDate(),
        id: 'dueDate',
        header: '마감일',
        cell: ({ row }) => {
          const task = row.original
          const dueDate = task.getDueDate()
          
          if (!dueDate) {
            return <span className="text-gray-400 text-sm">미설정</span>
          }

          const date = dueDate
          const now = new Date()
          const isOverdue = date < now && task.getStatus() !== 'done'
          const isToday = date.toDateString() === now.toDateString()
          const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString()

          return (
            <div
              className={cn(
                'flex items-center gap-1.5 text-sm',
                isOverdue && 'text-red-600',
                isToday && 'text-orange-600',
                isTomorrow && 'text-yellow-600'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(date, 'MM월 dd일', { locale: ko })}</span>
            </div>
          )
        },
        size: 120,
      },

      // 예상 시간 컬럼
      {
        accessorFn: (row) => row.getEstimatedHours(),
        id: 'estimatedHours',
        header: '예상 시간',
        cell: ({ row }) => {
          const task = row.original
          const hours = task.getEstimatedHours()
          
          if (!hours) {
            return <span className="text-gray-400 text-sm">-</span>
          }

          return (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Clock className="h-3.5 w-3.5" />
              <span>{hours}시간</span>
            </div>
          )
        },
        size: 100,
      },

      // 프로젝트 컬럼
      {
        accessorFn: (row) => row.getProjectId(),
        id: 'projectId',
        header: '프로젝트',
        cell: ({ row }) => {
          const task = row.original
          const projectId = task.getProjectId()
          // 실제 구현에서는 프로젝트 정보를 가져와야 함
          return (
            <Badge variant="outline" className="font-normal">
              프로젝트 {projectId.slice(0, 8)}
            </Badge>
          )
        },
        size: 150,
      },

      // 생성일 컬럼
      {
        accessorFn: (row) => row.getCreatedAt(),
        id: 'createdAt',
        header: '생성일',
        cell: ({ row }) => {
          const task = row.original
          const createdAt = task.getCreatedAt()
          return (
            <span className="text-sm text-gray-500">
              {format(createdAt, 'yyyy-MM-dd', { locale: ko })}
            </span>
          )
        },
        size: 100,
      },

      // 수정일 컬럼
      {
        accessorFn: (row) => row.getUpdatedAt(),
        id: 'updatedAt',
        header: '수정일',
        cell: ({ row }) => {
          const task = row.original
          const updatedAt = task.getUpdatedAt()
          return (
            <span className="text-sm text-gray-500">
              {format(updatedAt, 'yyyy-MM-dd HH:mm', { locale: ko })}
            </span>
          )
        },
        size: 140,
      },
    ]

    return columns
  }, [onEdit, onDelete, onView])
}