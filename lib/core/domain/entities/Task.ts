import { BaseEntity, CommonProps } from './BaseEntity'
import { Project } from './Project'
import type { Database } from '@/types/supabase'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskProps extends CommonProps {
  projectId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo?: string
  dueDate?: Date
  estimatedHours?: number
  actualHours?: number
  position: number
  createdBy: string
}

export class Task extends BaseEntity<TaskProps> {
  constructor(props: TaskProps) {
    super(props)
  }

  static create(params: {
    id: string
    projectId: string
    title: string
    description?: string
    createdBy: string
    assignedTo?: string
    priority?: TaskPriority
    dueDate?: Date
    estimatedHours?: number
    position?: number
  }): Task {
    return new Task({
      id: params.id,
      projectId: params.projectId,
      title: params.title,
      description: params.description,
      status: 'todo',
      priority: params.priority || 'medium',
      assignedTo: params.assignedTo,
      dueDate: params.dueDate,
      estimatedHours: params.estimatedHours,
      actualHours: undefined,
      position: params.position || 0,
      createdBy: params.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  getProjectId(): string {
    return this.props.projectId
  }

  getTitle(): string {
    return this.props.title
  }

  getDescription(): string | undefined {
    return this.props.description
  }

  getStatus(): TaskStatus {
    return this.props.status
  }

  getPriority(): TaskPriority {
    return this.props.priority
  }

  getAssignedTo(): string | undefined {
    return this.props.assignedTo
  }

  getDueDate(): Date | undefined {
    return this.props.dueDate
  }

  getEstimatedHours(): number | undefined {
    return this.props.estimatedHours
  }

  getActualHours(): number | undefined {
    return this.props.actualHours
  }

  getPosition(): number {
    return this.props.position
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

  updateStatus(status: TaskStatus): void {
    const oldStatus = this.props.status
    ;(this.props as any).status = status
    this.updateTimestamp()

    if (status === 'in_progress' && oldStatus === 'todo') {
      this.recordStartTime()
    } else if (status === 'done' && oldStatus !== 'done') {
      this.recordCompletionTime()
    }
  }

  updatePriority(priority: TaskPriority): void {
    ;(this.props as any).priority = priority
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

  updateDueDate(dueDate?: Date): void {
    ;(this.props as any).dueDate = dueDate
    this.updateTimestamp()
  }

  updateEstimatedHours(hours?: number): void {
    ;(this.props as any).estimatedHours = hours && hours > 0 ? hours : undefined
    this.updateTimestamp()
  }

  updateActualHours(hours?: number): void {
    ;(this.props as any).actualHours = hours && hours > 0 ? hours : undefined
    this.updateTimestamp()
  }

  updatePosition(position: number): void {
    ;(this.props as any).position = position
    this.updateTimestamp()
  }

  moveToPosition(newPosition: number): void {
    this.updatePosition(newPosition)
  }

  moveUp(): void {
    if (this.props.position > 0) {
      this.updatePosition(this.props.position - 1)
    }
  }

  moveDown(): void {
    this.updatePosition(this.props.position + 1)
  }

  isTodo(): boolean {
    return this.props.status === 'todo'
  }

  isInProgress(): boolean {
    return this.props.status === 'in_progress'
  }

  isInReview(): boolean {
    return this.props.status === 'review'
  }

  isDone(): boolean {
    return this.props.status === 'done'
  }

  isCancelled(): boolean {
    return this.props.status === 'cancelled'
  }

  isCompleted(): boolean {
    return this.isDone() || this.isCancelled()
  }

  isOverdue(): boolean {
    if (!this.props.dueDate || this.isCompleted()) {
      return false
    }
    return new Date() > this.props.dueDate
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

  getDaysUntilDue(): number | null {
    if (!this.props.dueDate || this.isCompleted()) {
      return null
    }
    const today = new Date()
    const timeDiff = this.props.dueDate.getTime() - today.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  getVarianceHours(): number | null {
    if (!this.props.estimatedHours || !this.props.actualHours) {
      return null
    }
    return this.props.actualHours - this.props.estimatedHours
  }

  isOverEstimate(): boolean {
    const variance = this.getVarianceHours()
    return variance !== null && variance > 0
  }

  isUnderEstimate(): boolean {
    const variance = this.getVarianceHours()
    return variance !== null && variance < 0
  }

  private recordStartTime(): void {
  }

  private recordCompletionTime(): void {
  }
}