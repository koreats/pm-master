'use server'

import { revalidatePath } from 'next/cache'
import { GoalRepository } from '@/lib/core/infrastructure/repositories/GoalRepository'
import { createGoalSchema, updateGoalSchema } from '@/lib/core/domain/schemas'
import { createServerClient } from '@/lib/supabase/server'
import type { Goal } from '@/lib/core/domain/entities/Goal'

type ActionResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

const goalRepository = new GoalRepository()

export async function createGoal(teamId: string, formData: FormData): Promise<ActionResponse<Goal>> {
  try {
    const rawData = {
      teamId,
      title: formData.get('title')?.toString(),
      description: formData.get('description')?.toString() || undefined,
      createdBy: formData.get('createdBy')?.toString(),
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
      endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
    }

    const validatedData = createGoalSchema.parse(rawData)
    const goal = await goalRepository.create(validatedData)

    revalidatePath('/dashboard/goals')
    revalidatePath(`/dashboard/teams/${teamId}`)

    return { success: true, data: goal }
  } catch (error) {
    console.error('목표 생성 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '목표 생성에 실패했습니다' 
    }
  }
}

export async function updateGoal(id: string, formData: FormData): Promise<ActionResponse<Goal>> {
  try {
    const rawData = {
      title: formData.get('title')?.toString(),
      description: formData.get('description')?.toString() || undefined,
      status: formData.get('status')?.toString() as 'active' | 'completed' | 'archived' | undefined,
      progress: formData.get('progress') ? Number(formData.get('progress')) : undefined,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
      endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
    }

    const validatedData = updateGoalSchema.parse(rawData)
    const goal = await goalRepository.update(id, validatedData)

    revalidatePath('/dashboard/goals')
    revalidatePath(`/dashboard/goals/${id}`)

    return { success: true, data: goal }
  } catch (error) {
    console.error('목표 수정 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '목표 수정에 실패했습니다' 
    }
  }
}

export async function updateGoalProgress(id: string, progress: number): Promise<ActionResponse<Goal>> {
  try {
    if (progress < 0 || progress > 100) {
      throw new Error('진행률은 0-100 사이여야 합니다')
    }

    const goal = await goalRepository.updateProgress(id, progress)

    revalidatePath('/dashboard/goals')
    revalidatePath(`/dashboard/goals/${id}`)

    return { success: true, data: goal }
  } catch (error) {
    console.error('목표 진행률 수정 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '목표 진행률 수정에 실패했습니다' 
    }
  }
}

export async function archiveGoal(id: string): Promise<ActionResponse<Goal>> {
  try {
    const goal = await goalRepository.archive(id)

    revalidatePath('/dashboard/goals')
    revalidatePath(`/dashboard/goals/${id}`)

    return { success: true, data: goal }
  } catch (error) {
    console.error('목표 아카이브 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '목표 아카이브에 실패했습니다' 
    }
  }
}

export async function deleteGoal(id: string): Promise<ActionResponse<void>> {
  try {
    await goalRepository.delete(id)

    revalidatePath('/dashboard/goals')

    return { success: true }
  } catch (error) {
    console.error('목표 삭제 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '목표 삭제에 실패했습니다' 
    }
  }
}

export async function getGoalsByTeam(teamId: string): Promise<ActionResponse<Goal[]>> {
  try {
    const goals = await goalRepository.findByTeamId(teamId)
    return { success: true, data: goals }
  } catch (error) {
    console.error('팀 목표 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '팀 목표 조회에 실패했습니다' 
    }
  }
}

export async function getActiveGoalsByTeam(teamId: string): Promise<ActionResponse<Goal[]>> {
  try {
    const goals = await goalRepository.findActiveByTeamId(teamId)
    return { success: true, data: goals }
  } catch (error) {
    console.error('활성 목표 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '활성 목표 조회에 실패했습니다' 
    }
  }
}

export async function getGoalById(id: string): Promise<ActionResponse<Goal | null>> {
  try {
    const goal = await goalRepository.findById(id)
    return { success: true, data: goal }
  } catch (error) {
    console.error('목표 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '목표 조회에 실패했습니다' 
    }
  }
}

export async function getGoalStats(teamId: string): Promise<ActionResponse<{
  total: number
  active: number
  completed: number
  archived: number
}>> {
  try {
    const [total, active, completed, archived] = await Promise.all([
      goalRepository.countByTeamId(teamId),
      goalRepository.countByTeamId(teamId, 'active'),
      goalRepository.countByTeamId(teamId, 'completed'),
      goalRepository.countByTeamId(teamId, 'archived'),
    ])

    return { 
      success: true, 
      data: { total, active, completed, archived } 
    }
  } catch (error) {
    console.error('목표 통계 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '목표 통계 조회에 실패했습니다' 
    }
  }
}