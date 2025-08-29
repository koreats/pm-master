import { z } from 'zod'

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled'])
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

export const taskBaseSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1, '작업 제목은 필수입니다').max(200, '작업 제목은 200자를 초과할 수 없습니다'),
  description: z.string().max(2000, '작업 설명은 2000자를 초과할 수 없습니다').optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  assignedTo: z.string().uuid().optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().min(0.1, '예상 시간은 0.1시간 이상이어야 합니다').max(1000, '예상 시간은 1000시간을 초과할 수 없습니다').optional(),
  actualHours: z.number().min(0.1, '실제 시간은 0.1시간 이상이어야 합니다').max(1000, '실제 시간은 1000시간을 초과할 수 없습니다').optional(),
  position: z.number().min(0, '위치는 0 이상이어야 합니다'),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, '작업 제목은 필수입니다').max(200, '작업 제목은 200자를 초과할 수 없습니다'),
  description: z.string().max(2000, '작업 설명은 2000자를 초과할 수 없습니다').optional(),
  priority: taskPrioritySchema.default('medium'),
  createdBy: z.string().uuid(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().min(0.1, '예상 시간은 0.1시간 이상이어야 합니다').max(1000, '예상 시간은 1000시간을 초과할 수 없습니다').optional(),
  position: z.number().min(0, '위치는 0 이상이어야 합니다').optional(),
}).refine((data) => {
  if (data.dueDate) {
    const now = new Date()
    return data.dueDate > now
  }
  return true
}, {
  message: '마감 날짜는 현재 시간보다 늦어야 합니다',
  path: ['dueDate']
})

export const updateTaskSchema = z.object({
  title: z.string().min(1, '작업 제목은 필수입니다').max(200, '작업 제목은 200자를 초과할 수 없습니다').optional(),
  description: z.string().max(2000, '작업 설명은 2000자를 초과할 수 없습니다').optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().min(0.1, '예상 시간은 0.1시간 이상이어야 합니다').max(1000, '예상 시간은 1000시간을 초과할 수 없습니다').optional(),
  actualHours: z.number().min(0.1, '실제 시간은 0.1시간 이상이어야 합니다').max(1000, '실제 시간은 1000시간을 초과할 수 없습니다').optional(),
})

export const assignTaskSchema = z.object({
  assignedTo: z.string().uuid()
})

export const updateTaskPositionSchema = z.object({
  position: z.number().min(0, '위치는 0 이상이어야 합니다')
})

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema
})

export const updateTaskTimeSchema = z.object({
  estimatedHours: z.number().min(0.1, '예상 시간은 0.1시간 이상이어야 합니다').max(1000, '예상 시간은 1000시간을 초과할 수 없습니다').optional(),
  actualHours: z.number().min(0.1, '실제 시간은 0.1시간 이상이어야 합니다').max(1000, '실제 시간은 1000시간을 초과할 수 없습니다').optional(),
}).refine((data) => {
  if (data.estimatedHours !== undefined && data.actualHours !== undefined) {
    return data.actualHours >= 0 && data.estimatedHours >= 0
  }
  return true
}, {
  message: '시간 값은 모두 0 이상이어야 합니다'
})

export const bulkUpdateTaskPositionsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    position: z.number().min(0, '위치는 0 이상이어야 합니다')
  })
).min(1, '최소 1개의 작업이 필요합니다')

export type TaskStatus = z.infer<typeof taskStatusSchema>
export type TaskPriority = z.infer<typeof taskPrioritySchema>
export type TaskBase = z.infer<typeof taskBaseSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type AssignTaskInput = z.infer<typeof assignTaskSchema>
export type UpdateTaskPositionInput = z.infer<typeof updateTaskPositionSchema>
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>
export type UpdateTaskTimeInput = z.infer<typeof updateTaskTimeSchema>
export type BulkUpdateTaskPositionsInput = z.infer<typeof bulkUpdateTaskPositionsSchema>