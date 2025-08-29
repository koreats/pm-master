import { User } from '../../domain/entities/User'
import { Session } from '../../domain/entities/Session'
import { Email } from '../../domain/value-objects/Email'
import { Password } from '../../domain/value-objects/Password'
import { PasswordPolicyService } from '../../domain/services/PasswordPolicyService'
import { createClient } from '../../../supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface LoginCredentials {
  email: string
  password: string
  deviceFingerprint?: string
  ipAddress?: string
  userAgent?: string
}

export interface RegisterData {
  email: string
  password: string
  name?: string
  teamName?: string
}

export interface AuthResult {
  success: boolean
  user?: User
  session?: Session
  error?: string
  requiresMfa?: boolean
  requiresPasswordChange?: boolean
}

export class AuthenticationService {
  private readonly supabase: SupabaseClient
  private readonly passwordPolicyService: PasswordPolicyService
  private readonly maxFailedAttempts = 5
  private readonly lockoutDuration = 5 * 60 * 1000 // 5 minutes
  private failedAttempts: Map<string, number> = new Map()
  private lockouts: Map<string, Date> = new Map()

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createClient()
    this.passwordPolicyService = new PasswordPolicyService()
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const email = new Email(credentials.email)
      
      if (this.isAccountLocked(email.getValue())) {
        const lockoutTime = this.lockouts.get(email.getValue())
        const remainingTime = lockoutTime ? Math.ceil((lockoutTime.getTime() - Date.now()) / 1000) : 0
        return {
          success: false,
          error: `Account is locked. Please try again in ${remainingTime} seconds.`
        }
      }

      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: email.getValue(),
        password: credentials.password,
      })

      if (authError || !authData.user) {
        this.recordFailedAttempt(email.getValue())
        return {
          success: false,
          error: authError?.message || 'Invalid credentials'
        }
      }

      this.clearFailedAttempts(email.getValue())

      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError || !userData) {
        return {
          success: false,
          error: 'User profile not found'
        }
      }

      const user = this.mapToUser(userData)
      
      const session = Session.create({
        userId: user.getId(),
        deviceFingerprint: credentials.deviceFingerprint,
        ipAddress: credentials.ipAddress,
        userAgent: credentials.userAgent,
      })

      await this.saveSession(session)
      await this.recordLoginAudit(user.getId(), true, credentials.ipAddress)

      const passwordCheck = this.passwordPolicyService.checkPasswordExpiry(
        userData.last_password_change_at ? new Date(userData.last_password_change_at) : undefined
      )

      return {
        success: true,
        user,
        session,
        requiresMfa: user.isMfaEnabled(),
        requiresPasswordChange: passwordCheck.isExpired
      }
    } catch (error: any) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.message || 'An error occurred during login'
      }
    }
  }

  async register(data: RegisterData): Promise<AuthResult> {
    try {
      const email = new Email(data.email)
      const passwordValidation = this.passwordPolicyService.validateNewPassword(
        data.password,
        { email: data.email, name: data.name }
      )

      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join('. ')
        }
      }

      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: email.getValue(),
        password: data.password,
        options: {
          data: {
            name: data.name,
          }
        }
      })

      if (authError || !authData.user) {
        return {
          success: false,
          error: authError?.message || 'Registration failed'
        }
      }

      const { error: profileError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email.getValue(),
          name: data.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        await this.supabase.auth.signOut()
        return {
          success: false,
          error: 'Failed to create user profile'
        }
      }

      if (data.teamName) {
        await this.createInitialTeam(authData.user.id, data.teamName)
      }

      const user = User.create({
        id: authData.user.id,
        email: email.getValue(),
        name: data.name,
      })

      const session = Session.create({
        userId: user.getId(),
      })

      await this.saveSession(session)
      await this.recordLoginAudit(user.getId(), true, undefined)

      return {
        success: true,
        user,
        session,
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: error.message || 'An error occurred during registration'
      }
    }
  }

  async logout(sessionId: string): Promise<void> {
    try {
      await this.revokeSession(sessionId)
      await this.supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  async verifySession(token: string): Promise<Session | null> {
    try {
      const tokenHash = Session.create({ userId: 'temp' }).getTokenHash()
      
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('token_hash', tokenHash)
        .single()

      if (error || !data) {
        return null
      }

      const session = this.mapToSession(data)
      
      if (!session.isValid()) {
        await this.revokeSession(session.getId())
        return null
      }

      session.updateActivity()
      await this.updateSessionActivity(session.getId())

      return session
    } catch (error) {
      console.error('Session verification error:', error)
      return null
    }
  }

  async refreshSession(sessionId: string): Promise<Session | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error || !data) {
        return null
      }

      const session = this.mapToSession(data)
      
      if (!session.isValid()) {
        await this.revokeSession(session.getId())
        return null
      }

      session.extend()
      await this.updateSession(session)

      return session
    } catch (error) {
      console.error('Session refresh error:', error)
      return null
    }
  }

  private async saveSession(session: Session): Promise<void> {
    const { error } = await this.supabase
      .from('user_sessions')
      .insert({
        id: session.getId(),
        user_id: session.getUserId(),
        token_hash: session.getTokenHash(),
        device_fingerprint: session.getDeviceFingerprint(),
        ip_address: session.getIpAddress(),
        user_agent: session.getUserAgent(),
        last_activity: session.getLastActivity().toISOString(),
        expires_at: session.getExpiresAt().toISOString(),
        created_at: session.getCreatedAt().toISOString(),
      })

    if (error) {
      throw error
    }
  }

  private async updateSession(session: Session): Promise<void> {
    const { error } = await this.supabase
      .from('user_sessions')
      .update({
        last_activity: session.getLastActivity().toISOString(),
        expires_at: session.getExpiresAt().toISOString(),
      })
      .eq('id', session.getId())

    if (error) {
      throw error
    }
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_sessions')
      .update({
        last_activity: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) {
      throw error
    }
  }

  private async revokeSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      throw error
    }
  }

  private async recordLoginAudit(userId: string, success: boolean, ipAddress?: string): Promise<void> {
    const { error } = await this.supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: success ? 'login_success' : 'login_failed',
        entity_type: 'auth',
        ip_address: ipAddress,
        metadata: { timestamp: new Date().toISOString() },
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Failed to record audit log:', error)
    }
  }

  private async createInitialTeam(userId: string, teamName: string): Promise<void> {
    const { data: team, error: teamError } = await this.supabase
      .from('teams')
      .insert({
        name: teamName,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (!teamError && team) {
      await this.supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: userId,
          role: 'owner',
          joined_at: new Date().toISOString(),
        })
    }
  }

  private recordFailedAttempt(email: string): void {
    const attempts = this.failedAttempts.get(email) || 0
    const newAttempts = attempts + 1
    this.failedAttempts.set(email, newAttempts)

    if (newAttempts >= this.maxFailedAttempts) {
      this.lockouts.set(email, new Date(Date.now() + this.lockoutDuration))
      this.failedAttempts.delete(email)
    }
  }

  private clearFailedAttempts(email: string): void {
    this.failedAttempts.delete(email)
    this.lockouts.delete(email)
  }

  private isAccountLocked(email: string): boolean {
    const lockoutTime = this.lockouts.get(email)
    
    if (!lockoutTime) {
      return false
    }

    if (lockoutTime.getTime() > Date.now()) {
      return true
    }

    this.lockouts.delete(email)
    return false
  }

  private mapToUser(data: any): User {
    return User.create({
      id: data.id,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatar_url,
    })
  }

  private mapToSession(data: any): Session {
    return new Session({
      id: data.id,
      userId: data.user_id,
      token: '', // Token is not stored in DB
      deviceFingerprint: data.device_fingerprint,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      lastActivity: new Date(data.last_activity),
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      isRevoked: false,
    })
  }
}