import { createServerClient } from '@/lib/supabase/server'
import { Task } from '@/lib/core/domain/entities/Task'
import { 
  CreateTaskInput, 
  UpdateTaskInput, 
  AssignTaskInput, 
  UpdateTaskPositionInput,
  UpdateTaskStatusInput,
  UpdateTaskTimeInput,
  BulkUpdateTaskPositionsInput 
} from '@/lib/core/domain/schemas'
import type { Database } from '@/types/supabase'

type TaskRow = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export class TaskRepository {
  private async getSupabase() {
    return await createServerClient()
  }

  private mapRowToEntity(row: TaskRow): Task {
    return new Task({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      description: row.description,
      status: row.status as 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled',
      priority: row.priority as 'low' | 'medium' | 'high' | 'urgent',
      assignedTo: row.assigned_to,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
      position: row.position,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    })
  }

  private mapEntityToInsert(input: CreateTaskInput, id: string, position: number): TaskInsert {
    return {
      id,
      project_id: input.projectId,
      title: input.title,
      description: input.description,
      status: 'todo',
      priority: input.priority,
      assigned_to: input.assignedTo,
      due_date: input.dueDate?.toISOString(),
      estimated_hours: input.estimatedHours,
      actual_hours: undefined,
      position,
      created_by: input.createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  private mapUpdateToRow(input: UpdateTaskInput): TaskUpdate {
    return {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigned_to: input.assignedTo,
      due_date: input.dueDate?.toISOString(),
      estimated_hours: input.estimatedHours,
      actual_hours: input.actualHours,
      updated_at: new Date().toISOString(),
    }
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const id = crypto.randomUUID()
    const supabase = await this.getSupabase()
    
    // 새 작업의 position을 계산 (해당 프로젝트의 최대 position + 1)
    const { data: maxPositionData } = await supabase
      .from('tasks')
      .select('position')
      .eq('project_id', input.projectId)
      .order('position', { ascending: false })
      .limit(1)
      .single()
    
    const position = input.position ?? ((maxPositionData?.position ?? -1) + 1)
    const insertData = this.mapEntityToInsert(input, id, position)

    const { data, error } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()
      .single()

    if (error) throw new Error(`작업 생성 실패: ${error.message}`)
    if (!data) throw new Error('작업 생성 후 데이터를 가져올 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async findById(id: string): Promise<Task | null> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`작업 조회 실패: ${error.message}`)
    }

    return data ? this.mapRowToEntity(data) : null
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })

    if (error) throw new Error(`프로젝트별 작업 조회 실패: ${error.message}`)

    return data.map(row => this.mapRowToEntity(row))
  }

  async findByAssignedUser(userId: string): Promise<Task[]> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('due_date', { ascending: true })

    if (error) throw new Error(`할당된 작업 조회 실패: ${error.message}`)

    return data.map(row => this.mapRowToEntity(row))
  }

  async findByStatus(status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled', projectId?: string): Promise<Task[]> {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('status', status)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query.order('position', { ascending: true })

    if (error) throw new Error(`상태별 작업 조회 실패: ${error.message}`)

    return data.map(row => this.mapRowToEntity(row))
  }

  async findOverdue(): Promise<Task[]> {
    const now = new Date().toISOString()
    
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .lt('due_date', now)
      .not('status', 'in', '(done,cancelled)')
      .order('due_date', { ascending: true })

    if (error) throw new Error(`지연된 작업 조회 실패: ${error.message}`)

    return data.map(row => this.mapRowToEntity(row))
  }

  async findByPriority(priority: 'low' | 'medium' | 'high' | 'urgent', projectId?: string): Promise<Task[]> {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('priority', priority)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query.order('position', { ascending: true })

    if (error) throw new Error(`우선순위별 작업 조회 실패: ${error.message}`)

    return data.map(row => this.mapRowToEntity(row))
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const updateData = this.mapUpdateToRow(input)

    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`작업 수정 실패: ${error.message}`)
    if (!data) throw new Error('작업을 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async updateStatus(id: string, input: UpdateTaskStatusInput): Promise<Task> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: input.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`작업 상태 수정 실패: ${error.message}`)
    if (!data) throw new Error('작업을 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async updatePosition(id: string, input: UpdateTaskPositionInput): Promise<Task> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .update({
        position: input.position,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`작업 위치 수정 실패: ${error.message}`)
    if (!data) throw new Error('작업을 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async updateTime(id: string, input: UpdateTaskTimeInput): Promise<Task> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (input.estimatedHours !== undefined) {
      updateData.estimated_hours = input.estimatedHours
    }
    
    if (input.actualHours !== undefined) {
      updateData.actual_hours = input.actualHours
    }

    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`작업 시간 수정 실패: ${error.message}`)
    if (!data) throw new Error('작업을 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async bulkUpdatePositions(input: BulkUpdateTaskPositionsInput): Promise<void> {
    const updates = input.map(item => ({
      id: item.id,
      position: item.position,
      updated_at: new Date().toISOString()
    }))

    const supabase = await this.getSupabase()
    const { error } = await supabase
      .from('tasks')
      .upsert(updates)

    if (error) throw new Error(`작업 위치 일괄 수정 실패: ${error.message}`)
  }

  async assign(id: string, input: AssignTaskInput): Promise<Task> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .update({
        assigned_to: input.assignedTo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`작업 할당 실패: ${error.message}`)
    if (!data) throw new Error('작업을 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async unassign(id: string): Promise<Task> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .update({
        assigned_to: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`작업 할당 해제 실패: ${error.message}`)
    if (!data) throw new Error('작업을 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`작업 삭제 실패: ${error.message}`)
  }

  async countByProjectId(projectId: string, status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'): Promise<number> {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query

    if (error) throw new Error(`작업 개수 조회 실패: ${error.message}`)

    return count || 0
  }

  async countByAssignedUser(userId: string, status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'): Promise<number> {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', userId)

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query

    if (error) throw new Error(`할당된 작업 개수 조회 실패: ${error.message}`)

    return count || 0
  }
}