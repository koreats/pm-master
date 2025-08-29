import * as crypto from 'crypto'

export interface SessionProps {
  id: string
  userId: string
  token: string
  deviceFingerprint?: string
  ipAddress?: string
  userAgent?: string
  lastActivity: Date
  expiresAt: Date
  createdAt: Date
  isRevoked: boolean
}

export class Session {
  private readonly props: SessionProps
  private static readonly IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private static readonly ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours

  constructor(props: SessionProps) {
    this.props = props
  }

  static create(params: {
    userId: string
    deviceFingerprint?: string
    ipAddress?: string
    userAgent?: string
  }): Session {
    const now = new Date()
    const token = this.generateToken()
    
    return new Session({
      id: crypto.randomUUID(),
      userId: params.userId,
      token,
      deviceFingerprint: params.deviceFingerprint,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + this.ABSOLUTE_TIMEOUT),
      createdAt: now,
      isRevoked: false,
    })
  }

  private static generateToken(): string {
    return crypto.randomBytes(32).toString('base64url')
  }

  getId(): string {
    return this.props.id
  }

  getUserId(): string {
    return this.props.userId
  }

  getToken(): string {
    return this.props.token
  }

  getTokenHash(): string {
    return crypto.createHash('sha256').update(this.props.token).digest('hex')
  }

  getDeviceFingerprint(): string | undefined {
    return this.props.deviceFingerprint
  }

  getIpAddress(): string | undefined {
    return this.props.ipAddress
  }

  getUserAgent(): string | undefined {
    return this.props.userAgent
  }

  getLastActivity(): Date {
    return this.props.lastActivity
  }

  getExpiresAt(): Date {
    return this.props.expiresAt
  }

  getCreatedAt(): Date {
    return this.props.createdAt
  }

  isExpired(): boolean {
    const now = new Date()
    
    if (this.props.isRevoked) {
      return true
    }

    if (now > this.props.expiresAt) {
      return true
    }

    const idleTime = now.getTime() - this.props.lastActivity.getTime()
    if (idleTime > Session.IDLE_TIMEOUT) {
      return true
    }

    return false
  }

  isValid(): boolean {
    return !this.isExpired() && !this.props.isRevoked
  }

  updateActivity(): void {
    if (!this.isValid()) {
      throw new Error('Cannot update activity on invalid session')
    }
    this.props.lastActivity = new Date()
  }

  extend(duration?: number): void {
    if (!this.isValid()) {
      throw new Error('Cannot extend invalid session')
    }

    const extension = duration || Session.IDLE_TIMEOUT
    const now = new Date()
    const maxExpiry = new Date(this.props.createdAt.getTime() + Session.ABSOLUTE_TIMEOUT)
    const newExpiry = new Date(now.getTime() + extension)

    this.props.expiresAt = newExpiry > maxExpiry ? maxExpiry : newExpiry
    this.props.lastActivity = now
  }

  revoke(): void {
    this.props.isRevoked = true
  }

  isFromSameDevice(fingerprint: string): boolean {
    return this.props.deviceFingerprint === fingerprint
  }

  isFromSameIp(ipAddress: string): boolean {
    return this.props.ipAddress === ipAddress
  }

  getIdleTime(): number {
    return Date.now() - this.props.lastActivity.getTime()
  }

  getRemainingTime(): number {
    if (!this.isValid()) {
      return 0
    }
    return Math.max(0, this.props.expiresAt.getTime() - Date.now())
  }

  shouldRefresh(): boolean {
    if (!this.isValid()) {
      return false
    }

    const remainingTime = this.getRemainingTime()
    const refreshThreshold = 5 * 60 * 1000 // 5 minutes

    return remainingTime < refreshThreshold
  }

  toJSON(): Omit<SessionProps, 'token'> & { tokenHash: string } {
    return {
      id: this.props.id,
      userId: this.props.userId,
      tokenHash: this.getTokenHash(),
      deviceFingerprint: this.props.deviceFingerprint,
      ipAddress: this.props.ipAddress,
      userAgent: this.props.userAgent,
      lastActivity: this.props.lastActivity,
      expiresAt: this.props.expiresAt,
      createdAt: this.props.createdAt,
      isRevoked: this.props.isRevoked,
    }
  }
}