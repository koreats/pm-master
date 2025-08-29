import { BaseEntity, CommonProps } from './BaseEntity'
import { Goal } from './Goal'
import type { Database } from '@/types/supabase'

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface ProjectProps extends CommonProps {
  goalId: string
  title: string
  description?: string
  status: ProjectStatus
  priority: ProjectPriority
  progress: number
  startDate?: Date
  endDate?: Date
  createdBy: string
  assignedTo?: string
}

export class Project extends BaseEntity<ProjectProps> {
  constructor(props: ProjectProps) {
    super(props)
  }

  static create(params: {
    id: string
    goalId: string
    title: string
    description?: string
    createdBy: string
    assignedTo?: string
    priority?: ProjectPriority
    startDate?: Date
    endDate?: Date
  }): Project {
    return new Project({
      id: params.id,
      goalId: params.goalId,
      title: params.title,
      description: params.description,
      status: 'planning',
      priority: params.priority || 'medium',
      progress: 0,
      startDate: params.startDate,
      endDate: params.endDate,
      createdBy: params.createdBy,
      assignedTo: params.assignedTo,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  getGoalId(): string {
    return this.props.goalId
  }

  getTitle(): string {
    return this.props.title
  }

  getDescription(): string | undefined {
    return this.props.description
  }

  getStatus(): ProjectStatus {
    return this.props.status
  }

  getPriority(): ProjectPriority {
    return this.props.priority
  }

  getProgress(): number {
    return this.props.progress
  }

  getStartDate(): Date | undefined {
    return this.props.startDate
  }

  getEndDate(): Date | undefined {
    return this.props.endDate
  }

  getCreatedBy(): string {
    return this.props.createdBy
  }

  getAssignedTo(): string | undefined {
    return this.props.assignedTo
  }

  updateTitle(title: string): void {
    ;(this.props as any).title = title
    this.updateTimestamp()
  }

  updateDescription(description?: string): void {
    ;(this.props as any).description = description
    this.updateTimestamp()
  }

  updateStatus(status: ProjectStatus): void {
    ;(this.props as any).status = status
    this.updateTimestamp()

    if (status === 'completed') {
      this.updateProgress(100)
    }
  }

  updatePriority(priority: ProjectPriority): void {
    ;(this.props as any).priority = priority
    this.updateTimestamp()
  }

  updateProgress(progress: number): void {
    const validProgress = Math.max(0, Math.min(100, progress))
    ;(this.props as any).progress = validProgress
    this.updateTimestamp()

    if (validProgress === 100 && this.props.status !== 'completed') {
      this.updateStatus('completed')
    }
  }

  updateDates(startDate?: Date, endDate?: Date): void {
    ;(this.props as any).startDate = startDate
    ;(this.props as any).endDate = endDate
    this.updateTimestamp()
  }

  assignTo(userId: string): void {
    ;(this.props as any).assignedTo = userId
    this.updateTimestamp()
  }

  unassign(): void {
    ;(this.props as any).assignedTo = undefined
    this.updateTimestamp()
  }

  isPlanning(): boolean {
    return this.props.status === 'planning'
  }

  isInProgress(): boolean {
    return this.props.status === 'in_progress'
  }

  isInReview(): boolean {
    return this.props.status === 'review'
  }

  isCompleted(): boolean {
    return this.props.status === 'completed'
  }

  isOnHold(): boolean {
    return this.props.status === 'on_hold'
  }

  isOverdue(): boolean {
    if (!this.props.endDate || this.isCompleted()) {
      return false
    }
    return new Date() > this.props.endDate
  }

  isHighPriority(): boolean {
    return this.props.priority === 'high' || this.props.priority === 'urgent'
  }

  isUrgent(): boolean {
    return this.props.priority === 'urgent'
  }

  isAssigned(): boolean {
    return !!this.props.assignedTo
  }

  isAssignedTo(userId: string): boolean {
    return this.props.assignedTo === userId
  }

  getDaysRemaining(): number | null {
    if (!this.props.endDate || this.isCompleted()) {
      return null
    }
    const today = new Date()
    const timeDiff = this.props.endDate.getTime() - today.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  getDuration(): number | null {
    if (!this.props.startDate || !this.props.endDate) {
      return null
    }
    const timeDiff = this.props.endDate.getTime() - this.props.startDate.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }
}