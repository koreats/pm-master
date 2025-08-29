import { createServerClient } from '@/lib/supabase/server'
import { Project } from '@/lib/core/domain/entities/Project'
import { CreateProjectInput, UpdateProjectInput, AssignProjectInput, UpdateProjectProgressInput } from '@/lib/core/domain/schemas'
import type { Database } from '@/types/supabase'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export class ProjectRepository {
  private async getSupabase() {
    return await createServerClient()
  }

  private mapRowToEntity(row: ProjectRow): Project {
    return new Project({
      id: row.id,
      goalId: row.goal_id,
      title: row.title,
      description: row.description,
      status: row.status as 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold',
      priority: row.priority as 'low' | 'medium' | 'high' | 'urgent',
      progress: row.progress,
      startDate: row.start_date ? new Date(row.start_date) : undefined,
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      createdBy: row.created_by,
      assignedTo: row.assigned_to,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    })
  }

  private mapEntityToInsert(input: CreateProjectInput, id: string): ProjectInsert {
    return {
      id,
      goal_id: input.goalId,
      title: input.title,
      description: input.description,
      status: 'planning',
      priority: input.priority,
      progress: 0,
      start_date: input.startDate?.toISOString(),
      end_date: input.endDate?.toISOString(),
      created_by: input.createdBy,
      assigned_to: input.assignedTo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  private mapUpdateToRow(input: UpdateProjectInput): ProjectUpdate {
    return {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      progress: input.progress,
      assigned_to: input.assignedTo,
      start_date: input.startDate?.toISOString(),
      end_date: input.endDate?.toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const id = crypto.randomUUID()
    const insertData = this.mapEntityToInsert(input, id)
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single()

    if (error) throw new Error(`프로젝트 생성 실패: ${error.message}`)
    if (!data) throw new Error('프로젝트 생성 후 데이터를 가져올 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async findById(id: string): Promise<Project | null> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`프로젝트 조회 실패: ${error.message}`)
    }

    return data ? this.mapRowToEntity(data) : null
  }

  async findByGoalId(goalId: string): Promise<Project[]> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`목표별 프로젝트 조회 실패: ${error.message}`)

    return data.map(row => this.mapRowToEntity(row))
  }

  async findByAssignedUser(userId: string): Promise<Project[]> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`할당된 프로젝트 조회 실패: ${error.message}`)

    return data.map(row => this.mapRowToEntity(row))
  }

  async findByStatus(status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold', goalId?: string): Promise<Project[]> {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('projects')
      .select('*')
      .eq('status', status)

    if (goalId) {
      query = query.eq('goal_id', goalId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw new Error(`상태별 프로젝트 조회 실패: ${error.message}`)

    return data.map(row => this.mapRowToEntity(row))
  }

  async findOverdue(): Promise<Project[]> {
    const now = new Date().toISOString()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .lt('end_date', now)
      .neq('status', 'completed')
      .order('end_date', { ascending: true })

    if (error) throw new Error(`지연된 프로젝트 조회 실패: ${error.message}`)

    return data.map(row => this.mapRowToEntity(row))
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const updateData = this.mapUpdateToRow(input)
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`프로젝트 수정 실패: ${error.message}`)
    if (!data) throw new Error('프로젝트를 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async updateProgress(id: string, progress: number): Promise<Project> {
    const status = progress === 100 ? 'completed' : undefined
    const updateData: any = {
      progress,
      updated_at: new Date().toISOString()
    }
    
    if (status) {
      updateData.status = status
    }
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`프로젝트 진행률 수정 실패: ${error.message}`)
    if (!data) throw new Error('프로젝트를 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async assign(id: string, input: AssignProjectInput): Promise<Project> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('projects')
      .update({
        assigned_to: input.assignedTo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`프로젝트 할당 실패: ${error.message}`)
    if (!data) throw new Error('프로젝트를 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async unassign(id: string): Promise<Project> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('projects')
      .update({
        assigned_to: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`프로젝트 할당 해제 실패: ${error.message}`)
    if (!data) throw new Error('프로젝트를 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`프로젝트 삭제 실패: ${error.message}`)
  }

  async countByGoalId(goalId: string, status?: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold'): Promise<number> {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('goal_id', goalId)

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query

    if (error) throw new Error(`프로젝트 개수 조회 실패: ${error.message}`)

    return count || 0
  }

  async countByAssignedUser(userId: string, status?: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold'): Promise<number> {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', userId)

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query

    if (error) throw new Error(`할당된 프로젝트 개수 조회 실패: ${error.message}`)

    return count || 0
  }
}