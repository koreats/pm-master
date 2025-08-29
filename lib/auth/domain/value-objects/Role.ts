export enum RoleType {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export interface RolePermission {
  resource: string
  actions: string[]
}

export class Role {
  private readonly value: RoleType
  private readonly permissions: Map<string, Set<string>>

  constructor(role: RoleType) {
    this.value = role
    this.permissions = this.definePermissions(role)
  }

  private definePermissions(role: RoleType): Map<string, Set<string>> {
    const permissions = new Map<string, Set<string>>()

    switch (role) {
      case RoleType.OWNER:
        permissions.set('team', new Set(['create', 'read', 'update', 'delete', 'manage_members']))
        permissions.set('goal', new Set(['create', 'read', 'update', 'delete']))
        permissions.set('project', new Set(['create', 'read', 'update', 'delete', 'assign']))
        permissions.set('task', new Set(['create', 'read', 'update', 'delete', 'assign']))
        permissions.set('member', new Set(['invite', 'remove', 'update_role']))
        permissions.set('settings', new Set(['read', 'update']))
        permissions.set('audit_log', new Set(['read']))
        permissions.set('billing', new Set(['read', 'update']))
        break

      case RoleType.ADMIN:
        permissions.set('team', new Set(['read', 'update', 'manage_members']))
        permissions.set('goal', new Set(['create', 'read', 'update', 'delete']))
        permissions.set('project', new Set(['create', 'read', 'update', 'delete', 'assign']))
        permissions.set('task', new Set(['create', 'read', 'update', 'delete', 'assign']))
        permissions.set('member', new Set(['invite', 'update_role']))
        permissions.set('settings', new Set(['read', 'update']))
        permissions.set('audit_log', new Set(['read']))
        permissions.set('billing', new Set(['read']))
        break

      case RoleType.MEMBER:
        permissions.set('team', new Set(['read']))
        permissions.set('goal', new Set(['read']))
        permissions.set('project', new Set(['read', 'update']))
        permissions.set('task', new Set(['create', 'read', 'update']))
        permissions.set('member', new Set(['read']))
        permissions.set('settings', new Set(['read']))
        permissions.set('audit_log', new Set([]))
        permissions.set('billing', new Set([]))
        break

      default:
        break
    }

    return permissions
  }

  hasPermission(resource: string, action: string): boolean {
    const resourcePermissions = this.permissions.get(resource)
    if (!resourcePermissions) {
      return false
    }
    return resourcePermissions.has(action)
  }

  canManageTeam(): boolean {
    return this.value === RoleType.OWNER || this.value === RoleType.ADMIN
  }

  canManageMembers(): boolean {
    return this.hasPermission('member', 'invite')
  }

  canDeleteResources(): boolean {
    return this.value === RoleType.OWNER || this.value === RoleType.ADMIN
  }

  canViewAuditLogs(): boolean {
    return this.hasPermission('audit_log', 'read')
  }

  canManageBilling(): boolean {
    return this.hasPermission('billing', 'update')
  }

  getValue(): RoleType {
    return this.value
  }

  getPermissions(): RolePermission[] {
    const result: RolePermission[] = []
    this.permissions.forEach((actions, resource) => {
      if (actions.size > 0) {
        result.push({
          resource,
          actions: Array.from(actions)
        })
      }
    })
    return result
  }

  isHigherThan(other: Role): boolean {
    const hierarchy = {
      [RoleType.OWNER]: 3,
      [RoleType.ADMIN]: 2,
      [RoleType.MEMBER]: 1,
    }
    return hierarchy[this.value] > hierarchy[other.value]
  }

  equals(other: Role): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}