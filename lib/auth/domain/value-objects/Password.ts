import * as crypto from 'crypto'

export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
  preventUserInfo: boolean
}

export const ISMS_P_POLICY_COMPLEX: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
}

export const ISMS_P_POLICY_SIMPLE: PasswordPolicy = {
  minLength: 10,
  maxLength: 128,
  requireUppercase: false,
  requireLowercase: false,
  requireNumbers: true,
  requireSpecialChars: false,
  preventCommonPasswords: true,
  preventUserInfo: true,
}

export class Password {
  private readonly value: string
  private readonly policy: PasswordPolicy

  constructor(password: string, policy: PasswordPolicy = ISMS_P_POLICY_COMPLEX) {
    this.policy = policy
    const validation = this.validate(password)
    if (!validation.isValid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`)
    }
    this.value = password
  }

  validate(password: string, userInfo?: { email?: string; name?: string }): {
    isValid: boolean
    errors: string[]
    strength: number
  } {
    const errors: string[] = []
    let strength = 0

    if (!password) {
      return { isValid: false, errors: ['Password is required'], strength: 0 }
    }

    if (password.length < this.policy.minLength) {
      errors.push(`Password must be at least ${this.policy.minLength} characters`)
    } else {
      strength += 20
    }

    if (password.length > this.policy.maxLength) {
      errors.push(`Password must not exceed ${this.policy.maxLength} characters`)
    }

    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    } else if (/[A-Z]/.test(password)) {
      strength += 20
    }

    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    } else if (/[a-z]/.test(password)) {
      strength += 20
    }

    if (this.policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    } else if (/\d/.test(password)) {
      strength += 20
    }

    if (this.policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      strength += 20
    }

    if (this.policy.preventCommonPasswords && this.isCommonPassword(password)) {
      errors.push('Password is too common')
      strength = Math.max(0, strength - 40)
    }

    if (this.policy.preventUserInfo && userInfo) {
      if (userInfo.email && password.toLowerCase().includes(userInfo.email.split('@')[0].toLowerCase())) {
        errors.push('Password must not contain your email')
        strength = Math.max(0, strength - 30)
      }
      if (userInfo.name && password.toLowerCase().includes(userInfo.name.toLowerCase())) {
        errors.push('Password must not contain your name')
        strength = Math.max(0, strength - 30)
      }
    }

    if (password.length >= 12) strength = Math.min(100, strength + 10)
    if (password.length >= 16) strength = Math.min(100, strength + 10)

    return {
      isValid: errors.length === 0,
      errors,
      strength: Math.min(100, Math.max(0, strength))
    }
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '12345678', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      '1234567890', 'qwerty123', 'password1', 'password12',
      'admin123', 'root', 'toor', 'pass', 'test', 'guest'
    ]
    
    const lowerPassword = password.toLowerCase()
    return commonPasswords.some(common => lowerPassword.includes(common))
  }

  hash(): string {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(this.value, salt, 100000, 64, 'sha512').toString('hex')
    return `${salt}:${hash}`
  }

  static verify(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':')
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return hash === verifyHash
  }

  static generateSecure(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const all = uppercase + lowercase + numbers + special

    let password = ''
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += special[Math.floor(Math.random() * special.length)]

    for (let i = 4; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)]
    }

    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  getStrength(): number {
    return this.validate(this.value).strength
  }

  meetsPolicy(policy: PasswordPolicy): boolean {
    const validation = new Password(this.value, policy).validate(this.value)
    return validation.isValid
  }
}