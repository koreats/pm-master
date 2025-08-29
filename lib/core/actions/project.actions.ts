'use server'

import { revalidatePath } from 'next/cache'
import { ProjectRepository } from '@/lib/core/infrastructure/repositories/ProjectRepository'
import { createProjectSchema, updateProjectSchema, assignProjectSchema } from '@/lib/core/domain/schemas'
import type { Project } from '@/lib/core/domain/entities/Project'

type ActionResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

const projectRepository = new ProjectRepository()

export async function createProject(goalId: string, formData: FormData): Promise<ActionResponse<Project>> {
  try {
    const rawData = {
      goalId,
      title: formData.get('title')?.toString(),
      description: formData.get('description')?.toString() || undefined,
      priority: formData.get('priority')?.toString() as 'low' | 'medium' | 'high' | 'urgent' || 'medium',
      createdBy: formData.get('createdBy')?.toString(),
      assignedTo: formData.get('assignedTo')?.toString() || undefined,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
      endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
    }

    const validatedData = createProjectSchema.parse(rawData)
    const project = await projectRepository.create(validatedData)

    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/goals/${goalId}`)

    return { success: true, data: project }
  } catch (error) {
    console.error('프로젝트 생성 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '프로젝트 생성에 실패했습니다' 
    }
  }
}

export async function updateProject(id: string, formData: FormData): Promise<ActionResponse<Project>> {
  try {
    const rawData = {
      title: formData.get('title')?.toString(),
      description: formData.get('description')?.toString() || undefined,
      status: formData.get('status')?.toString() as 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold' | undefined,
      priority: formData.get('priority')?.toString() as 'low' | 'medium' | 'high' | 'urgent' | undefined,
      progress: formData.get('progress') ? Number(formData.get('progress')) : undefined,
      assignedTo: formData.get('assignedTo')?.toString() || undefined,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
      endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
    }

    const validatedData = updateProjectSchema.parse(rawData)
    const project = await projectRepository.update(id, validatedData)

    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/projects/${id}`)

    return { success: true, data: project }
  } catch (error) {
    console.error('프로젝트 수정 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '프로젝트 수정에 실패했습니다' 
    }
  }
}

export async function updateProjectProgress(id: string, progress: number): Promise<ActionResponse<Project>> {
  try {
    if (progress < 0 || progress > 100) {
      throw new Error('진행률은 0-100 사이여야 합니다')
    }

    const project = await projectRepository.updateProgress(id, progress)

    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/projects/${id}`)

    return { success: true, data: project }
  } catch (error) {
    console.error('프로젝트 진행률 수정 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '프로젝트 진행률 수정에 실패했습니다' 
    }
  }
}

export async function assignProject(id: string, assignedTo: string): Promise<ActionResponse<Project>> {
  try {
    const validatedData = assignProjectSchema.parse({ assignedTo })
    const project = await projectRepository.assign(id, validatedData)

    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/projects/${id}`)

    return { success: true, data: project }
  } catch (error) {
    console.error('프로젝트 할당 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '프로젝트 할당에 실패했습니다' 
    }
  }
}

export async function unassignProject(id: string): Promise<ActionResponse<Project>> {
  try {
    const project = await projectRepository.unassign(id)

    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/projects/${id}`)

    return { success: true, data: project }
  } catch (error) {
    console.error('프로젝트 할당 해제 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '프로젝트 할당 해제에 실패했습니다' 
    }
  }
}

export async function deleteProject(id: string): Promise<ActionResponse<void>> {
  try {
    await projectRepository.delete(id)

    revalidatePath('/dashboard/projects')

    return { success: true }
  } catch (error) {
    console.error('프로젝트 삭제 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '프로젝트 삭제에 실패했습니다' 
    }
  }
}

export async function getProjectsByGoal(goalId: string): Promise<ActionResponse<Project[]>> {
  try {
    const projects = await projectRepository.findByGoalId(goalId)
    return { success: true, data: projects }
  } catch (error) {
    console.error('목표별 프로젝트 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '목표별 프로젝트 조회에 실패했습니다' 
    }
  }
}

export async function getProjectsByAssignedUser(userId: string): Promise<ActionResponse<Project[]>> {
  try {
    const projects = await projectRepository.findByAssignedUser(userId)
    return { success: true, data: projects }
  } catch (error) {
    console.error('할당된 프로젝트 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '할당된 프로젝트 조회에 실패했습니다' 
    }
  }
}

export async function getProjectsByStatus(status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold', goalId?: string): Promise<ActionResponse<Project[]>> {
  try {
    const projects = await projectRepository.findByStatus(status, goalId)
    return { success: true, data: projects }
  } catch (error) {
    console.error('상태별 프로젝트 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '상태별 프로젝트 조회에 실패했습니다' 
    }
  }
}

export async function getOverdueProjects(): Promise<ActionResponse<Project[]>> {
  try {
    const projects = await projectRepository.findOverdue()
    return { success: true, data: projects }
  } catch (error) {
    console.error('지연된 프로젝트 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '지연된 프로젝트 조회에 실패했습니다' 
    }
  }
}

export async function getProjectById(id: string): Promise<ActionResponse<Project | null>> {
  try {
    const project = await projectRepository.findById(id)
    return { success: true, data: project }
  } catch (error) {
    console.error('프로젝트 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '프로젝트 조회에 실패했습니다' 
    }
  }
}

export async function getProjectStats(goalId: string): Promise<ActionResponse<{
  total: number
  planning: number
  in_progress: number
  review: number
  completed: number
  on_hold: number
}>> {
  try {
    const [total, planning, in_progress, review, completed, on_hold] = await Promise.all([
      projectRepository.countByGoalId(goalId),
      projectRepository.countByGoalId(goalId, 'planning'),
      projectRepository.countByGoalId(goalId, 'in_progress'),
      projectRepository.countByGoalId(goalId, 'review'),
      projectRepository.countByGoalId(goalId, 'completed'),
      projectRepository.countByGoalId(goalId, 'on_hold'),
    ])

    return { 
      success: true, 
      data: { total, planning, in_progress, review, completed, on_hold } 
    }
  } catch (error) {
    console.error('프로젝트 통계 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '프로젝트 통계 조회에 실패했습니다' 
    }
  }
}

export async function getUserProjectStats(userId: string): Promise<ActionResponse<{
  total: number
  planning: number
  in_progress: number
  review: number
  completed: number
  on_hold: number
}>> {
  try {
    const [total, planning, in_progress, review, completed, on_hold] = await Promise.all([
      projectRepository.countByAssignedUser(userId),
      projectRepository.countByAssignedUser(userId, 'planning'),
      projectRepository.countByAssignedUser(userId, 'in_progress'),
      projectRepository.countByAssignedUser(userId, 'review'),
      projectRepository.countByAssignedUser(userId, 'completed'),
      projectRepository.countByAssignedUser(userId, 'on_hold'),
    ])

    return { 
      success: true, 
      data: { total, planning, in_progress, review, completed, on_hold } 
    }
  } catch (error) {
    console.error('사용자 프로젝트 통계 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '사용자 프로젝트 통계 조회에 실패했습니다' 
    }
  }
}