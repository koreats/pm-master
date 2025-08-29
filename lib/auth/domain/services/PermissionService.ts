import { User } from '../entities/User'
import { Permission, PermissionSet } from '../entities/Permission'
import { Role, RoleType } from '../value-objects/Role'

export interface PermissionContext {
  userId: string
  teamId?: string
  resourceId?: string
  resourceOwnerId?: string
  [key: string]: any
}

export class PermissionService {
  evaluatePermission(
    user: User,
    resource: string,
    action: string,
    context: PermissionContext
  ): boolean {
    if (user.isLocked()) {
      return false
    }

    if (context.teamId) {
      const role = user.getRoleInTeam(context.teamId)
      if (!role) {
        return false
      }

      if (!role.hasPermission(resource, action)) {
        return false
      }

      if (this.requiresOwnership(resource, action)) {
        return this.checkOwnership(user.getId(), context)
      }

      return true
    }

    const permissions = this.getUserGlobalPermissions(user)
    return permissions.canPerform(resource, action, undefined, context)
  }

  getUserPermissions(user: User, teamId?: string): PermissionSet {
    const permissions = new PermissionSet()

    if (teamId) {
      const role = user.getRoleInTeam(teamId)
      if (role) {
        const rolePermissions = this.getRolePermissions(role, teamId)
        return rolePermissions
      }
    } else {
      user.getAllRoles().forEach((role, tid) => {
        const rolePermissions = this.getRolePermissions(role, tid)
        rolePermissions.toArray().forEach(p => permissions.add(p))
      })
    }

    return permissions
  }

  private getRolePermissions(role: Role, teamId: string): PermissionSet {
    const permissions = new PermissionSet()
    const rolePermissions = role.getPermissions()

    rolePermissions.forEach(rp => {
      rp.actions.forEach(action => {
        permissions.add(
          Permission.create({
            resource: rp.resource,
            action,
            teamId,
          })
        )
      })
    })

    return permissions
  }

  private getUserGlobalPermissions(user: User): PermissionSet {
    const permissions = new PermissionSet()

    const globalPermissions = [
      Permission.create({ resource: 'profile', action: 'read' }),
      Permission.create({ resource: 'profile', action: 'update' }),
      Permission.create({ resource: 'team', action: 'create' }),
    ]

    globalPermissions.forEach(p => permissions.add(p))

    return permissions
  }

  private requiresOwnership(resource: string, action: string): boolean {
    const ownershipActions: Record<string, string[]> = {
      comment: ['update', 'delete'],
      attachment: ['delete'],
      task: ['delete'],
      project: ['delete'],
    }

    return ownershipActions[resource]?.includes(action) || false
  }

  private checkOwnership(userId: string, context: PermissionContext): boolean {
    return context.resourceOwnerId === userId
  }

  canDelegate(delegator: User, delegatee: User, teamId: string): boolean {
    const delegatorRole = delegator.getRoleInTeam(teamId)
    const delegateeRole = delegatee.getRoleInTeam(teamId)

    if (!delegatorRole || !delegateeRole) {
      return false
    }

    return delegatorRole.isHigherThan(delegateeRole) || delegatorRole.equals(delegateeRole)
  }

  canPromote(promoter: User, target: User, teamId: string, newRole: RoleType): boolean {
    const promoterRole = promoter.getRoleInTeam(teamId)
    
    if (!promoterRole) {
      return false
    }

    if (promoterRole.getValue() !== RoleType.OWNER && promoterRole.getValue() !== RoleType.ADMIN) {
      return false
    }

    if (newRole === RoleType.OWNER && promoterRole.getValue() !== RoleType.OWNER) {
      return false
    }

    return true
  }

  getEffectivePermissions(user: User, teamId: string): string[] {
    const permissions = this.getUserPermissions(user, teamId)
    const effectivePerms: Set<string> = new Set()

    permissions.toArray().forEach(p => {
      effectivePerms.add(`${p.getResource()}:${p.getAction()}`)
    })

    return Array.from(effectivePerms).sort()
  }

  hasAnyPermission(user: User, permissions: Array<{ resource: string; action: string }>, teamId: string): boolean {
    return permissions.some(p => 
      this.evaluatePermission(user, p.resource, p.action, { userId: user.getId(), teamId })
    )
  }

  hasAllPermissions(user: User, permissions: Array<{ resource: string; action: string }>, teamId: string): boolean {
    return permissions.every(p => 
      this.evaluatePermission(user, p.resource, p.action, { userId: user.getId(), teamId })
    )
  }

  getAccessibleTeams(user: User): string[] {
    const teams: string[] = []
    
    user.getAllRoles().forEach((role, teamId) => {
      if (!user.isLocked()) {
        teams.push(teamId)
      }
    })

    return teams
  }

  getHighestRole(user: User): RoleType | null {
    let highestRole: RoleType | null = null
    const hierarchy = {
      [RoleType.OWNER]: 3,
      [RoleType.ADMIN]: 2,
      [RoleType.MEMBER]: 1,
    }

    user.getAllRoles().forEach(role => {
      const roleType = role.getValue()
      if (!highestRole || hierarchy[roleType] > hierarchy[highestRole]) {
        highestRole = roleType
      }
    })

    return highestRole
  }
}