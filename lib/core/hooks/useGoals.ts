'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  createGoal,
  updateGoal,
  updateGoalProgress,
  archiveGoal,
  deleteGoal,
  getGoalsByTeam,
  getActiveGoalsByTeam,
  getGoalById,
  getGoalStats
} from '@/lib/core/actions'
import type { Goal } from '@/lib/core/domain/entities/Goal'

// Query Keys
export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: (teamId: string, filters?: Record<string, any>) => [...goalKeys.lists(), teamId, filters] as const,
  details: () => [...goalKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalKeys.details(), id] as const,
  stats: (teamId: string) => [...goalKeys.all, 'stats', teamId] as const,
}

// Query Hooks
export function useGoals(teamId: string) {
  return useQuery({
    queryKey: goalKeys.list(teamId),
    queryFn: async () => {
      const response = await getGoalsByTeam(teamId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data || []
    },
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  })
}

export function useActiveGoals(teamId: string) {
  return useQuery({
    queryKey: goalKeys.list(teamId, { status: 'active' }),
    queryFn: async () => {
      const response = await getActiveGoalsByTeam(teamId)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data || []
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useGoal(id: string | null) {
  return useQuery({
    queryKey: goalKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      const response = await getGoalById(id)
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

export function useGoalStats(teamId: string) {
  return useQuery({
    queryKey: goalKeys.stats(teamId),
    queryFn: async () => {
      const response = await getGoalStats(teamId)
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
export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teamId, formData }: { teamId: string; formData: FormData }) => {
      const response = await createGoal(teamId, formData)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (goal) => {
      // 관련된 모든 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: goalKeys.list(goal!.getTeamId()) })
      queryClient.invalidateQueries({ queryKey: goalKeys.stats(goal!.getTeamId()) })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await updateGoal(id, formData)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (goal) => {
      // 특정 목표와 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goal!.getId()) })
      queryClient.invalidateQueries({ queryKey: goalKeys.list(goal!.getTeamId()) })
      queryClient.invalidateQueries({ queryKey: goalKeys.stats(goal!.getTeamId()) })
    },
  })
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const response = await updateGoalProgress(id, progress)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goal!.getId()) })
      queryClient.invalidateQueries({ queryKey: goalKeys.list(goal!.getTeamId()) })
      queryClient.invalidateQueries({ queryKey: goalKeys.stats(goal!.getTeamId()) })
    },
  })
}

export function useArchiveGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await archiveGoal(id)
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goal!.getId()) })
      queryClient.invalidateQueries({ queryKey: goalKeys.list(goal!.getTeamId()) })
      queryClient.invalidateQueries({ queryKey: goalKeys.stats(goal!.getTeamId()) })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteGoal(id)
      if (!response.success) {
        throw new Error(response.error)
      }
      return id
    },
    onSuccess: (id, variables) => {
      // 모든 관련 쿼리 무효화 (teamId는 컨텍스트에서 가져와야 함)
      queryClient.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}