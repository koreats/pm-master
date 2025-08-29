# T-002 Authentication & Authorization Architecture

## 🏗️ Clean Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                   Presentation Layer                  │
│  (React Components, Forms, UI Feedback)              │
└─────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────┐
│                   Application Layer                   │
│  (Use Cases, Business Logic, Orchestration)          │
└─────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────┐
│                     Domain Layer                      │
│  (Entities, Value Objects, Domain Services)          │
└─────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────┐
│                 Infrastructure Layer                  │
│  (Supabase, External Services, Persistence)          │
└─────────────────────────────────────────────────────┘
```

## 🔐 Security Architecture

### Authentication Flow
```
User → Login Form → Validation → Rate Limiter → Auth Service
                                      ↓
                              Password Policy Check
                                      ↓
                              Account Lock Check
                                      ↓
                              Supabase Auth
                                      ↓
                              Session Creation
                                      ↓
                              Audit Logging
                                      ↓
                              MFA (if enabled)
                                      ↓
                              Dashboard
```

### Authorization Model
```
User ─→ Team Member ─→ Role (owner|admin|member)
         ↓
    Permissions Matrix
         ↓
    Resource Access
```

## 📁 File Structure

```
lib/auth/
├── domain/
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Session.ts
│   │   └── Permission.ts
│   ├── value-objects/
│   │   ├── Email.ts
│   │   ├── Password.ts
│   │   └── Role.ts
│   └── services/
│       ├── PasswordPolicyService.ts
│       └── PermissionService.ts
├── application/
│   ├── use-cases/
│   │   ├── LoginUseCase.ts
│   │   ├── RegisterUseCase.ts
│   │   ├── LogoutUseCase.ts
│   │   └── RefreshSessionUseCase.ts
│   └── services/
│       ├── AuthenticationService.ts
│       ├── AuthorizationService.ts
│       └── SessionService.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── UserRepository.ts
│   │   └── SessionRepository.ts
│   ├── services/
│   │   ├── SupabaseAuthService.ts
│   │   └── AuditLogService.ts
│   └── security/
│       ├── RateLimiter.ts
│       ├── AccountLockService.ts
│       └── CSRFProtection.ts
└── presentation/
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── usePermissions.ts
    │   └── useSession.ts
    ├── guards/
    │   ├── AuthGuard.tsx
    │   └── PermissionGuard.tsx
    └── middleware/
        ├── authMiddleware.ts
        └── securityHeaders.ts
```

## 🛡️ Security Features

### 1. Password Policy (ISMS-P Compliant)
- **Option A**: 8+ chars with uppercase, lowercase, number, special char
- **Option B**: 10+ chars alphanumeric
- Password strength meter
- Password history (prevent reuse of last 5)
- Force change on first login
- Expiry after 90 days

### 2. Account Lockout
- 5 failed attempts = 5 minute lockout
- Progressive delay (exponential backoff)
- Admin unlock capability
- IP-based tracking

### 3. Session Management
- Secure session tokens (JWT with refresh)
- Session timeout (30 min idle, 8 hour absolute)
- Concurrent session limits
- Device fingerprinting
- Session revocation

### 4. Multi-Factor Authentication (MFA)
- TOTP (Time-based One-Time Password)
- Backup codes
- Remember device option (30 days)
- MFA enforcement for admins

### 5. Audit Logging
- All authentication events
- Authorization decisions
- Failed attempts
- Session events
- Data: [timestamp, user_id, IP, user_agent, action, result, metadata]
- Retention: 1+ year

### 6. Input Validation & Sanitization
- Email format validation
- SQL injection prevention
- XSS protection
- CSRF tokens
- Input length limits

### 7. Rate Limiting
- Login: 5 attempts per 15 minutes
- Registration: 3 per hour per IP
- Password reset: 3 per hour per email
- API calls: 100 per minute per user

### 8. Security Headers
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- X-XSS-Protection

## 🔑 Implementation Priorities

### Phase 1: Core Security (Critical)
1. Password policy enforcement
2. Account lockout mechanism
3. Enhanced input validation
4. Rate limiting
5. Security headers

### Phase 2: Session & Monitoring (High)
1. Session management
2. Audit logging
3. Security monitoring dashboard
4. CSRF protection

### Phase 3: Advanced Features (Medium)
1. Multi-factor authentication
2. Device fingerprinting
3. Anomaly detection
4. Security alerts

## 📊 Database Schema Updates

```sql
-- Security tables
CREATE TABLE auth_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE account_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  email TEXT,
  locked_until TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mfa_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  secret TEXT NOT NULL,
  backup_codes TEXT[],
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_auth_attempts_email ON auth_attempts(email);
CREATE INDEX idx_auth_attempts_ip ON auth_attempts(ip_address);
CREATE INDEX idx_account_locks_user ON account_locks(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
```

## 🧪 Testing Strategy

### Unit Tests
- Password validation logic
- Permission calculations
- Rate limiting logic
- Session management

### Integration Tests
- Authentication flow
- Authorization checks
- Database operations
- Supabase integration

### Security Tests
- SQL injection attempts
- XSS attempts
- CSRF validation
- Brute force protection
- Session hijacking prevention

## 📈 Monitoring & Metrics

### Key Metrics
- Failed login attempts rate
- Account lockout frequency
- Session duration average
- MFA adoption rate
- Security incident count

### Alerts
- Multiple failed logins from same IP
- Account lockout threshold reached
- Unusual login patterns
- Privilege escalation attempts
- Session anomalies

## 🚀 Migration Plan

1. Deploy security tables
2. Implement core auth service
3. Add password policy
4. Enable account lockout
5. Deploy audit logging
6. Migrate existing users
7. Enable MFA (optional)
8. Monitor and adjust

---

**Status**: Design Complete ✅
**Next Step**: Implementation of core authentication services