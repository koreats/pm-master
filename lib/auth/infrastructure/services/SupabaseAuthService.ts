import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '../../domain/entities/User'
import { UserRepository } from '../repositories/UserRepository'
import { AuditLogService } from './AuditLogService'

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
  requiresMfa?: boolean
  mfaSessionId?: string
}

export interface SignUpData extends AuthCredentials {
  name?: string
  avatarUrl?: string
}

export class SupabaseAuthService {
  private userRepository: UserRepository
  private auditLog: AuditLogService

  constructor() {
    this.userRepository = new UserRepository()
    this.auditLog = new AuditLogService()
  }

  async signIn(credentials: AuthCredentials, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      const supabase = await createClient()
      
      // Attempt sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        // Log failed attempt
        await this.auditLog.logAuthAttempt({
          email: credentials.email,
          success: false,
          ipAddress: ipAddress || '0.0.0.0',
          userAgent: userAgent || 'unknown',
          errorMessage: error.message,
        })

        return {
          success: false,
          error: error.message,
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Authentication failed',
        }
      }

      // Fetch or create domain user
      let domainUser = await this.userRepository.findById(data.user.id)
      
      if (!domainUser) {
        // Create domain user if doesn't exist
        domainUser = User.create({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
          avatarUrl: data.user.user_metadata?.avatar_url,
        })
        await this.userRepository.save(domainUser)
      }

      // Update last login
      await this.userRepository.updateLastLoginAt(data.user.id)

      // Log successful attempt
      await this.auditLog.logAuthAttempt({
        email: credentials.email,
        userId: data.user.id,
        success: true,
        ipAddress: ipAddress || '0.0.0.0',
        userAgent: userAgent || 'unknown',
      })

      // Check if MFA is required
      if (data.user.factors && data.user.factors.length > 0) {
        return {
          success: false,
          requiresMfa: true,
          mfaSessionId: data.session?.access_token,
        }
      }

      return {
        success: true,
        user: domainUser,
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  }

  async signUp(data: SignUpData, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      const supabase = await createClient()
      
      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            avatar_url: data.avatarUrl,
          },
        },
      })

      if (authError) {
        // Log failed attempt
        await this.auditLog.logAuthAttempt({
          email: data.email,
          success: false,
          ipAddress: ipAddress || '0.0.0.0',
          userAgent: userAgent || 'unknown',
          errorMessage: authError.message,
        })

        return {
          success: false,
          error: authError.message,
        }
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create account',
        }
      }

      // Create domain user
      const domainUser = User.create({
        id: authData.user.id,
        email: authData.user.email!,
        name: data.name,
        avatarUrl: data.avatarUrl,
      })

      await this.userRepository.save(domainUser)

      // Log successful signup
      await this.auditLog.logAuthAttempt({
        email: data.email,
        userId: authData.user.id,
        success: true,
        ipAddress: ipAddress || '0.0.0.0',
        userAgent: userAgent || 'unknown',
        action: 'signup',
      })

      return {
        success: true,
        user: domainUser,
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  }

  async signOut(): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(`Failed to sign out: ${error.message}`)
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Log password reset request
      await this.auditLog.logAction({
        action: 'password_reset_requested',
        entityType: 'user',
        metadata: { email },
      })

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  }

  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Log password change
        await this.auditLog.logAction({
          userId: user.id,
          action: 'password_changed',
          entityType: 'user',
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Password update error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  }

  async verifyMfaCode(code: string, sessionId: string): Promise<AuthResult> {
    try {
      const supabase = await createClient()
      
      // Verify MFA code - Note: This is a placeholder implementation
      // Real MFA would require proper TOTP verification with email parameter
      const { data, error } = await supabase.auth.verifyOtp({
        email: 'placeholder@example.com', // This would be the actual user email
        token: code,
        type: 'email',
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: 'MFA verification failed',
        }
      }

      // Fetch domain user
      const domainUser = await this.userRepository.findById(data.user.id)
      
      if (!domainUser) {
        return {
          success: false,
          error: 'User not found',
        }
      }

      // Log successful MFA
      await this.auditLog.logAction({
        userId: data.user.id,
        action: 'mfa_verified',
        entityType: 'user',
      })

      return {
        success: true,
        user: domainUser,
      }
    } catch (error) {
      console.error('MFA verification error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  }

  async enableMfa(userId: string): Promise<{ success: boolean; qrCode?: string; secret?: string; error?: string }> {
    try {
      const supabase = await createServiceRoleClient()
      
      // Enable MFA for user
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: '', // Will be filled by actual implementation
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/mfa-setup`,
        },
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Log MFA enablement
      await this.auditLog.logAction({
        userId,
        action: 'mfa_enabled',
        entityType: 'user',
      })

      // In a real implementation, this would generate TOTP secret and QR code
      return {
        success: true,
        qrCode: 'data:image/png;base64,...', // Placeholder
        secret: 'TOTP_SECRET', // Placeholder
      }
    } catch (error) {
      console.error('MFA enable error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  }

  async disableMfa(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, this would disable MFA in Supabase
      
      // Log MFA disablement
      await this.auditLog.logAction({
        userId,
        action: 'mfa_disabled',
        entityType: 'user',
      })

      return { success: true }
    } catch (error) {
      console.error('MFA disable error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      return await this.userRepository.findById(user.id)
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.refreshSession()
      
      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Session refresh error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  }
}