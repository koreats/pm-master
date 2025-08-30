'use client'

import React, { memo, useState, useMemo } from 'react'
import type { ListViewProps } from '@/lib/views/types'
import type { Task } from '@/lib/core/domain/entities/Task'
import type { Project } from '@/lib/core/domain/entities/Project'
import type { Goal } from '@/lib/core/domain/entities/Goal'
import { useTreeData, type TreeNode } from './useTreeData'
import { ListGroup } from './ListGroup'
import { cn } from '@/lib/utils'
import { 
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2,
  Layers,
  Filter,
  SortAsc,
  Search,
  Target,
  FolderOpen,
  FileText,
  Plus,
  MoreVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

/**
 * 리스트 뷰 컴포넌트
 * 계층 구조 표시 (Goals → Projects → Tasks)
 */
export const ListView = memo(function ListView({
  data = [],
  config,
  loading,
  error,
  onItemClick,
  onItemUpdate,
  onItemDelete,
  onItemCreate,
  groupBy: propGroupBy = 'none',
  defaultExpanded = true,
  showProgress = true,
  className,
}: ListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<'type' | 'status' | 'priority' | 'none'>(propGroupBy)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // 데이터를 타입별로 분리
  const { goals, projects, tasks } = useMemo(() => {
    const goalList: Goal[] = []
    const projectList: Project[] = []
    const taskList: Task[] = []

    data.forEach(item => {
      // Goal 타입 체크 - Goal has getTeamId
      if ('getTeamId' in item && typeof item.getTeamId === 'function') {
        goalList.push(item as unknown as Goal)
      }
      // Project 타입 체크 - Project has getGoalId
      else if ('getGoalId' in item && typeof item.getGoalId === 'function') {
        projectList.push(item as unknown as Project)
      }
      // Task 타입 체크 - Task has getProjectId
      else if ('getProjectId' in item && typeof item.getProjectId === 'function') {
        taskList.push(item as Task)
      }
    })

    return { goals: goalList, projects: projectList, tasks: taskList }
  }, [data])

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let filteredGoals = [...goals]
    let filteredProjects = [...projects]
    let filteredTasks = [...tasks]

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      
      filteredGoals = filteredGoals.filter(item => {
        const title = item.getTitle().toLowerCase()
        const description = item.getDescription()?.toLowerCase() || ''
        return title.includes(query) || description.includes(query)
      })
      
      filteredProjects = filteredProjects.filter(item => {
        const title = item.getTitle().toLowerCase()
        const description = item.getDescription()?.toLowerCase() || ''
        return title.includes(query) || description.includes(query)
      })
      
      filteredTasks = filteredTasks.filter(item => {
        const title = item.getTitle().toLowerCase()
        const description = item.getDescription()?.toLowerCase() || ''
        return title.includes(query) || description.includes(query)
      })
    }

    // 상태 필터
    if (filterStatus) {
      filteredGoals = filteredGoals.filter(item => item.getStatus() === filterStatus)
      filteredProjects = filteredProjects.filter(item => item.getStatus() === filterStatus)
      filteredTasks = filteredTasks.filter(item => item.getStatus() === filterStatus)
    }

    // 우선순위 필터
    if (filterPriority) {
      // Goals don't have priority, so we don't filter them
      filteredProjects = filteredProjects.filter(item => item.getPriority() === filterPriority)
      filteredTasks = filteredTasks.filter(item => item.getPriority() === filterPriority)
    }

    return { 
      goals: filteredGoals, 
      projects: filteredProjects, 
      tasks: filteredTasks 
    }
  }, [goals, projects, tasks, searchQuery, filterStatus, filterPriority])

  // 트리 데이터 훅
  const {
    treeData,
    flattenedTree,
    expandedNodes,
    toggleNode,
    expandAll,
    collapseAll,
    expandToLevel,
  } = useTreeData({
    goals: filteredData.goals,
    projects: filteredData.projects,
    tasks: filteredData.tasks,
    defaultExpanded,
  })

  // 통계 정보
  const stats = useMemo(() => {
    const totalGoals = filteredData.goals.length
    const totalProjects = filteredData.projects.length
    const totalTasks = filteredData.tasks.length
    const completedTasks = filteredData.tasks.filter(
      t => t.getStatus() === 'done' || t.getStatus() === 'completed'
    ).length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalGoals,
      totalProjects,
      totalTasks,
      completedTasks,
      progress,
    }
  }, [filteredData])

  // 노드 클릭 핸들러
  const handleNodeClick = (node: TreeNode) => {
    setSelectedNodeId(node.id)
    onItemClick?.(node.data as Task)
  }

  // 노드 편집 핸들러
  const handleNodeEdit = async (node: TreeNode) => {
    await onItemUpdate?.(node.data as Task)
  }

  // 노드 삭제 핸들러
  const handleNodeDelete = async (node: TreeNode) => {
    await onItemDelete?.(node.id)
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
    <div className={cn('w-full h-full flex flex-col', className)}>
      {/* 툴바 */}
      <div className="p-4 border-b space-y-3">
        {/* 검색 및 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 상태 필터 */}
          <select
            value={filterStatus || ''}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">모든 상태</option>
            <option value="todo">할 일</option>
            <option value="planning">계획 중</option>
            <option value="in_progress">진행 중</option>
            <option value="review">검토 중</option>
            <option value="done">완료</option>
            <option value="cancelled">취소됨</option>
            <option value="on_hold">보류</option>
          </select>

          {/* 우선순위 필터 */}
          <select
            value={filterPriority || ''}
            onChange={(e) => setFilterPriority(e.target.value || null)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">모든 우선순위</option>
            <option value="low">낮음</option>
            <option value="medium">보통</option>
            <option value="high">높음</option>
            <option value="urgent">긴급</option>
          </select>

          {/* 그룹 설정 */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="none">그룹 없음</option>
            <option value="type">타입별</option>
            <option value="status">상태별</option>
            <option value="priority">우선순위별</option>
          </select>
        </div>

        {/* 확장/축소 컨트롤 및 통계 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="h-8"
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              모두 확장
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="h-8"
            >
              <Minimize2 className="h-4 w-4 mr-1" />
              모두 축소
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => expandToLevel(0)}
                className="h-8 px-2"
              >
                L0
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => expandToLevel(1)}
                className="h-8 px-2"
              >
                L1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => expandToLevel(2)}
                className="h-8 px-2"
              >
                L2
              </Button>
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-purple-500" />
              <span>{stats.totalGoals}</span>
            </div>
            <div className="flex items-center gap-1">
              <FolderOpen className="h-4 w-4 text-blue-500" />
              <span>{stats.totalProjects}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-gray-500" />
              <span>{stats.completedTasks}/{stats.totalTasks}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    stats.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
              <span>{stats.progress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 리스트 본체 */}
      <div className="flex-1 overflow-auto">
        {treeData.length > 0 ? (
          <ListGroup
            nodes={treeData}
            expandedNodes={expandedNodes}
            onToggle={toggleNode}
            onItemClick={handleNodeClick}
            onItemEdit={handleNodeEdit}
            onItemDelete={handleNodeDelete}
            selectedNodeId={selectedNodeId}
            showProgress={showProgress}
            groupBy={groupBy}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Layers className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">항목이 없습니다</p>
            <p className="text-sm mt-1">새로운 목표, 프로젝트 또는 태스크를 추가해보세요</p>
            {onItemCreate && (
              <Button
                className="mt-4"
                onClick={() => onItemCreate()}
              >
                <Plus className="h-4 w-4 mr-2" />
                새 항목 추가
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default ListView