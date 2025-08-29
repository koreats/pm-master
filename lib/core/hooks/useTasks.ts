'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  createTask,
  updateTask,
  updateTaskStatus,
  updateTaskPosition,
  bulkUpdateTaskPositions,
  updateTaskTime,
  assignTask,
  unassignTask,
  deleteTask,
  getTasksByProject,
  getTasksByAssignedUser,
  getTasksByStatus,
  getTasksByPriority,
  getOverdueTasks,
  getTaskById,
  getTaskStats,
  getUserTaskStats
} from '@/lib/core/actions'
import type { Task } from '@/lib/core/domain/entities/Task'


// Query Keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (projectId?: string, filters?: Record<string, any>) => [...taskKeys.lists(), projectId, filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  stats: (projectId: string) => [...taskKeys.all, 'stats', projectId] as const,
  userStats: (userId: string) => [...taskKeys.all, 'userStats', userId] as const,
  assigned: (userId: string) => [...taskKeys.all, 'assigned', userId] as const,
  overdue: () => [...taskKeys.all, 'overdue'] as const,
}

// Query Hooks
export function useTasks(projectId: string) {
  return useQuery({
    queryKey: taskKeys.list(projectId),
    queryFn: async () => {
      const response = await getTasksByProject(projectId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data || []
    },
    staleTime: 30 * 1000, // 작업은 더 자주 업데이트 (30초)
    gcTime: 5 * 60 * 1000,
  })
}

export function useAssignedTasks(userId: string) {
  return useQuery({
    queryKey: taskKeys.assigned(userId),
    queryFn: async () => {
      const response = await getTasksByAssignedUser(userId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data || []
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useTasksByStatus(
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled',
  projectId?: string
) {
  return useQuery({
    queryKey: taskKeys.list(projectId, { status }),
    queryFn: async () => {
      const response = await getTasksByStatus(status, projectId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data || []
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useTasksByPriority(
  priority: 'low' | 'medium' | 'high' | 'urgent',
  projectId?: string
) {
  return useQuery({
    queryKey: taskKeys.list(projectId, { priority }),
    queryFn: async () => {
      const response = await getTasksByPriority(priority, projectId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data || []
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useOverdueTasks() {
  return useQuery({
    queryKey: taskKeys.overdue(),
    queryFn: async () => {
      const response = await getOverdueTasks()
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data || []
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: taskKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      const response = await getTaskById(id)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useTaskStats(projectId: string) {
  return useQuery({
    queryKey: taskKeys.stats(projectId),
    queryFn: async () => {
      const response = await getTaskStats(projectId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useUserTaskStats(userId: string) {
  return useQuery({
    queryKey: taskKeys.userStats(userId),
    queryFn: async () => {
      const response = await getUserTaskStats(userId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

// Mutation Hooks
export function useCreateTask() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async ({ projectId, formData }: { projectId: string; formData: FormData }) => {
      const response = await createTask(projectId, formData)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(task!.getProjectId()) })
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(task!.getProjectId()) })
      
      if (task!.getAssignedTo()) {
        queryClient.invalidateQueries({ queryKey: taskKeys.assigned(task!.getAssignedTo()!) })
        queryClient.invalidateQueries({ queryKey: taskKeys.userStats(task!.getAssignedTo()!) })
      }

    },
    onError: (error: Error) => {
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await updateTask(id, formData)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task!.getId()) })
      queryClient.invalidateQueries({ queryKey: taskKeys.list(task!.getProjectId()) })
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(task!.getProjectId()) })
      
      if (task!.getAssignedTo()) {
        queryClient.invalidateQueries({ queryKey: taskKeys.assigned(task!.getAssignedTo()!) })
        queryClient.invalidateQueries({ queryKey: taskKeys.userStats(task!.getAssignedTo()!) })
      }

    },
    onError: (error: Error) => {
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async ({ 
      id, 
      status 
    }: { 
      id: string; 
      status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' 
    }) => {
      const response = await updateTaskStatus(id, status)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task!.getId()) })
      queryClient.invalidateQueries({ queryKey: taskKeys.list(task!.getProjectId()) })
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(task!.getProjectId()) })

      const statusMessages = {
        'todo': '할 일',
        'in_progress': '진행 중',
        'review': '리뷰',
        'done': '완료',
        'cancelled': '취소됨'
      }

    },
    onError: (error: Error) => {
    },
  })
}

export function useUpdateTaskPosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, position }: { id: string; position: number }) => {
      const response = await updateTaskPosition(id, position)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(task!.getProjectId()) })
    },
  })
}

export function useBulkUpdateTaskPositions() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; position: number }>) => {
      const response = await bulkUpdateTaskPositions(updates)
      if (!response.success) {
        throw new Error(response.error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
    onError: (error: Error) => {
    },
  })
}

export function useUpdateTaskTime() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async ({ 
      id, 
      estimatedHours, 
      actualHours 
    }: { 
      id: string; 
      estimatedHours?: number; 
      actualHours?: number 
    }) => {
      const response = await updateTaskTime(id, estimatedHours, actualHours)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task!.getId()) })
      queryClient.invalidateQueries({ queryKey: taskKeys.list(task!.getProjectId()) })

    },
    onError: (error: Error) => {
    },
  })
}

export function useAssignTask() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async ({ id, assignedTo }: { id: string; assignedTo: string }) => {
      const response = await assignTask(id, assignedTo)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task!.getId()) })
      queryClient.invalidateQueries({ queryKey: taskKeys.list(task!.getProjectId()) })
      queryClient.invalidateQueries({ queryKey: taskKeys.assigned(task!.getAssignedTo()!) })
      queryClient.invalidateQueries({ queryKey: taskKeys.userStats(task!.getAssignedTo()!) })

    },
    onError: (error: Error) => {
    },
  })
}

export function useUnassignTask() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await unassignTask(id)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task!.getId()) })
      queryClient.invalidateQueries({ queryKey: taskKeys.list(task!.getProjectId()) })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })

    },
    onError: (error: Error) => {
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteTask(id)
      if (!response.success) {
        throw new Error(response.error)
      }
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })

    },
    onError: (error: Error) => {
    },
  })
}