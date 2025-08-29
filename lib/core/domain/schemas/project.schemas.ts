import { z } from 'zod'

export const projectStatusSchema = z.enum(['planning', 'in_progress', 'review', 'completed', 'on_hold'])
export const projectPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

export const projectBaseSchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  title: z.string().min(1, '프로젝트 제목은 필수입니다').max(200, '프로젝트 제목은 200자를 초과할 수 없습니다'),
  description: z.string().max(2000, '프로젝트 설명은 2000자를 초과할 수 없습니다').optional(),
  status: projectStatusSchema,
  priority: projectPrioritySchema,
  progress: z.number().min(0, '진행률은 0 이상이어야 합니다').max(100, '진행률은 100 이하여야 합니다'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  createdBy: z.string().uuid(),
  assignedTo: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const createProjectSchema = z.object({
  goalId: z.string().uuid(),
  title: z.string().min(1, '프로젝트 제목은 필수입니다').max(200, '프로젝트 제목은 200자를 초과할 수 없습니다'),
  description: z.string().max(2000, '프로젝트 설명은 2000자를 초과할 수 없습니다').optional(),
  priority: projectPrioritySchema.default('medium'),
  createdBy: z.string().uuid(),
  assignedTo: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate
  }
  return true
}, {
  message: '종료 날짜는 시작 날짜보다 늦어야 합니다',
  path: ['endDate']
})

export const updateProjectSchema = z.object({
  title: z.string().min(1, '프로젝트 제목은 필수입니다').max(200, '프로젝트 제목은 200자를 초과할 수 없습니다').optional(),
  description: z.string().max(2000, '프로젝트 설명은 2000자를 초과할 수 없습니다').optional(),
  status: projectStatusSchema.optional(),
  priority: projectPrioritySchema.optional(),
  progress: z.number().min(0, '진행률은 0 이상이어야 합니다').max(100, '진행률은 100 이하여야 합니다').optional(),
  assignedTo: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate
  }
  return true
}, {
  message: '종료 날짜는 시작 날짜보다 늦어야 합니다',
  path: ['endDate']
})

export const assignProjectSchema = z.object({
  assignedTo: z.string().uuid()
})

export const updateProjectProgressSchema = z.object({
  progress: z.number().min(0, '진행률은 0 이상이어야 합니다').max(100, '진행률은 100 이하여야 합니다')
})

export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type ProjectPriority = z.infer<typeof projectPrioritySchema>
export type ProjectBase = z.infer<typeof projectBaseSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type AssignProjectInput = z.infer<typeof assignProjectSchema>
export type UpdateProjectProgressInput = z.infer<typeof updateProjectProgressSchema>