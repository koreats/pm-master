'use client'

import React, { memo } from 'react'
import type { TreeNode } from './useTreeData'
import { ListItem } from './ListItem'
import { cn } from '@/lib/utils'
import { 
  ChevronRight, 
  ChevronDown,
  Target,
  FolderOpen,
  FileText,
} from 'lucide-react'

interface ListGroupProps {
  nodes: TreeNode[]
  expandedNodes: Set<string>
  onToggle: (nodeId: string) => void
  onItemClick?: (node: TreeNode) => void
  onItemEdit?: (node: TreeNode) => void
  onItemDelete?: (node: TreeNode) => void
  selectedNodeId?: string
  showProgress?: boolean
  groupBy?: 'type' | 'status' | 'priority' | 'none'
  className?: string
}

/**
 * 리스트 그룹 컴포넌트
 * 계층 구조를 그룹으로 표시
 */
export const ListGroup = memo(function ListGroup({
  nodes,
  expandedNodes,
  onToggle,
  onItemClick,
  onItemEdit,
  onItemDelete,
  selectedNodeId,
  showProgress = true,
  groupBy = 'none',
  className,
}: ListGroupProps) {
  // 그룹별로 노드 분류
  const groupedNodes = React.useMemo(() => {
    if (groupBy === 'none') {
      return { all: nodes }
    }

    const groups: Record<string, TreeNode[]> = {}

    nodes.forEach(node => {
      let key: string
      
      switch (groupBy) {
        case 'type':
          key = node.type
          break
        case 'status':
          key = node.status
          break
        case 'priority':
          key = node.priority
          break
        default:
          key = 'all'
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(node)
    })

    return groups
  }, [nodes, groupBy])

  // 그룹 라벨 가져오기
  const getGroupLabel = (key: string) => {
    if (groupBy === 'type') {
      switch (key) {
        case 'goal': return '목표'
        case 'project': return '프로젝트'
        case 'task': return '태스크'
        default: return key
      }
    }
    
    if (groupBy === 'status') {
      const statusLabels: Record<string, string> = {
        todo: '할 일',
        planning: '계획 중',
        in_progress: '진행 중',
        review: '검토 중',
        done: '완료',
        completed: '완료',
        cancelled: '취소됨',
        on_hold: '보류',
      }
      return statusLabels[key] || key
    }
    
    if (groupBy === 'priority') {
      const priorityLabels: Record<string, string> = {
        low: '낮음',
        medium: '보통',
        high: '높음',
        urgent: '긴급',
      }
      return priorityLabels[key] || key
    }
    
    return key
  }

  // 그룹 아이콘 가져오기
  const getGroupIcon = (key: string) => {
    if (groupBy === 'type') {
      switch (key) {
        case 'goal': return Target
        case 'project': return FolderOpen
        case 'task': return FileText
        default: return FileText
      }
    }
    return null
  }

  // 플랫 리스트 렌더링 (계층 구조 유지)
  const renderFlatList = (nodes: TreeNode[]) => {
    const result: JSX.Element[] = []
    
    const traverse = (nodeList: TreeNode[], parentExpanded = true) => {
      if (!parentExpanded) return
      
      nodeList.forEach(node => {
        result.push(
          <ListItem
            key={node.id}
            node={node}
            onToggle={onToggle}
            onClick={onItemClick}
            onEdit={onItemEdit}
            onDelete={onItemDelete}
            isSelected={selectedNodeId === node.id}
            showProgress={showProgress}
          />
        )
        
        if (node.isExpanded && node.children.length > 0) {
          traverse(node.children, node.isExpanded)
        }
      })
    }
    
    traverse(nodes)
    return result
  }

  if (groupBy === 'none') {
    return (
      <div className={cn('w-full', className)}>
        {renderFlatList(nodes)}
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {Object.entries(groupedNodes).map(([key, groupNodes]) => {
        const GroupIcon = getGroupIcon(key)
        const isGroupExpanded = expandedNodes.has(`group-${key}`)
        
        return (
          <div key={key} className="mb-4">
            {/* 그룹 헤더 */}
            <div
              className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 cursor-pointer sticky top-0 z-10"
              onClick={() => onToggle(`group-${key}`)}
            >
              <button className="p-0.5 hover:bg-gray-300 rounded mr-2">
                {isGroupExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {GroupIcon && <GroupIcon className="h-4 w-4 mr-2" />}
              
              <span className="font-medium text-sm">
                {getGroupLabel(key)}
              </span>
              
              <span className="ml-2 text-xs text-gray-500">
                ({groupNodes.length})
              </span>
              
              {/* 그룹 진행률 */}
              {showProgress && (
                <div className="ml-auto flex items-center gap-2">
                  <GroupProgress nodes={groupNodes} />
                </div>
              )}
            </div>
            
            {/* 그룹 아이템 */}
            {isGroupExpanded && (
              <div className="border-l-2 border-gray-200 ml-2">
                {renderFlatList(groupNodes)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

// 그룹 진행률 컴포넌트
const GroupProgress = memo(function GroupProgress({ nodes }: { nodes: TreeNode[] }) {
  const stats = React.useMemo(() => {
    let total = 0
    let completed = 0
    
    const traverse = (nodeList: TreeNode[]) => {
      nodeList.forEach(node => {
        if (node.type === 'task') {
          total++
          if (node.status === 'done' || node.status === 'completed') {
            completed++
          }
        }
        traverse(node.children)
      })
    }
    
    traverse(nodes)
    
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return { total, completed, percentage }
  }, [nodes])
  
  if (stats.total === 0) return null
  
  return (
    <>
      <span className="text-xs text-gray-600">
        {stats.completed}/{stats.total}
      </span>
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all',
            stats.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
          )}
          style={{ width: `${stats.percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-600">
        {stats.percentage}%
      </span>
    </>
  )
})