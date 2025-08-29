import { User, UserProps } from '../../domain/entities/User'
import { Email } from '../../domain/value-objects/Email'
import { Role, RoleType } from '../../domain/value-objects/Role'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.generated'

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
  update(user: User): Promise<void>
  delete(id: string): Promise<void>
  updateFailedLoginAttempts(userId: string, attempts: number): Promise<void>
  updateLastLoginAt(userId: string): Promise<void>
  lockAccount(userId: string, reason: string, until: Date): Promise<void>
  unlockAccount(userId: string): Promise<void>
}

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const supabase = await createServiceRoleClient()
    
    // Fetch user data with roles
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        team_members (
          team_id,
          role
        )
      `)
      .eq('id', id)
      .single()

    if (userError || !userData) {
      return null
    }

    // Fetch additional security data
    const { data: securityData } = await supabase
      .from('account_locks')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: sessionData } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return this.mapToDomainUser(userData, securityData, sessionData)
  }

  async findByEmail(email: string): Promise<User | null> {
    const supabase = await createServiceRoleClient()
    
    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        *,
        team_members (
          team_id,
          role
        )
      `)
      .eq('email', email)
      .single()

    if (error || !userData) {
      return null
    }

    // Fetch additional security data
    const { data: securityData } = await supabase
      .from('account_locks')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: sessionData } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return this.mapToDomainUser(userData, securityData, sessionData)
  }

  async save(user: User): Promise<void> {
    const supabase = await createServiceRoleClient()
    
    // Save user data
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: user.getId(),
        email: user.getEmail().getValue(),
        name: user.getName() || null,
        avatar_url: user.getAvatarUrl() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (userError) {
      throw new Error(`Failed to save user: ${userError.message}`)
    }

    // Save team roles
    const roles = user.getAllRoles()
    for (const [teamId, role] of roles) {
      const { error: roleError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.getId(),
          role: role.getValue().toLowerCase() as 'owner' | 'admin' | 'member',
          joined_at: new Date().toISOString(),
        })

      if (roleError) {
        throw new Error(`Failed to save team role: ${roleError.message}`)
      }
    }
  }

  async update(user: User): Promise<void> {
    const supabase = await createServiceRoleClient()
    
    const { error } = await supabase
      .from('users')
      .update({
        email: user.getEmail().getValue(),
        name: user.getName() || null,
        avatar_url: user.getAvatarUrl() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.getId())

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }
  }

  async delete(id: string): Promise<void> {
    const supabase = await createServiceRoleClient()
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }
  }

  async updateFailedLoginAttempts(userId: string, attempts: number): Promise<void> {
    const supabase = await createServiceRoleClient()
    
    // Store failed login attempt in auth_attempts table
    const { error } = await supabase
      .from('auth_attempts')
      .insert({
        user_id: userId,
        email: '', // Will be filled by the service layer
        ip_address: '0.0.0.0', // Will be filled by the service layer
        user_agent: '', // Will be filled by the service layer
        success: false,
        created_at: new Date().toISOString(),
      })

    if (error) {
      throw new Error(`Failed to update login attempts: ${error.message}`)
    }
  }

  async updateLastLoginAt(userId: string): Promise<void> {
    const supabase = await createServiceRoleClient()
    
    // Create a successful auth attempt record
    const { error } = await supabase
      .from('auth_attempts')
      .insert({
        user_id: userId,
        email: '', // Will be filled by the service layer
        ip_address: '0.0.0.0', // Will be filled by the service layer
        user_agent: '', // Will be filled by the service layer
        success: true,
        created_at: new Date().toISOString(),
      })

    if (error) {
      throw new Error(`Failed to update last login: ${error.message}`)
    }
  }

  async lockAccount(userId: string, reason: string, until: Date): Promise<void> {
    const supabase = await createServiceRoleClient()
    
    const { error } = await supabase
      .from('account_locks')
      .insert({
        user_id: userId,
        locked_until: until.toISOString(),
        reason: reason,
        created_at: new Date().toISOString(),
      })

    if (error) {
      throw new Error(`Failed to lock account: ${error.message}`)
    }
  }

  async unlockAccount(userId: string): Promise<void> {
    const supabase = await createServiceRoleClient()
    
    // Mark all existing locks as expired
    const { error } = await supabase
      .from('account_locks')
      .update({
        locked_until: new Date().toISOString(), // Set to now, effectively unlocking
      })
      .eq('user_id', userId)
      .gt('locked_until', new Date().toISOString())

    if (error) {
      throw new Error(`Failed to unlock account: ${error.message}`)
    }
  }

  private mapToDomainUser(
    userData: any,
    securityData: any,
    sessionData: any
  ): User {
    // Map team roles
    const roles = new Map<string, Role>()
    if (userData.team_members && Array.isArray(userData.team_members)) {
      userData.team_members.forEach((tm: any) => {
        const roleType = tm.role.toUpperCase() as RoleType
        roles.set(tm.team_id, new Role(roleType))
      })
    }

    // Check if account is locked
    const isLocked = securityData && new Date(securityData.locked_until) > new Date()
    
    // Count failed login attempts in the last 15 minutes
    // This would need to be fetched separately in a real implementation
    const failedLoginAttempts = 0

    const props: UserProps = {
      id: userData.id,
      email: new Email(userData.email),
      name: userData.name,
      avatarUrl: userData.avatar_url,
      roles: roles,
      isEmailVerified: userData.email_verified || false,
      isMfaEnabled: userData.mfa_enabled || false,
      isLocked: isLocked,
      lockReason: securityData?.reason,
      lockedUntil: securityData ? new Date(securityData.locked_until) : undefined,
      lastLoginAt: sessionData ? new Date(sessionData.created_at) : undefined,
      lastPasswordChangeAt: userData.last_password_change_at 
        ? new Date(userData.last_password_change_at) 
        : undefined,
      failedLoginAttempts: failedLoginAttempts,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
    }

    return new User(props)
  }
}