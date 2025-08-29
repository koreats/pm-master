import { BaseEntity, CommonProps } from './BaseEntity'
import type { Database } from '@/types/supabase'

export type GoalStatus = 'active' | 'completed' | 'archived'

export interface GoalProps extends CommonProps {
  teamId: string
  title: string
  description?: string
  status: GoalStatus
  progress: number
  startDate?: Date
  endDate?: Date
  createdBy: string
}

export class Goal extends BaseEntity<GoalProps> {
  constructor(props: GoalProps) {
    super(props)
  }

  static create(params: {
    id: string
    teamId: string
    title: string
    description?: string
    createdBy: string
    startDate?: Date
    endDate?: Date
  }): Goal {
    return new Goal({
      id: params.id,
      teamId: params.teamId,
      title: params.title,
      description: params.description,
      status: 'active',
      progress: 0,
      startDate: params.startDate,
      endDate: params.endDate,
      createdBy: params.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  getTeamId(): string {
    return this.props.teamId
  }

  getTitle(): string {
    return this.props.title
  }

  getDescription(): string | undefined {
    return this.props.description
  }

  getStatus(): GoalStatus {
    return this.props.status
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

  updateTitle(title: string): void {
    ;(this.props as any).title = title
    this.updateTimestamp()
  }

  updateDescription(description?: string): void {
    ;(this.props as any).description = description
    this.updateTimestamp()
  }

  updateStatus(status: GoalStatus): void {
    ;(this.props as any).status = status
    this.updateTimestamp()
  }

  updateProgress(progress: number): void {
    const validProgress = Math.max(0, Math.min(100, progress))
    ;(this.props as any).progress = validProgress
    this.updateTimestamp()
    
    if (validProgress === 100 && this.props.status === 'active') {
      this.updateStatus('completed')
    }
  }

  updateDates(startDate?: Date, endDate?: Date): void {
    ;(this.props as any).startDate = startDate
    ;(this.props as any).endDate = endDate
    this.updateTimestamp()
  }

  isActive(): boolean {
    return this.props.status === 'active'
  }

  isCompleted(): boolean {
    return this.props.status === 'completed'
  }

  isArchived(): boolean {
    return this.props.status === 'archived'
  }

  isOverdue(): boolean {
    if (!this.props.endDate || this.isCompleted()) {
      return false
    }
    return new Date() > this.props.endDate
  }

  getDaysRemaining(): number | null {
    if (!this.props.endDate || this.isCompleted()) {
      return null
    }
    const today = new Date()
    const timeDiff = this.props.endDate.getTime() - today.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }
}