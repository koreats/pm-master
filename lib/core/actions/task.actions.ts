'use server'

import { revalidatePath } from 'next/cache'
import { TaskRepository } from '@/lib/core/infrastructure/repositories/TaskRepository'
import { 
  createTaskSchema, 
  updateTaskSchema, 
  assignTaskSchema,
  updateTaskPositionSchema,
  updateTaskStatusSchema,
  updateTaskTimeSchema,
  bulkUpdateTaskPositionsSchema
} from '@/lib/core/domain/schemas'
import type { Task } from '@/lib/core/domain/entities/Task'

type ActionResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

const taskRepository = new TaskRepository()

export async function createTask(projectId: string, formData: FormData): Promise<ActionResponse<Task>> {
  try {
    const rawData = {
      projectId,
      title: formData.get('title')?.toString(),
      description: formData.get('description')?.toString() || undefined,
      priority: formData.get('priority')?.toString() as 'low' | 'medium' | 'high' | 'urgent' || 'medium',
      createdBy: formData.get('createdBy')?.toString(),
      assignedTo: formData.get('assignedTo')?.toString() || undefined,
      dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
      estimatedHours: formData.get('estimatedHours') ? Number(formData.get('estimatedHours')) : undefined,
      position: formData.get('position') ? Number(formData.get('position')) : undefined,
    }

    const validatedData = createTaskSchema.parse(rawData)
    const task = await taskRepository.create(validatedData)

    revalidatePath('/dashboard/tasks')
    revalidatePath(`/dashboard/projects/${projectId}`)

    return { success: true, data: task }
  } catch (error) {
    console.error('작업 생성 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '작업 생성에 실패했습니다' 
    }
  }
}

export async function updateTask(id: string, formData: FormData): Promise<ActionResponse<Task>> {
  try {
    const rawData = {
      title: formData.get('title')?.toString(),
      description: formData.get('description')?.toString() || undefined,
      status: formData.get('status')?.toString() as 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | undefined,
      priority: formData.get('priority')?.toString() as 'low' | 'medium' | 'high' | 'urgent' | undefined,
      assignedTo: formData.get('assignedTo')?.toString() || undefined,
      dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
      estimatedHours: formData.get('estimatedHours') ? Number(formData.get('estimatedHours')) : undefined,
      actualHours: formData.get('actualHours') ? Number(formData.get('actualHours')) : undefined,
    }

    const validatedData = updateTaskSchema.parse(rawData)
    const task = await taskRepository.update(id, validatedData)

    revalidatePath('/dashboard/tasks')
    revalidatePath(`/dashboard/tasks/${id}`)

    return { success: true, data: task }
  } catch (error) {
    console.error('작업 수정 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '작업 수정에 실패했습니다' 
    }
  }
}

export async function updateTaskStatus(id: string, status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'): Promise<ActionResponse<Task>> {
  try {
    const validatedData = updateTaskStatusSchema.parse({ status })
    const task = await taskRepository.updateStatus(id, validatedData)

    revalidatePath('/dashboard/tasks')
    revalidatePath(`/dashboard/tasks/${id}`)

    return { success: true, data: task }
  } catch (error) {
    console.error('작업 상태 수정 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '작업 상태 수정에 실패했습니다' 
    }
  }
}

export async function updateTaskPosition(id: string, position: number): Promise<ActionResponse<Task>> {
  try {
    const validatedData = updateTaskPositionSchema.parse({ position })
    const task = await taskRepository.updatePosition(id, validatedData)

    revalidatePath('/dashboard/tasks')

    return { success: true, data: task }
  } catch (error) {
    console.error('작업 위치 수정 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '작업 위치 수정에 실패했습니다' 
    }
  }
}

export async function bulkUpdateTaskPositions(updates: Array<{ id: string; position: number }>): Promise<ActionResponse<void>> {
  try {
    const validatedData = bulkUpdateTaskPositionsSchema.parse(updates)
    await taskRepository.bulkUpdatePositions(validatedData)

    revalidatePath('/dashboard/tasks')

    return { success: true }
  } catch (error) {
    console.error('작업 위치 일괄 수정 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '작업 위치 일괄 수정에 실패했습니다' 
    }
  }
}

export async function updateTaskTime(id: string, estimatedHours?: number, actualHours?: number): Promise<ActionResponse<Task>> {
  try {
    const validatedData = updateTaskTimeSchema.parse({ estimatedHours, actualHours })
    const task = await taskRepository.updateTime(id, validatedData)

    revalidatePath('/dashboard/tasks')
    revalidatePath(`/dashboard/tasks/${id}`)

    return { success: true, data: task }
  } catch (error) {
    console.error('작업 시간 수정 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '작업 시간 수정에 실패했습니다' 
    }
  }
}

