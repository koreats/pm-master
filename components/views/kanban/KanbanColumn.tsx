'use client'

import React, { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task, TaskStatus } from '@/lib/core/domain/entities/Task'
import { KanbanCard } from './KanbanCard'
import { cn } from '@/lib/utils'
import { Plus, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  color: string
  tasks: Task[]
  limit?: number
  isOver?: boolean
  onTaskClick?: (task: Task) => void
  onTaskUpdate?: (task: Task) => Promise<void>
  onTaskDelete?: (taskId: string) => Promise<void>
  onAddTask?: (status: TaskStatus) => void
}

/**
 * 칸반 컬럼 컴포넌트
 * 드롭 가능한 영역과 태스크 카드들을 포함
 */
export const KanbanColumn = memo(function KanbanColumn({
  id,
  title,
  color,
  tasks,
  limit,
  isOver = false,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver: isDraggingOver } = useDroppable({
    id,
    data: {
      type: 'column',
      status: id,
    },
  })

  const taskIds = tasks.map(task => task.getId())
  const isAtLimit = limit && tasks.length >= limit
  const taskCount = tasks.length

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-80 h-full rounded-lg border-2 transition-all',
        color,
        (isDraggingOver || isOver) && 'ring-2 ring-blue-400 ring-offset-2',
        isAtLimit && 'opacity-90'
      )}
    >
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between p-3 border-b bg-white/50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span
            className={cn(
              'inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full',
              isAtLimit ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            )}
          >
            {taskCount}
            {limit && ` / ${limit}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onAddTask && !isAtLimit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddTask(id)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 태스크 목록 */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.getId()}
              task={task}
              onClick={() => onTaskClick?.(task)}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
            />
          ))}
        </SortableContext>

        {/* 빈 상태 */}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">태스크가 없습니다</p>
            {onAddTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddTask(id)}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                태스크 추가
              </Button>
            )}
          </div>
        )}

        {/* 드롭 영역 표시 */}
        {(isDraggingOver || isOver) && tasks.length > 0 && (
          <div className="h-24 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/50 flex items-center justify-center">
            <p className="text-sm text-blue-600">여기에 놓기</p>
          </div>
        )}
      </div>

      {/* 컬럼 푸터 (선택적) */}
      {isAtLimit && (
        <div className="p-2 border-t bg-red-50 text-center">
          <p className="text-xs text-red-600 font-medium">
            최대 {limit}개 제한에 도달했습니다
          </p>
        </div>
      )}
    </div>
  )
})

export default KanbanColumn