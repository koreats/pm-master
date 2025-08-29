import { PasswordPolicyService } from '@/lib/auth/domain/services/PasswordPolicyService'
import { Password, ISMS_P_POLICY_SIMPLE } from '@/lib/auth/domain/value-objects/Password'

describe('PasswordPolicyService', () => {
  let passwordPolicyService: PasswordPolicyService

  beforeEach(() => {
    passwordPolicyService = new PasswordPolicyService()
  })

  describe('validateNewPassword', () => {
    it('should accept complex password with 8+ characters', () => {
      const result = passwordPolicyService.validateNewPassword('Complex@987')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept simple password with 10+ alphanumeric characters', () => {
      const password = new Password('Simple9876543210', ISMS_P_POLICY_SIMPLE)
      const simplePolicyService = new PasswordPolicyService(ISMS_P_POLICY_SIMPLE)
      const result = simplePolicyService.validateNewPassword('Simple9876543210')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password shorter than 8 characters for complex policy', () => {
      expect(() => new Password('Shrt@7')).toThrow('Password must be at least 8 characters')
    })

    it('should reject password shorter than 10 characters for simple policy', () => {
      expect(() => new Password('Short987', ISMS_P_POLICY_SIMPLE)).toThrow('Password must be at least 10 characters')
    })

    it('should reject complex password without special characters', () => {
      expect(() => new Password('NoSpecial987')).toThrow('Password must contain at least one special character')
    })

    it('should reject complex password without uppercase letter', () => {
      expect(() => new Password('nouppercase@987')).toThrow('Password must contain at least one uppercase letter')
    })

    it('should reject complex password without lowercase letter', () => {
      expect(() => new Password('NOLOWERCASE@987')).toThrow('Password must contain at least one lowercase letter')
    })

    it('should reject complex password without number', () => {
      expect(() => new Password('NoNumbers@Abc')).toThrow('Password must contain at least one number')
    })
  })

  describe('password strength checking', () => {
    it('should return high strength for very strong password', () => {
      const result = passwordPolicyService.validateNewPassword('MyVeryStrongP@ssw0rd9876!')
      
      expect(result.isValid).toBe(true)
      expect(result.strength).toBeGreaterThan(80)
    })

    it('should return good strength for good password', () => {
      const result = passwordPolicyService.validateNewPassword('GoodP@ssw0rd987')
      
      expect(result.isValid).toBe(true)
      expect(result.strength).toBeGreaterThan(60)
    })

    it('should return medium strength for decent password', () => {
      const result = passwordPolicyService.validateNewPassword('Decent@987')
      
      expect(result.isValid).toBe(true)
      expect(result.strength).toBeGreaterThan(40)
    })

    it('should return low strength for weak password', () => {
      const result = passwordPolicyService.validateNewPassword('Weak@987')
      
      expect(result.isValid).toBe(true)
      expect(result.strength).toBeGreaterThan(20)
    })
  })

  describe('password history validation', () => {
    it('should validate password with history correctly', () => {
      const mockHistory = [
        { hashedPassword: 'old-hash-1', createdAt: new Date(Date.now() - 86400000) },
        { hashedPassword: 'old-hash-2', createdAt: new Date(Date.now() - 172800000) }
      ]
      
      const result = passwordPolicyService.validateNewPassword('NewSecure@987', undefined, mockHistory)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('checkPasswordExpiry', () => {
    it('should return expired for password older than 90 days', () => {
      const lastChangeDate = new Date()
      lastChangeDate.setDate(lastChangeDate.getDate() - 91) // 91 days ago
      
      const result = passwordPolicyService.checkPasswordExpiry(lastChangeDate)
      
      expect(result.isExpired).toBe(true)
      expect(result.daysRemaining).toBe(0)
    })

    it('should return not expired for password newer than 90 days', () => {
      const lastChangeDate = new Date()
      lastChangeDate.setDate(lastChangeDate.getDate() - 30) // 30 days ago
      
      const result = passwordPolicyService.checkPasswordExpiry(lastChangeDate)
      
      expect(result.isExpired).toBe(false)
      expect(result.daysRemaining).toBe(60)
    })

    it('should return not expired for brand new password', () => {
      const lastChangeDate = new Date() // Now
      
      const result = passwordPolicyService.checkPasswordExpiry(lastChangeDate)
      
      expect(result.isExpired).toBe(false)
      expect(result.daysRemaining).toBe(90)
    })
  })

  describe('utility methods', () => {
    it('should generate secure password meeting policy requirements', () => {
      const password = passwordPolicyService.generateSecurePassword()
      
      expect(password).toBeTruthy()
      expect(password.length).toBeGreaterThanOrEqual(16)
      
      const validation = passwordPolicyService.validateNewPassword(password)
      expect(validation.isValid).toBe(true)
      expect(validation.strength).toBeGreaterThanOrEqual(80)
    })

    it('should return password requirements correctly', () => {
      const requirements = passwordPolicyService.getPasswordRequirements()
      
      expect(requirements).toContain('At least 8 characters')
      expect(requirements).toContain('At least one uppercase letter')
      expect(requirements).toContain('At least one lowercase letter')
      expect(requirements).toContain('At least one number')
      expect(requirements).toContain('At least one special character (!@#$%^&*...)')
    })
  })
})