'use client'

import React, { memo } from 'react'
import type { TreeNode } from './useTreeData'
import { cn } from '@/lib/utils'
import { 
  ChevronRight, 
  ChevronDown, 
  Circle, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Calendar,
  User,
  Flag,
  Target,
  FolderOpen,
  FileText,
  Hash,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ListItemProps {
  node: TreeNode
  onToggle: (nodeId: string) => void
  onClick?: (node: TreeNode) => void
  onEdit?: (node: TreeNode) => void
  onDelete?: (node: TreeNode) => void
  isSelected?: boolean
  showProgress?: boolean
  className?: string
}

/**
 * 리스트 아이템 컴포넌트
 * 계층 구조의 개별 항목 표시
 */
export const ListItem = memo(function ListItem({
  node,
  onToggle,
  onClick,
  onEdit,
  onDelete,
  isSelected = false,
  showProgress = true,
  className,
}: ListItemProps) {
  const hasChildren = node.children.length > 0
  const indentWidth = node.depth * 24

  // 타입별 아이콘
  const TypeIcon = node.type === 'goal' ? Target : 
                   node.type === 'project' ? FolderOpen : 
                   FileText

  // 우선순위 색상
  const priorityColors = {
    low: 'text-gray-400',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  }

  // 상태 색상
  const statusColors = {
    todo: { bg: 'bg-gray-100', text: 'text-gray-700', label: '할 일' },
    planning: { bg: 'bg-purple-100', text: 'text-purple-700', label: '계획 중' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: '진행 중' },
    review: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '검토 중' },
    done: { bg: 'bg-green-100', text: 'text-green-700', label: '완료' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: '완료' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: '취소됨' },
    on_hold: { bg: 'bg-orange-100', text: 'text-orange-700', label: '보류' },
  }

  const statusConfig = statusColors[node.status as keyof typeof statusColors] || statusColors.todo

  // Task 전용 속성 가져오기
  const getDueDate = () => {
    if (node.type === 'task' && 'getDueDate' in node.data) {
      const dueDate = node.data.getDueDate()
      return dueDate
    }
    return null
  }

  const getAssignee = () => {
    if ('getAssignedTo' in node.data && node.data.getAssignedTo) {
      return node.data.getAssignedTo()
    }
    return null
  }

  const dueDate = getDueDate()
  const assignee = getAssignee()
  const isOverdue = dueDate && dueDate < new Date() && node.status !== 'done' && node.status !== 'completed'

  return (
    <div
      className={cn(
        'group flex items-center px-2 py-1.5 hover:bg-gray-50 cursor-pointer',
        'border-b border-gray-100',
        isSelected && 'bg-blue-50 hover:bg-blue-100',
        isOverdue && 'bg-red-50',
        className
      )}
      onClick={() => onClick?.(node)}
    >
      {/* 들여쓰기 */}
      <div style={{ width: indentWidth }} />

      {/* 확장/축소 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle(node.id)
        }}
        className={cn(
          'p-0.5 hover:bg-gray-200 rounded',
          !hasChildren && 'invisible'
        )}
      >
        {node.isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* 타입 아이콘 */}
      <TypeIcon className={cn('h-4 w-4 mx-2', 
        node.type === 'goal' && 'text-purple-500',
        node.type === 'project' && 'text-blue-500',
        node.type === 'task' && 'text-gray-500'
      )} />

      {/* 상태 아이콘 */}
      {(node.status === 'done' || node.status === 'completed') ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
      ) : node.status === 'in_progress' ? (
        <Circle className="h-4 w-4 text-blue-500 mr-2" />
      ) : (
        <Circle className="h-4 w-4 text-gray-300 mr-2" />
      )}

      {/* 제목 */}
      <span className={cn(
        'flex-1 text-sm font-medium',
        (node.status === 'done' || node.status === 'completed') && 'line-through text-gray-500'
      )}>
        {node.title}
      </span>

      {/* 메타 정보 */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {/* 우선순위 */}
        <Flag className={cn('h-3 w-3', priorityColors[node.priority as keyof typeof priorityColors])} />

        {/* 상태 배지 */}
        <Badge className={cn(statusConfig.bg, statusConfig.text, 'text-xs')}>
          {statusConfig.label}
        </Badge>

        {/* 진행률 */}
        {showProgress && node.progress > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  node.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                )}
                style={{ width: `${node.progress}%` }}
              />
            </div>
            <span className="text-xs">{node.progress}%</span>
          </div>
        )}

        {/* 마감일 */}
        {dueDate && (
          <div className={cn(
            'flex items-center gap-1',
            isOverdue && 'text-red-600 font-medium'
          )}>
            <Calendar className="h-3 w-3" />
            <span>{format(dueDate, 'MM/dd', { locale: ko })}</span>
          </div>
        )}

        {/* 담당자 */}
        {assignee && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{assignee}</span>
          </div>
        )}

        {/* 자식 수 */}
        {hasChildren && (
          <span className="text-gray-400">
            ({node.children.length})
          </span>
        )}
      </div>

      {/* 액션 버튼 (호버시 표시) */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-2">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(node)
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(node)
            }}
            className="p-1 hover:bg-red-100 rounded text-red-600"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
})