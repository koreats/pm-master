import { Email } from '../value-objects/Email'
import { Role, RoleType } from '../value-objects/Role'

export interface UserProps {
  id: string
  email: Email
  name?: string
  avatarUrl?: string
  roles: Map<string, Role>
  isEmailVerified: boolean
  isMfaEnabled: boolean
  isLocked: boolean
  lockReason?: string
  lockedUntil?: Date
  lastLoginAt?: Date
  lastPasswordChangeAt?: Date
  failedLoginAttempts: number
  createdAt: Date
  updatedAt: Date
}

export class User {
  private readonly props: UserProps

  constructor(props: UserProps) {
    this.props = props
  }

  static create(params: {
    id: string
    email: string
    name?: string
    avatarUrl?: string
  }): User {
    return new User({
      id: params.id,
      email: new Email(params.email),
      name: params.name,
      avatarUrl: params.avatarUrl,
      roles: new Map(),
      isEmailVerified: false,
      isMfaEnabled: false,
      isLocked: false,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  getId(): string {
    return this.props.id
  }

  getEmail(): Email {
    return this.props.email
  }

  getName(): string | undefined {
    return this.props.name
  }

  getAvatarUrl(): string | undefined {
    return this.props.avatarUrl
  }

  getRoleInTeam(teamId: string): Role | undefined {
    return this.props.roles.get(teamId)
  }

  getAllRoles(): Map<string, Role> {
    return new Map(this.props.roles)
  }

  hasRoleInTeam(teamId: string, roleType: RoleType): boolean {
    const role = this.props.roles.get(teamId)
    return role?.getValue() === roleType
  }

  isTeamOwner(teamId: string): boolean {
    return this.hasRoleInTeam(teamId, RoleType.OWNER)
  }

  isTeamAdmin(teamId: string): boolean {
    return this.hasRoleInTeam(teamId, RoleType.ADMIN)
  }

  isTeamMember(teamId: string): boolean {
    return this.props.roles.has(teamId)
  }

  canAccessTeam(teamId: string): boolean {
    return this.isTeamMember(teamId) && !this.isLocked()
  }

  canPerformAction(teamId: string, resource: string, action: string): boolean {
    if (this.isLocked()) {
      return false
    }

    const role = this.getRoleInTeam(teamId)
    if (!role) {
      return false
    }

    return role.hasPermission(resource, action)
  }

  assignRole(teamId: string, role: Role): void {
    this.props.roles.set(teamId, role)
    this.props.updatedAt = new Date()
  }

  removeRole(teamId: string): void {
    this.props.roles.delete(teamId)
    this.props.updatedAt = new Date()
  }

  updateProfile(params: { name?: string; avatarUrl?: string }): void {
    if (params.name !== undefined) {
      this.props.name = params.name
    }
    if (params.avatarUrl !== undefined) {
      this.props.avatarUrl = params.avatarUrl
    }
    this.props.updatedAt = new Date()
  }

  verifyEmail(): void {
    this.props.isEmailVerified = true
    this.props.updatedAt = new Date()
  }

  enableMfa(): void {
    this.props.isMfaEnabled = true
    this.props.updatedAt = new Date()
  }

  disableMfa(): void {
    this.props.isMfaEnabled = false
    this.props.updatedAt = new Date()
  }

  lock(reason: string, duration: number = 5 * 60 * 1000): void {
    this.props.isLocked = true
    this.props.lockReason = reason
    this.props.lockedUntil = new Date(Date.now() + duration)
    this.props.updatedAt = new Date()
  }

  unlock(): void {
    this.props.isLocked = false
    this.props.lockReason = undefined
    this.props.lockedUntil = undefined
    this.props.failedLoginAttempts = 0
    this.props.updatedAt = new Date()
  }

  incrementFailedLoginAttempts(): void {
    this.props.failedLoginAttempts++
    this.props.updatedAt = new Date()

    if (this.props.failedLoginAttempts >= 5) {
      this.lock('Too many failed login attempts', 5 * 60 * 1000)
    }
  }

  resetFailedLoginAttempts(): void {
    this.props.failedLoginAttempts = 0
    this.props.updatedAt = new Date()
  }

  recordLogin(): void {
    this.props.lastLoginAt = new Date()
    this.resetFailedLoginAttempts()
    this.props.updatedAt = new Date()
  }

  recordPasswordChange(): void {
    this.props.lastPasswordChangeAt = new Date()
    this.props.updatedAt = new Date()
  }

  isLocked(): boolean {
    if (!this.props.isLocked) {
      return false
    }

    if (this.props.lockedUntil && this.props.lockedUntil < new Date()) {
      this.unlock()
      return false
    }

    return true
  }

  isEmailVerified(): boolean {
    return this.props.isEmailVerified
  }

  getLockReason(): string | undefined {
    return this.props.lockReason
  }

  getLockedUntil(): Date | undefined {
    return this.props.lockedUntil
  }

  isMfaEnabled(): boolean {
    return this.props.isMfaEnabled
  }

  shouldChangePassword(maxDays: number = 90): boolean {
    if (!this.props.lastPasswordChangeAt) {
      return true
    }

    const daysSinceChange = Math.floor(
      (Date.now() - this.props.lastPasswordChangeAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    return daysSinceChange >= maxDays
  }

  toJSON(): Omit<UserProps, 'email' | 'roles'> & { email: string; roles: Record<string, string> } {
    const roles: Record<string, string> = {}
    this.props.roles.forEach((role, teamId) => {
      roles[teamId] = role.getValue()
    })

    return {
      id: this.props.id,
      email: this.props.email.getValue(),
      name: this.props.name,
      avatarUrl: this.props.avatarUrl,
      roles,
      isEmailVerified: this.props.isEmailVerified,
      isMfaEnabled: this.props.isMfaEnabled,
      isLocked: this.props.isLocked,
      lockReason: this.props.lockReason,
      lockedUntil: this.props.lockedUntil,
      lastLoginAt: this.props.lastLoginAt,
      lastPasswordChangeAt: this.props.lastPasswordChangeAt,
      failedLoginAttempts: this.props.failedLoginAttempts,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    }
  }
}