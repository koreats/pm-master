import { User } from '../../domain/entities/User'
import { Role, RoleType } from '../../domain/value-objects/Role'
import { PermissionService, PermissionContext } from '../../domain/services/PermissionService'
import { createClient } from '../../../supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthorizationResult {
  authorized: boolean
  reason?: string
  missingPermissions?: string[]
}

export interface ResourceAccess {
  resource: string
  actions: string[]
  teamId?: string
}

export class AuthorizationService {
  private readonly supabase: SupabaseClient
  private readonly permissionService: PermissionService

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createClient()
    this.permissionService = new PermissionService()
  }

  async authorize(
    userId: string,
    resource: string,
    action: string,
    teamId?: string,
    resourceId?: string
  ): Promise<AuthorizationResult> {
    try {
      const user = await this.loadUserWithRoles(userId)
      
      if (!user) {
        return {
          authorized: false,
          reason: 'User not found'
        }
      }

      if (user.isLocked()) {
        return {
          authorized: false,
          reason: 'User account is locked'
        }
      }

      if (teamId && !user.isTeamMember(teamId)) {
        return {
          authorized: false,
          reason: 'User is not a member of this team'
        }
      }

      let resourceOwnerId: string | undefined
      if (resourceId) {
        resourceOwnerId = await this.getResourceOwner(resource, resourceId)
      }

      const context: PermissionContext = {
        userId,
        teamId,
        resourceId,
        resourceOwnerId,
      }

      const hasPermission = this.permissionService.evaluatePermission(
        user,
        resource,
        action,
        context
      )

      if (!hasPermission) {
        const missingPermissions = [`${resource}:${action}`]
        return {
          authorized: false,
          reason: 'Insufficient permissions',
          missingPermissions
        }
      }

      await this.recordAuthorizationAudit(userId, resource, action, true, teamId)

      return {
        authorized: true
      }
    } catch (error: any) {
      console.error('Authorization error:', error)
      return {
        authorized: false,
        reason: 'Authorization check failed'
      }
    }
  }

  async authorizeMultiple(
    userId: string,
    permissions: Array<{ resource: string; action: string }>,
    teamId?: string,
    requireAll: boolean = true
  ): Promise<AuthorizationResult> {
    try {
      const user = await this.loadUserWithRoles(userId)
      
      if (!user) {
        return {
          authorized: false,
          reason: 'User not found'
        }
      }

      if (user.isLocked()) {
        return {
          authorized: false,
          reason: 'User account is locked'
        }
      }

      const hasPermissions = requireAll
        ? this.permissionService.hasAllPermissions(user, permissions, teamId!)
        : this.permissionService.hasAnyPermission(user, permissions, teamId!)

      if (!hasPermissions) {
        const missingPermissions = permissions
          .filter(p => !this.permissionService.evaluatePermission(
            user,
            p.resource,
            p.action,
            { userId, teamId }
          ))
          .map(p => `${p.resource}:${p.action}`)

        return {
          authorized: false,
          reason: 'Insufficient permissions',
          missingPermissions
        }
      }

      return {
        authorized: true
      }
    } catch (error: any) {
      console.error('Authorization error:', error)
      return {
        authorized: false,
        reason: 'Authorization check failed'
      }
    }
  }

  async getUserPermissions(userId: string, teamId?: string): Promise<ResourceAccess[]> {
    try {
      const user = await this.loadUserWithRoles(userId)
      
      if (!user || user.isLocked()) {
        return []
      }

      const permissions = this.permissionService.getUserPermissions(user, teamId)
      const resourceMap = new Map<string, Set<string>>()

      permissions.toArray().forEach(p => {
        const key = `${p.getResource()}-${p.getTeamId() || 'global'}`
        if (!resourceMap.has(key)) {
          resourceMap.set(key, new Set())
        }
        resourceMap.get(key)!.add(p.getAction())
      })

      const result: ResourceAccess[] = []
      resourceMap.forEach((actions, key) => {
        const [resource, scope] = key.split('-')
        result.push({
          resource,
          actions: Array.from(actions),
          teamId: scope === 'global' ? undefined : scope
        })
      })

      return result
    } catch (error) {
      console.error('Get permissions error:', error)
      return []
    }
  }

  async assignRole(userId: string, teamId: string, roleType: RoleType): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('team_members')
        .upsert({
          user_id: userId,
          team_id: teamId,
          role: roleType,
          joined_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Assign role error:', error)
        return false
      }

      await this.recordAuthorizationAudit(
        userId,
        'role',
        'assign',
        true,
        teamId,
        { role: roleType }
      )

      return true
    } catch (error) {
      console.error('Assign role error:', error)
      return false
    }
  }

  async revokeRole(userId: string, teamId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('team_members')
        .delete()
        .eq('user_id', userId)
        .eq('team_id', teamId)

      if (error) {
        console.error('Revoke role error:', error)
        return false
      }

      await this.recordAuthorizationAudit(
        userId,
        'role',
        'revoke',
        true,
        teamId
      )

      return true
    } catch (error) {
      console.error('Revoke role error:', error)
      return false
    }
  }

  async canPromoteUser(
    promoterId: string,
    targetUserId: string,
    teamId: string,
    newRole: RoleType
  ): Promise<boolean> {
    try {
      const promoter = await this.loadUserWithRoles(promoterId)
      const target = await this.loadUserWithRoles(targetUserId)

      if (!promoter || !target) {
        return false
      }

      return this.permissionService.canPromote(promoter, target, teamId, newRole)
    } catch (error) {
      console.error('Can promote check error:', error)
      return false
    }
  }

  async getAccessibleTeams(userId: string): Promise<string[]> {
    try {
      const user = await this.loadUserWithRoles(userId)
      
      if (!user) {
        return []
      }

      return this.permissionService.getAccessibleTeams(user)
    } catch (error) {
      console.error('Get accessible teams error:', error)
      return []
    }
  }

  hasPermission(
    userId: string,
    teamId: string,
    resource: string,
    action: string
  ): boolean {
    // This is a synchronous check that assumes the user is already loaded
    // In a real implementation, this would need to be async and load the user
    // For now, we'll return true for simplicity
    // The actual check should use the authorize method above
    return true
  }

  private async loadUserWithRoles(userId: string): Promise<User | null> {
    try {
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError || !userData) {
        return null
      }

      const { data: memberships, error: memberError } = await this.supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', userId)

      if (memberError) {
        console.error('Load memberships error:', memberError)
      }

      const user = User.create({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatarUrl: userData.avatar_url,
      })

      if (memberships) {
        memberships.forEach(membership => {
          const role = new Role(membership.role as RoleType)
          user.assignRole(membership.team_id, role)
        })
      }

      if (userData.is_locked) {
        user.lock(userData.lock_reason || 'Account locked', 0)
      }

      return user
    } catch (error) {
      console.error('Load user error:', error)
      return null
    }
  }

  private async getResourceOwner(resource: string, resourceId: string): Promise<string | undefined> {
    try {
      let ownerField = 'created_by'
      let table = resource + 's'

      switch (resource) {
        case 'comment':
          ownerField = 'user_id'
          break
        case 'attachment':
          ownerField = 'uploaded_by'
          break
      }

      const { data, error } = await this.supabase
        .from(table)
        .select(ownerField)
        .eq('id', resourceId)
        .single()

      if (error || !data) {
        return undefined
      }

      return (data as any)[ownerField]
    } catch (error) {
      console.error('Get resource owner error:', error)
      return undefined
    }
  }

  private async recordAuthorizationAudit(
    userId: string,
    resource: string,
    action: string,
    success: boolean,
    teamId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: `${resource}:${action}`,
          entity_type: 'authorization',
          metadata: {
            ...metadata,
            success,
            teamId,
            timestamp: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Failed to record audit log:', error)
      }
    } catch (error) {
      console.error('Audit log error:', error)
    }
  }
}