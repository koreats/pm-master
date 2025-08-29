import { z } from 'zod'

export const goalStatusSchema = z.enum(['active', 'completed', 'archived'])

export const goalBaseSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  title: z.string().min(1, '목표 제목은 필수입니다').max(200, '목표 제목은 200자를 초과할 수 없습니다'),
  description: z.string().max(2000, '목표 설명은 2000자를 초과할 수 없습니다').optional(),
  status: goalStatusSchema,
  progress: z.number().min(0, '진행률은 0 이상이어야 합니다').max(100, '진행률은 100 이하여야 합니다'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const createGoalSchema = z.object({
  teamId: z.string().uuid(),
  title: z.string().min(1, '목표 제목은 필수입니다').max(200, '목표 제목은 200자를 초과할 수 없습니다'),
  description: z.string().max(2000, '목표 설명은 2000자를 초과할 수 없습니다').optional(),
  createdBy: z.string().uuid(),
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

export const updateGoalSchema = z.object({
  title: z.string().min(1, '목표 제목은 필수입니다').max(200, '목표 제목은 200자를 초과할 수 없습니다').optional(),
  description: z.string().max(2000, '목표 설명은 2000자를 초과할 수 없습니다').optional(),
  status: goalStatusSchema.optional(),
  progress: z.number().min(0, '진행률은 0 이상이어야 합니다').max(100, '진행률은 100 이하여야 합니다').optional(),
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

export type GoalStatus = z.infer<typeof goalStatusSchema>
export type GoalBase = z.infer<typeof goalBaseSchema>
export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>