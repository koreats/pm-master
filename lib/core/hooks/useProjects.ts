'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  createProject,
  updateProject,
  updateProjectProgress,
  assignProject,
  unassignProject,
  deleteProject,
  getProjectsByGoal,
  getProjectsByAssignedUser,
  getProjectsByStatus,
  getOverdueProjects,
  getProjectById,
  getProjectStats,
  getUserProjectStats
} from '@/lib/core/actions'
import type { Project } from '@/lib/core/domain/entities/Project'


// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (goalId?: string, filters?: Record<string, any>) => [...projectKeys.lists(), goalId, filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stats: (goalId: string) => [...projectKeys.all, 'stats', goalId] as const,
  userStats: (userId: string) => [...projectKeys.all, 'userStats', userId] as const,
  assigned: (userId: string) => [...projectKeys.all, 'assigned', userId] as const,
  overdue: () => [...projectKeys.all, 'overdue'] as const,
}

// Query Hooks
export function useProjects(goalId: string) {
  return useQuery({
    queryKey: projectKeys.list(goalId),
    queryFn: async () => {
      const response = await getProjectsByGoal(goalId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data || []
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useAssignedProjects(userId: string) {
  return useQuery({
    queryKey: projectKeys.assigned(userId),
    queryFn: async () => {
      const response = await getProjectsByAssignedUser(userId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data || []
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useProjectsByStatus(
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold',
  goalId?: string
) {
  return useQuery({
    queryKey: projectKeys.list(goalId, { status }),
    queryFn: async () => {
      const response = await getProjectsByStatus(status, goalId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data || []
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useOverdueProjects() {
  return useQuery({
    queryKey: projectKeys.overdue(),
    queryFn: async () => {
      const response = await getOverdueProjects()
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data || []
    },
    staleTime: 5 * 60 * 1000, // 지연 프로젝트는 더 자주 업데이트
    gcTime: 10 * 60 * 1000,
  })
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: projectKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      const response = await getProjectById(id)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useProjectStats(goalId: string) {
  return useQuery({
    queryKey: projectKeys.stats(goalId),
    queryFn: async () => {
      const response = await getProjectStats(goalId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useUserProjectStats(userId: string) {
  return useQuery({
    queryKey: projectKeys.userStats(userId),
    queryFn: async () => {
      const response = await getUserProjectStats(userId)
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
export function useCreateProject() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async ({ goalId, formData }: { goalId: string; formData: FormData }) => {
      const response = await createProject(goalId, formData)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list(project!.getGoalId()) })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats(project!.getGoalId()) })
      
      if (project!.getAssignedTo()) {
        queryClient.invalidateQueries({ queryKey: projectKeys.assigned(project!.getAssignedTo()!) })
        queryClient.invalidateQueries({ queryKey: projectKeys.userStats(project!.getAssignedTo()!) })
      }

    },
    onError: (error: Error) => {
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await updateProject(id, formData)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(project!.getId()) })
      queryClient.invalidateQueries({ queryKey: projectKeys.list(project!.getGoalId()) })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats(project!.getGoalId()) })
      
      if (project!.getAssignedTo()) {
        queryClient.invalidateQueries({ queryKey: projectKeys.assigned(project!.getAssignedTo()!) })
        queryClient.invalidateQueries({ queryKey: projectKeys.userStats(project!.getAssignedTo()!) })
      }

    },
    onError: (error: Error) => {
    },
  })
}

export function useUpdateProjectProgress() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const response = await updateProjectProgress(id, progress)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(project!.getId()) })
      queryClient.invalidateQueries({ queryKey: projectKeys.list(project!.getGoalId()) })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats(project!.getGoalId()) })

      const isCompleted = project!.getProgress() === 100
    },
    onError: (error: Error) => {
    },
  })
}

export function useAssignProject() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async ({ id, assignedTo }: { id: string; assignedTo: string }) => {
      const response = await assignProject(id, assignedTo)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(project!.getId()) })
      queryClient.invalidateQueries({ queryKey: projectKeys.list(project!.getGoalId()) })
      queryClient.invalidateQueries({ queryKey: projectKeys.assigned(project!.getAssignedTo()!) })
      queryClient.invalidateQueries({ queryKey: projectKeys.userStats(project!.getAssignedTo()!) })

    },
    onError: (error: Error) => {
    },
  })
}

export function useUnassignProject() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await unassignProject(id)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(project!.getId()) })
      queryClient.invalidateQueries({ queryKey: projectKeys.list(project!.getGoalId()) })
      queryClient.invalidateQueries({ queryKey: projectKeys.all })

    },
    onError: (error: Error) => {
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteProject(id)
      if (!response.success) {
        throw new Error(response.error)
      }
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })

    },
    onError: (error: Error) => {
    },
  })
}