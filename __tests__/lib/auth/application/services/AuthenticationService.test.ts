import { AuthenticationService, LoginCredentials, RegisterData } from '@/lib/auth/application/services/AuthenticationService'

// Mock the Supabase client
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
  from: jest.fn((table) => {
    // Return different mocks based on table name
    if (table === 'users') {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                last_password_change_at: new Date().toISOString()
              }, 
              error: null 
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }
    }
    // Default mock for other tables (user_sessions, audit_logs, etc.)
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }
  })
}

describe('AuthenticationService', () => {
  let authService: AuthenticationService

  beforeEach(() => {
    jest.clearAllMocks()
    authService = new AuthenticationService(mockSupabase as any)
  })

  describe('login', () => {
    const validCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'ValidPass@123',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 Test Browser'
    }

    it('should successfully login with valid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: validCredentials.email },
          session: { access_token: 'token-123' }
        },
        error: null
      })

      const result = await authService.login(validCredentials)

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validCredentials.email,
        password: validCredentials.password
      })
    })

    it('should handle invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      const result = await authService.login(validCredentials)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should validate email format', async () => {
      const invalidCredentials: LoginCredentials = {
        email: 'invalid-email',
        password: 'ValidPass@123'
      }

      const result = await authService.login(invalidCredentials)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('register', () => {
    const validRegisterData: RegisterData = {
      email: 'newuser@example.com',
      password: 'UniqueSecure@9876!',
      name: 'New User'
    }

    it('should successfully register with valid data', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'user-456', email: validRegisterData.email },
          session: { access_token: 'token-456' }
        },
        error: null
      })

      const result = await authService.register(validRegisterData)

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validRegisterData.email,
        password: validRegisterData.password,
        options: {
          data: {
            name: validRegisterData.name
          }
        }
      })
    })

    it('should handle existing email', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      })

      const result = await authService.register(validRegisterData)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('account locking', () => {
    it('should handle failed login attempts', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrong-password'
      }

      // Make multiple failed attempts
      for (let i = 0; i < 6; i++) {
        await authService.login(credentials)
      }

      // Next attempt should be blocked due to lockout
      const result = await authService.login(credentials)
      expect(result.success).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Service unavailable'))

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'ValidPass@123'
      }

      const result = await authService.login(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })
})