import { Password, PasswordPolicy, ISMS_P_POLICY_COMPLEX, ISMS_P_POLICY_SIMPLE } from '../value-objects/Password'

export interface PasswordHistoryEntry {
  hashedPassword: string
  createdAt: Date
}

export class PasswordPolicyService {
  private readonly policy: PasswordPolicy
  private readonly historyLimit: number

  constructor(
    policy: PasswordPolicy = ISMS_P_POLICY_COMPLEX,
    historyLimit: number = 5
  ) {
    this.policy = policy
    this.historyLimit = historyLimit
  }

  validateNewPassword(
    password: string,
    userInfo?: { email?: string; name?: string },
    passwordHistory?: PasswordHistoryEntry[]
  ): {
    isValid: boolean
    errors: string[]
    strength: number
  } {
    const passwordObj = new Password(password, this.policy)
    const validation = passwordObj.validate(password, userInfo)

    if (validation.isValid && passwordHistory && passwordHistory.length > 0) {
      const recentPasswords = passwordHistory
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, this.historyLimit)

      for (const entry of recentPasswords) {
        if (Password.verify(password, entry.hashedPassword)) {
          validation.isValid = false
          validation.errors.push(`Password must not match your last ${this.historyLimit} passwords`)
          break
        }
      }
    }

    return validation
  }

  checkPasswordExpiry(lastPasswordChangeAt?: Date, maxDays: number = 90): {
    isExpired: boolean
    daysRemaining: number
    message?: string
  } {
    if (!lastPasswordChangeAt) {
      return {
        isExpired: true,
        daysRemaining: 0,
        message: 'Password has never been changed'
      }
    }

    const now = new Date()
    const daysSinceChange = Math.floor(
      (now.getTime() - lastPasswordChangeAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    const daysRemaining = Math.max(0, maxDays - daysSinceChange)

    if (daysSinceChange >= maxDays) {
      return {
        isExpired: true,
        daysRemaining: 0,
        message: `Password expired ${daysSinceChange - maxDays} days ago`
      }
    }

    if (daysRemaining <= 7) {
      return {
        isExpired: false,
        daysRemaining,
        message: `Password will expire in ${daysRemaining} days`
      }
    }

    return {
      isExpired: false,
      daysRemaining,
    }
  }

  generateSecurePassword(): string {
    let password: string
    let attempts = 0
    const maxAttempts = 100

    do {
      password = Password.generateSecure(16)
      const validation = this.validateNewPassword(password)
      if (validation.isValid && validation.strength >= 80) {
        return password
      }
      attempts++
    } while (attempts < maxAttempts)

    throw new Error('Failed to generate secure password meeting policy requirements')
  }

  getPasswordRequirements(): string[] {
    const requirements: string[] = []

    requirements.push(`At least ${this.policy.minLength} characters`)
    
    if (this.policy.maxLength < 256) {
      requirements.push(`Maximum ${this.policy.maxLength} characters`)
    }

    if (this.policy.requireUppercase) {
      requirements.push('At least one uppercase letter')
    }

    if (this.policy.requireLowercase) {
      requirements.push('At least one lowercase letter')
    }

    if (this.policy.requireNumbers) {
      requirements.push('At least one number')
    }

    if (this.policy.requireSpecialChars) {
      requirements.push('At least one special character (!@#$%^&*...)')
    }

    if (this.policy.preventCommonPasswords) {
      requirements.push('Must not be a common password')
    }

    if (this.policy.preventUserInfo) {
      requirements.push('Must not contain your email or name')
    }

    requirements.push(`Must not match your last ${this.historyLimit} passwords`)

    return requirements
  }

  getStrengthLabel(strength: number): string {
    if (strength >= 80) return 'Strong'
    if (strength >= 60) return 'Good'
    if (strength >= 40) return 'Fair'
    if (strength >= 20) return 'Weak'
    return 'Very Weak'
  }

  getStrengthColor(strength: number): string {
    if (strength >= 80) return '#10b981' // green-500
    if (strength >= 60) return '#3b82f6' // blue-500
    if (strength >= 40) return '#f59e0b' // amber-500
    if (strength >= 20) return '#f97316' // orange-500
    return '#ef4444' // red-500
  }

  shouldEnforceComplexPolicy(userRole?: string): boolean {
    const adminRoles = ['owner', 'admin', 'superadmin']
    return adminRoles.includes(userRole?.toLowerCase() || '')
  }

  getPolicy(): PasswordPolicy {
    return this.policy
  }

  getAlternativePolicy(): PasswordPolicy {
    return this.policy === ISMS_P_POLICY_COMPLEX 
      ? ISMS_P_POLICY_SIMPLE 
      : ISMS_P_POLICY_COMPLEX
  }
}