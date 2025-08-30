'use client'

import React, { memo, useState, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
  CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { KanbanViewProps } from '@/lib/views/types'
import type { Task, TaskStatus } from '@/lib/core/domain/entities/Task'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { cn } from '@/lib/utils'

/**
 * 칸반 뷰 컴포넌트
 * @dnd-kit을 활용한 드래그앤드롭 칸반 보드
 */
export const KanbanView = memo(function KanbanView({
  data = [],
  config,
  loading,
  error,
  onItemClick,
  onItemUpdate,
  onItemDelete,
  onCardMove,
  enableDragDrop = true,
  className,
}: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  // 포인터 센서 설정 - 모바일과 데스크톱 모두 지원
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 움직여야 드래그 시작
      },
    })
  )

  // 칸반 컬럼 정의
  const columns: Array<{
    id: TaskStatus
    title: string
    color: string
    limit?: number
  }> = [
    { id: 'todo', title: '할 일', color: 'bg-gray-100 border-gray-300', limit: 20 },
    { id: 'in_progress', title: '진행 중', color: 'bg-blue-50 border-blue-300', limit: 5 },
    { id: 'review', title: '검토 중', color: 'bg-yellow-50 border-yellow-300', limit: 10 },
    { id: 'done', title: '완료', color: 'bg-green-50 border-green-300' },
    { id: 'cancelled', title: '취소됨', color: 'bg-red-50 border-red-300' },
  ]

  // 상태별로 태스크 그룹화
  const tasksByStatus = useMemo(() => {
    const grouped = new Map<TaskStatus, Task[]>()
    
    // 모든 컬럼 초기화
    columns.forEach(col => {
      grouped.set(col.id, [])
    })

    // 태스크 분류
    data.forEach(task => {
      const status = task.getStatus()
      const tasks = grouped.get(status) || []
      tasks.push(task)
      grouped.set(status, tasks)
    })

    // 각 컬럼 내에서 position으로 정렬
    grouped.forEach((tasks, status) => {
      tasks.sort((a, b) => a.getPosition() - b.getPosition())
    })

    return grouped
  }, [data, columns])

  // 드래그 중인 태스크 찾기
  const activeTask = useMemo(
    () => (activeId ? data.find(task => task.getId() === activeId) : null),
    [activeId, data]
  )

  // 드래그 시작
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // 드래그 오버
  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null)
  }

  // 드래그 종료
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !onCardMove) {
      setActiveId(null)
      setOverId(null)
      return
    }

    const activeTaskId = active.id as string
    const overData = over.data.current

    // 컬럼으로 드롭한 경우
    if (overData?.type === 'column') {
      const newStatus = overData.status as TaskStatus
      const tasksInColumn = tasksByStatus.get(newStatus) || []
      const newPosition = tasksInColumn.length

      await onCardMove(activeTaskId, newStatus, newPosition)
    }
    // 다른 카드 위로 드롭한 경우
    else if (overData?.type === 'task') {
      const overTask = data.find(t => t.getId() === over.id)
      if (overTask) {
        const newStatus = overTask.getStatus()
        const newPosition = overTask.getPosition()
        
        await onCardMove(activeTaskId, newStatus, newPosition)
      }
    }

    setActiveId(null)
    setOverId(null)
  }

  // 드래그 취소
  const handleDragCancel = () => {
    setActiveId(null)
    setOverId(null)
  }

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
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={cn('w-full h-full overflow-x-auto', className)}>
        <div className="flex gap-4 p-4 min-w-max h-full">
          {columns.map(column => {
            const tasks = tasksByStatus.get(column.id) || []
            const taskIds = tasks.map(t => t.getId())

            return (
              <SortableContext
                key={column.id}
                items={taskIds}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  tasks={tasks}
                  limit={column.limit}
                  isOver={overId === column.id}
                  onTaskClick={onItemClick}
                  onTaskUpdate={onItemUpdate}
                  onTaskDelete={onItemDelete}
                />
              </SortableContext>
            )
          })}
        </div>
      </div>

      {/* 드래그 오버레이 */}
      <DragOverlay>
        {activeTask && (
          <KanbanCard
            task={activeTask}
            isDragging
            onClick={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
})

export default KanbanView