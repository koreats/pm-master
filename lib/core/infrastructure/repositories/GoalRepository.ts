import { createServerClient } from '@/lib/supabase/server'
import { Goal } from '@/lib/core/domain/entities/Goal'
import { CreateGoalInput, UpdateGoalInput } from '@/lib/core/domain/schemas'
import type { Database } from '@/types/supabase'

type GoalRow = Database['public']['Tables']['goals']['Row']
type GoalInsert = Database['public']['Tables']['goals']['Insert']
type GoalUpdate = Database['public']['Tables']['goals']['Update']

export class GoalRepository {
  private async getSupabase() {
    return await createServerClient()
  }

  private mapRowToEntity(row: GoalRow): Goal {
    return new Goal({
      id: row.id,
      teamId: row.team_id,
      title: row.title,
      description: row.description,
      status: row.status as 'active' | 'completed' | 'archived',
      progress: row.progress,
      startDate: row.start_date ? new Date(row.start_date) : undefined,
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    })
  }

  private mapEntityToInsert(input: CreateGoalInput, id: string): GoalInsert {
    return {
      id,
      team_id: input.teamId,
      title: input.title,
      description: input.description,
      status: 'active',
      progress: 0,
      start_date: input.startDate?.toISOString(),
      end_date: input.endDate?.toISOString(),
      created_by: input.createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  private mapUpdateToRow(input: UpdateGoalInput): GoalUpdate {
    return {
      title: input.title,
      description: input.description,
      status: input.status,
      progress: input.progress,
      start_date: input.startDate?.toISOString(),
      end_date: input.endDate?.toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  async create(input: CreateGoalInput): Promise<Goal> {
    const id = crypto.randomUUID()
    const insertData = this.mapEntityToInsert(input, id)
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('goals')
      .insert(insertData)
      .select()
      .single()

    if (error) throw new Error(`목표 생성 실패: ${error.message}`)
    if (!data) throw new Error('목표 생성 후 데이터를 가져올 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async findById(id: string): Promise<Goal | null> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`목표 조회 실패: ${error.message}`)
    }

    return data ? this.mapRowToEntity(data) : null
  }

  async findByTeamId(teamId: string): Promise<Goal[]> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`팀 목표 조회 실패: ${error.message}`)

    return data.map(row => this.mapRowToEntity(row))
  }

  async findActiveByTeamId(teamId: string): Promise<Goal[]> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`활성 목표 조회 실패: ${error.message}`)

    return data.map(row => this.mapRowToEntity(row))
  }

  async update(id: string, input: UpdateGoalInput): Promise<Goal> {
    const updateData = this.mapUpdateToRow(input)
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`목표 수정 실패: ${error.message}`)
    if (!data) throw new Error('목표를 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async updateProgress(id: string, progress: number): Promise<Goal> {
    const status = progress === 100 ? 'completed' : 'active'
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('goals')
      .update({ 
        progress, 
        status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`목표 진행률 수정 실패: ${error.message}`)
    if (!data) throw new Error('목표를 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async archive(id: string): Promise<Goal> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('goals')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`목표 아카이브 실패: ${error.message}`)
    if (!data) throw new Error('목표를 찾을 수 없습니다')

    return this.mapRowToEntity(data)
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`목표 삭제 실패: ${error.message}`)
  }

  async countByTeamId(teamId: string, status?: 'active' | 'completed' | 'archived'): Promise<number> {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('goals')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query

    if (error) throw new Error(`목표 개수 조회 실패: ${error.message}`)

    return count || 0
  }
}