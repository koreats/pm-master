-- T-002 Authentication & Authorization Security Tables
-- ISMS-P Compliant Security Enhancement

-- Auth attempts tracking table
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Account locks table
CREATE TABLE IF NOT EXISTS public.account_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT,
  locked_until TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enhanced audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User sessions table for session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MFA settings table
CREATE TABLE IF NOT EXISTS public.mfa_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  secret TEXT NOT NULL,
  backup_codes TEXT[],
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password history table
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- Can be user_id, ip_address, or email
  action TEXT NOT NULL, -- login, register, password_reset, api_call
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL,
  UNIQUE(identifier, action, window_start)
);

-- Security alerts table
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- suspicious_login, password_change, mfa_disabled, etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add security columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_mfa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lock_reason TEXT,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_password_change_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email ON public.auth_attempts(email);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip ON public.auth_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_created ON public.auth_attempts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_locks_user ON public.account_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_account_locks_email ON public.account_locks(email);
CREATE INDEX IF NOT EXISTS idx_account_locks_locked_until ON public.account_locks(locked_until);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_mfa_settings_user ON public.mfa_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON public.password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created ON public.password_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_end);

CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON public.security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON public.security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_acknowledged ON public.security_alerts(acknowledged);

-- Create updated_at trigger for MFA settings
CREATE TRIGGER update_mfa_settings_updated_at BEFORE UPDATE ON public.mfa_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_sessions
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old auth attempts
CREATE OR REPLACE FUNCTION cleanup_old_auth_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM public.auth_attempts
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE window_end < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security for new tables
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (read-only for users)
CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Team admins can view team audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        entity_type = 'team' AND
        entity_id IN (
            SELECT team_id FROM public.team_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
    ON public.user_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
    ON public.user_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for mfa_settings
CREATE POLICY "Users can view their own MFA settings"
    ON public.mfa_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own MFA settings"
    ON public.mfa_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for security_alerts
CREATE POLICY "Users can view their own security alerts"
    ON public.security_alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can acknowledge their own security alerts"
    ON public.security_alerts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Note: auth_attempts, account_locks, password_history, and rate_limits
-- are system tables that should only be accessed by backend services
-- No RLS policies are created for direct user access

-- Create scheduled job for cleanup (requires pg_cron extension)
-- Uncomment if pg_cron is available
-- SELECT cron.schedule('cleanup-expired-sessions', '*/30 * * * *', 'SELECT cleanup_expired_sessions();');
-- SELECT cron.schedule('cleanup-old-auth-attempts', '0 0 * * *', 'SELECT cleanup_old_auth_attempts();');
-- SELECT cron.schedule('cleanup-expired-rate-limits', '*/15 * * * *', 'SELECT cleanup_expired_rate_limits();');