export interface PermissionProps {
  resource: string
  action: string
  teamId?: string
  conditions?: Record<string, any>
}

export class Permission {
  private readonly props: PermissionProps

  constructor(props: PermissionProps) {
    this.props = props
  }

  static create(params: {
    resource: string
    action: string
    teamId?: string
    conditions?: Record<string, any>
  }): Permission {
    return new Permission({
      resource: params.resource,
      action: params.action,
      teamId: params.teamId,
      conditions: params.conditions,
    })
  }

  getResource(): string {
    return this.props.resource
  }

  getAction(): string {
    return this.props.action
  }

  getTeamId(): string | undefined {
    return this.props.teamId
  }

  getConditions(): Record<string, any> | undefined {
    return this.props.conditions
  }

  isGlobal(): boolean {
    return !this.props.teamId
  }

  isTeamScoped(): boolean {
    return !!this.props.teamId
  }

  hasConditions(): boolean {
    return !!this.props.conditions && Object.keys(this.props.conditions).length > 0
  }

  matches(resource: string, action: string, teamId?: string): boolean {
    if (this.props.resource !== resource) {
      return false
    }

    if (this.props.action !== action && this.props.action !== '*') {
      return false
    }

    if (this.isTeamScoped() && this.props.teamId !== teamId) {
      return false
    }

    return true
  }

  evaluateConditions(context: Record<string, any>): boolean {
    if (!this.hasConditions()) {
      return true
    }

    for (const [key, value] of Object.entries(this.props.conditions!)) {
      const contextValue = context[key]

      if (typeof value === 'object' && value !== null) {
        if (value.$eq !== undefined && contextValue !== value.$eq) {
          return false
        }
        if (value.$ne !== undefined && contextValue === value.$ne) {
          return false
        }
        if (value.$in !== undefined && !value.$in.includes(contextValue)) {
          return false
        }
        if (value.$nin !== undefined && value.$nin.includes(contextValue)) {
          return false
        }
        if (value.$gt !== undefined && contextValue <= value.$gt) {
          return false
        }
        if (value.$gte !== undefined && contextValue < value.$gte) {
          return false
        }
        if (value.$lt !== undefined && contextValue >= value.$lt) {
          return false
        }
        if (value.$lte !== undefined && contextValue > value.$lte) {
          return false
        }
      } else {
        if (contextValue !== value) {
          return false
        }
      }
    }

    return true
  }

  toString(): string {
    const parts = [this.props.resource, this.props.action]
    if (this.props.teamId) {
      parts.push(`team:${this.props.teamId}`)
    }
    if (this.hasConditions()) {
      parts.push(`conditions:${JSON.stringify(this.props.conditions)}`)
    }
    return parts.join(':')
  }

  equals(other: Permission): boolean {
    return (
      this.props.resource === other.props.resource &&
      this.props.action === other.props.action &&
      this.props.teamId === other.props.teamId &&
      JSON.stringify(this.props.conditions) === JSON.stringify(other.props.conditions)
    )
  }

  toJSON(): PermissionProps {
    return { ...this.props }
  }
}

export class PermissionSet {
  private permissions: Set<Permission>

  constructor(permissions: Permission[] = []) {
    this.permissions = new Set(permissions)
  }

  add(permission: Permission): void {
    this.permissions.add(permission)
  }

  remove(permission: Permission): void {
    Array.from(this.permissions).forEach(p => {
      if (p.equals(permission)) {
        this.permissions.delete(p)
      }
    })
  }

  has(permission: Permission): boolean {
    for (const p of Array.from(this.permissions)) {
      if (p.equals(permission)) {
        return true
      }
    }
    return false
  }

  canPerform(resource: string, action: string, teamId?: string, context?: Record<string, any>): boolean {
    for (const permission of Array.from(this.permissions)) {
      if (permission.matches(resource, action, teamId)) {
        if (!context || permission.evaluateConditions(context)) {
          return true
        }
      }
    }
    return false
  }

  getPermissionsForResource(resource: string): Permission[] {
    return Array.from(this.permissions).filter(p => p.getResource() === resource)
  }

  getPermissionsForTeam(teamId: string): Permission[] {
    return Array.from(this.permissions).filter(p => p.getTeamId() === teamId)
  }

  getGlobalPermissions(): Permission[] {
    return Array.from(this.permissions).filter(p => p.isGlobal())
  }

  merge(other: PermissionSet): PermissionSet {
    const merged = new PermissionSet(Array.from(this.permissions))
    Array.from(other.permissions).forEach(p => merged.add(p))
    return merged
  }

  intersect(other: PermissionSet): PermissionSet {
    const result = new PermissionSet()
    Array.from(this.permissions).forEach(p => {
      if (other.has(p)) {
        result.add(p)
      }
    })
    return result
  }

  difference(other: PermissionSet): PermissionSet {
    const result = new PermissionSet()
    Array.from(this.permissions).forEach(p => {
      if (!other.has(p)) {
        result.add(p)
      }
    })
    return result
  }

  toArray(): Permission[] {
    return Array.from(this.permissions)
  }

  size(): number {
    return this.permissions.size
  }

  isEmpty(): boolean {
    return this.permissions.size === 0
  }
}