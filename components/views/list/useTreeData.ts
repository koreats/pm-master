'use client'

import { useMemo, useState, useCallback } from 'react'
import type { Task } from '@/lib/core/domain/entities/Task'
import type { Project } from '@/lib/core/domain/entities/Project'
import type { Goal } from '@/lib/core/domain/entities/Goal'

export interface TreeNode {
  id: string
  type: 'goal' | 'project' | 'task'
  title: string
  description?: string
  status: string
  priority: string
  progress: number
  children: TreeNode[]
  parent?: string
  depth: number
  isExpanded: boolean
  data: Goal | Project | Task
}

interface UseTreeDataProps {
  goals?: Goal[]
  projects?: Project[]
  tasks?: Task[]
  defaultExpanded?: boolean
}

export function useTreeData({
  goals = [],
  projects = [],
  tasks = [],
  defaultExpanded = true,
}: UseTreeDataProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(defaultExpanded ? [...goals.map(g => g.getId()), ...projects.map(p => p.getId())] : [])
  )

  // 계층 구조 데이터 생성
  const treeData = useMemo(() => {
    const nodes: TreeNode[] = []

    // Goal 노드 생성
    goals.forEach(goal => {
      const goalNode: TreeNode = {
        id: goal.getId(),
        type: 'goal',
        title: goal.getTitle(),
        description: goal.getDescription(),
        status: goal.getStatus(),
        priority: 'medium', // Goals don't have priority
        progress: goal.getProgress ? goal.getProgress() : 0,
        children: [],
        depth: 0,
        isExpanded: expandedNodes.has(goal.getId()),
        data: goal,
      }

      // Goal에 속한 Project 추가
      const goalProjects = projects.filter(p => p.getGoalId && p.getGoalId() === goal.getId())
      
      goalProjects.forEach(project => {
        const projectNode: TreeNode = {
          id: project.getId(),
          type: 'project',
          title: project.getTitle(),
          description: project.getDescription(),
          status: project.getStatus(),
          priority: project.getPriority(),
          progress: project.getProgress ? project.getProgress() : 0,
          children: [],
          parent: goal.getId(),
          depth: 1,
          isExpanded: expandedNodes.has(project.getId()),
          data: project,
        }

        // Project에 속한 Task 추가
        const projectTasks = tasks.filter(t => t.getProjectId && t.getProjectId() === project.getId())
        
        projectTasks.forEach(task => {
          const taskNode: TreeNode = {
            id: task.getId(),
            type: 'task',
            title: task.getTitle(),
            description: task.getDescription(),
            status: task.getStatus(),
            priority: task.getPriority(),
            progress: calculateTaskProgress(task),
            children: [],
            parent: project.getId(),
            depth: 2,
            isExpanded: false,
            data: task,
          }
          projectNode.children.push(taskNode)
        })

        goalNode.children.push(projectNode)
      })

      nodes.push(goalNode)
    })

    // Goal에 속하지 않은 Project 추가
    const orphanProjects = projects.filter(p => !p.getGoalId || !p.getGoalId())
    
    orphanProjects.forEach(project => {
      const projectNode: TreeNode = {
        id: project.getId(),
        type: 'project',
        title: project.getTitle(),
        description: project.getDescription(),
        status: project.getStatus(),
        priority: project.getPriority(),
        progress: project.getProgress ? project.getProgress() : 0,
        children: [],
        depth: 0,
        isExpanded: expandedNodes.has(project.getId()),
        data: project,
      }

      // Project에 속한 Task 추가
      const projectTasks = tasks.filter(t => t.getProjectId && t.getProjectId() === project.getId())
      
      projectTasks.forEach(task => {
        const taskNode: TreeNode = {
          id: task.getId(),
          type: 'task',
          title: task.getTitle(),
          description: task.getDescription(),
          status: task.getStatus(),
          priority: task.getPriority(),
          progress: calculateTaskProgress(task),
          children: [],
          parent: project.getId(),
          depth: 1,
          isExpanded: false,
          data: task,
        }
        projectNode.children.push(taskNode)
      })

      nodes.push(projectNode)
    })

    // Project에 속하지 않은 Task 추가
    const orphanTasks = tasks.filter(t => !t.getProjectId || !t.getProjectId())
    
    orphanTasks.forEach(task => {
      const taskNode: TreeNode = {
        id: task.getId(),
        type: 'task',
        title: task.getTitle(),
        description: task.getDescription(),
        status: task.getStatus(),
        priority: task.getPriority(),
        progress: calculateTaskProgress(task),
        children: [],
        depth: 0,
        isExpanded: false,
        data: task,
      }
      nodes.push(taskNode)
    })

    return nodes
  }, [goals, projects, tasks, expandedNodes])

  // Flatten된 트리 (렌더링용)
  const flattenedTree = useMemo(() => {
    const result: TreeNode[] = []
    
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        result.push(node)
        if (node.isExpanded && node.children.length > 0) {
          traverse(node.children)
        }
      })
    }
    
    traverse(treeData)
    return result
  }, [treeData])

  // 노드 확장/축소 토글
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  // 모두 확장
  const expandAll = useCallback(() => {
    const allNodeIds = new Set<string>()
    
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.children.length > 0) {
          allNodeIds.add(node.id)
        }
        traverse(node.children)
      })
    }
    
    traverse(treeData)
    setExpandedNodes(allNodeIds)
  }, [treeData])

  // 모두 축소
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())
  }, [])

  // 특정 레벨까지만 확장
  const expandToLevel = useCallback((level: number) => {
    const nodeIds = new Set<string>()
    
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.depth < level && node.children.length > 0) {
          nodeIds.add(node.id)
        }
        traverse(node.children)
      })
    }
    
    traverse(treeData)
    setExpandedNodes(nodeIds)
  }, [treeData])

  return {
    treeData,
    flattenedTree,
    expandedNodes,
    toggleNode,
    expandAll,
    collapseAll,
    expandToLevel,
  }
}

// Task 진행률 계산
function calculateTaskProgress(task: Task): number {
  const status = task.getStatus()
  
  switch (status) {
    case 'done':
    case 'completed':
      return 100
    case 'in_progress':
      return 50
    case 'review':
      return 75
    case 'cancelled':
      return 0
    default:
      return 0
  }
}