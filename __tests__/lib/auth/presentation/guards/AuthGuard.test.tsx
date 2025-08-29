import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/lib/auth/presentation/guards/AuthGuard'
import { useAuth } from '@/lib/auth/presentation/hooks/useAuth'
import { User } from '@/lib/auth/domain/entities/User'
import { Email } from '@/lib/auth/domain/value-objects/Email'
import { Role, RoleType } from '@/lib/auth/domain/value-objects/Role'

// Mock the hooks
jest.mock('@/lib/auth/presentation/hooks/useAuth')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/protected-route')
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('AuthGuard', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter as any)
  })

  const createMockUser = (overrides: Partial<any> = {}): User => {
    const user = User.create({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User'
    })
    
    // Set default role
    user.assignRole('team-1', new Role(RoleType.MEMBER))
    
    // Apply overrides using Object.defineProperty to mock methods
    Object.keys(overrides).forEach(key => {
      if (typeof overrides[key] === 'function') {
        Object.defineProperty(user, key, {
          value: overrides[key],
          writable: true,
          configurable: true
        })
      }
    })
    
    return user
  }

  describe('loading state', () => {
    it('should show loading component when loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: true,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      )

      const loadingContainer = document.querySelector('.animate-spin')
      expect(loadingContainer).toBeInTheDocument()
    })

    it('should show custom loading component when provided', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: true,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard loadingComponent={<div>Custom loading...</div>}>
          <div>Protected content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Custom loading...')).toBeInTheDocument()
    })
  })

  describe('authentication checks', () => {
    it('should redirect to login when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login?returnUrl=%2Fprotected-route')
      })
    })

    it('should redirect to custom fallback URL when provided', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard fallbackUrl="/custom-login">
          <div>Protected content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-login?returnUrl=%2Fprotected-route')
      })
    })

    it('should render children when user is authenticated', () => {
      const mockUser = createMockUser()
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
    })
  })

  describe('email verification checks', () => {
    it('should redirect to email verification when required', async () => {
      const mockUser = createMockUser({
        isEmailVerified: () => false
      })
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard requireEmailVerification>
          <div>Protected content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/verify-email')
      })
    })

    it('should show email verification message when email not verified', () => {
      const mockUser = createMockUser({
        isEmailVerified: () => false
      })
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard requireEmailVerification>
          <div>Protected content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
    })
  })

  describe('MFA checks', () => {
    it('should redirect to MFA setup when required but not enabled', async () => {
      const mockUser = createMockUser({
        isMfaEnabled: () => false
      })
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard requireMfa>
          <div>Protected content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/setup-mfa')
      })
    })

    it('should show MFA setup message when MFA not enabled', () => {
      const mockUser = createMockUser({
        isMfaEnabled: () => false
      })
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard requireMfa>
          <div>Protected content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Two-Factor Authentication Required')).toBeInTheDocument()
    })
  })

  describe('account lock checks', () => {
    it('should redirect to account locked page when account is locked', async () => {
      const mockUser = createMockUser({
        isLocked: () => true,
        getLockReason: () => 'Multiple failed login attempts'
      })
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/account-locked')
      })
    })

    it('should show account locked message when account is locked', () => {
      const mockUser = createMockUser({
        isLocked: () => true,
        getLockReason: () => 'Multiple failed login attempts',
        getLockedUntil: () => new Date(Date.now() + 60000) // 1 minute from now
      })
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Account Locked')).toBeInTheDocument()
      expect(screen.getByText(/Multiple failed login attempts/)).toBeInTheDocument()
    })
  })

  describe('role-based access', () => {
    it('should allow access when user has required role', () => {
      const roles = new Map<string, Role>()
      roles.set('team-1', new Role(RoleType.ADMIN))
      
      const mockUser = createMockUser({
        getAllRoles: () => roles
      })
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard allowedRoles={['admin']}>
          <div>Protected content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
    })

    it('should redirect to unauthorized when user lacks required role', async () => {
      const roles = new Map<string, Role>()
      roles.set('team-1', new Role(RoleType.MEMBER))
      
      const mockUser = createMockUser({
        getAllRoles: () => roles
      })
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard allowedRoles={['admin']}>
          <div>Protected content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized')
      })
    })

    it('should show unauthorized component when provided', () => {
      const roles = new Map<string, Role>()
      roles.set('team-1', new Role(RoleType.MEMBER))
      
      const mockUser = createMockUser({
        getAllRoles: () => roles
      })
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard 
          allowedRoles={['admin']}
          unauthorizedComponent={<div>Custom unauthorized message</div>}
        >
          <div>Protected content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Custom unauthorized message')).toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should handle null user gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: true, // Inconsistent state
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login?returnUrl=%2Fprotected-route')
      })
    })

    it('should handle missing role information gracefully', () => {
      const mockUser = createMockUser({
        getAllRoles: () => new Map()
      })
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        csrfToken: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        verifyMfa: jest.fn(),
        refreshSession: jest.fn(),
        clearError: jest.fn()
      })

      render(
        <AuthGuard allowedRoles={['admin']}>
          <div>Protected content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Unauthorized')).toBeInTheDocument()
    })
  })
})