export async function assignTask(id: string, assignedTo: string): Promise<ActionResponse<Task>> {
  try {
    const validatedData = assignTaskSchema.parse({ assignedTo })
    const task = await taskRepository.assign(id, validatedData)

    revalidatePath('/dashboard/tasks')
    revalidatePath(`/dashboard/tasks/${id}`)

    return { success: true, data: task }
  } catch (error) {
    console.error('작업 할당 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '작업 할당에 실패했습니다' 
    }
  }
}

export async function unassignTask(id: string): Promise<ActionResponse<Task>> {
  try {
    const task = await taskRepository.unassign(id)

    revalidatePath('/dashboard/tasks')
    revalidatePath(`/dashboard/tasks/${id}`)

    return { success: true, data: task }
  } catch (error) {
    console.error('작업 할당 해제 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '작업 할당 해제에 실패했습니다' 
    }
  }
}

export async function deleteTask(id: string): Promise<ActionResponse<void>> {
  try {
    await taskRepository.delete(id)

    revalidatePath('/dashboard/tasks')

    return { success: true }
  } catch (error) {
    console.error('작업 삭제 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '작업 삭제에 실패했습니다' 
    }
  }
}

export async function getTasksByProject(projectId: string): Promise<ActionResponse<Task[]>> {
  try {
    const tasks = await taskRepository.findByProjectId(projectId)
    return { success: true, data: tasks }
  } catch (error) {
    console.error('프로젝트별 작업 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '프로젝트별 작업 조회에 실패했습니다' 
    }
  }
}

export async function getTasksByAssignedUser(userId: string): Promise<ActionResponse<Task[]>> {
  try {
    const tasks = await taskRepository.findByAssignedUser(userId)
    return { success: true, data: tasks }
  } catch (error) {
    console.error('할당된 작업 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '할당된 작업 조회에 실패했습니다' 
    }
  }
}

export async function getTasksByStatus(status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled', projectId?: string): Promise<ActionResponse<Task[]>> {
  try {
    const tasks = await taskRepository.findByStatus(status, projectId)
    return { success: true, data: tasks }
  } catch (error) {
    console.error('상태별 작업 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '상태별 작업 조회에 실패했습니다' 
    }
  }
}

export async function getTasksByPriority(priority: 'low' | 'medium' | 'high' | 'urgent', projectId?: string): Promise<ActionResponse<Task[]>> {
  try {
    const tasks = await taskRepository.findByPriority(priority, projectId)
    return { success: true, data: tasks }
  } catch (error) {
    console.error('우선순위별 작업 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '우선순위별 작업 조회에 실패했습니다' 
    }
  }
}

export async function getOverdueTasks(): Promise<ActionResponse<Task[]>> {
  try {
    const tasks = await taskRepository.findOverdue()
    return { success: true, data: tasks }
  } catch (error) {
    console.error('지연된 작업 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '지연된 작업 조회에 실패했습니다' 
    }
  }
}

export async function getTaskById(id: string): Promise<ActionResponse<Task | null>> {
  try {
    const task = await taskRepository.findById(id)
    return { success: true, data: task }
  } catch (error) {
    console.error('작업 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '작업 조회에 실패했습니다' 
    }
  }
}

export async function getTaskStats(projectId: string): Promise<ActionResponse<{
  total: number
  todo: number
  in_progress: number
  review: number
  done: number
  cancelled: number
}>> {
  try {
    const [total, todo, in_progress, review, done, cancelled] = await Promise.all([
      taskRepository.countByProjectId(projectId),
      taskRepository.countByProjectId(projectId, 'todo'),
      taskRepository.countByProjectId(projectId, 'in_progress'),
      taskRepository.countByProjectId(projectId, 'review'),
      taskRepository.countByProjectId(projectId, 'done'),
      taskRepository.countByProjectId(projectId, 'cancelled'),
    ])

    return { 
      success: true, 
      data: { total, todo, in_progress, review, done, cancelled } 
    }
  } catch (error) {
    console.error('작업 통계 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '작업 통계 조회에 실패했습니다' 
    }
  }
}

export async function getUserTaskStats(userId: string): Promise<ActionResponse<{
  total: number
  todo: number
  in_progress: number
  review: number
  done: number
  cancelled: number
}>> {
  try {
    const [total, todo, in_progress, review, done, cancelled] = await Promise.all([
      taskRepository.countByAssignedUser(userId),
      taskRepository.countByAssignedUser(userId, 'todo'),
      taskRepository.countByAssignedUser(userId, 'in_progress'),
      taskRepository.countByAssignedUser(userId, 'review'),
      taskRepository.countByAssignedUser(userId, 'done'),
      taskRepository.countByAssignedUser(userId, 'cancelled'),
    ])

    return { 
      success: true, 
      data: { total, todo, in_progress, review, done, cancelled } 
    }
  } catch (error) {
    console.error('사용자 작업 통계 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '사용자 작업 통계 조회에 실패했습니다' 
    }
  }
}