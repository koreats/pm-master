-- =====================================================
-- T-003: Enhanced RLS Security Policies
-- PM System 2025 - Advanced Security & Performance Optimization
-- Based on Supabase RLS Best Practices
-- =====================================================

-- MFA 인증 레벨 검증 함수 (Security Definer)
CREATE OR REPLACE FUNCTION auth.require_mfa_level(required_level TEXT DEFAULT 'aal2')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (auth.jwt() ->> 'aal') = required_level;
END;
$$;

-- 팀 소유권 검증 함수 개선 (성능 최적화)
CREATE OR REPLACE FUNCTION auth.user_team_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE -- 캐싱 최적화
AS $$
BEGIN
    RETURN ARRAY(
        SELECT team_id 
        FROM public.team_members 
        WHERE user_id = auth.uid()
    );
END;
$$;

-- 팀 관리자 권한 검증 함수
CREATE OR REPLACE FUNCTION auth.is_team_admin(check_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.team_members
        WHERE user_id = auth.uid()
        AND team_id = check_team_id
        AND role IN ('owner', 'admin')
    );
END;
$$;

-- =====================================================
-- 민감한 데이터에 대한 제한적 정책
-- =====================================================

-- 사용자 민감 정보 보호 정책 강화
DROP POLICY IF EXISTS "Users can view team members" ON public.users;
CREATE POLICY "Enhanced team member visibility" 
    ON public.users FOR SELECT
    TO authenticated
    USING (
        -- 자신의 프로필은 항상 볼 수 있음
        (auth.uid() = id) 
        OR 
        -- 같은 팀 멤버의 기본 정보만 볼 수 있음
        (id = ANY(
            SELECT tm.user_id 
            FROM public.team_members tm1
            JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
            WHERE tm1.user_id = auth.uid()
            AND tm2.user_id = users.id
        ))
    );

-- 고위험 작업에 대한 MFA 요구 정책
CREATE POLICY "Team deletion requires MFA"
    ON public.teams FOR DELETE
    TO authenticated
    USING (
        get_team_role(id, auth.uid()) = 'owner'
        AND auth.require_mfa_level('aal2')
    );

-- =====================================================
-- 감사 로그 및 보안 모니터링 강화
-- =====================================================

-- 민감한 변경사항에 대한 자동 감사 로그 트리거
CREATE OR REPLACE FUNCTION log_sensitive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    change_metadata JSONB;
BEGIN
    -- 민감한 변경사항 탐지
    IF TG_TABLE_NAME = 'team_members' AND TG_OP = 'UPDATE' THEN
        IF OLD.role != NEW.role THEN
            change_metadata := jsonb_build_object(
                'table', TG_TABLE_NAME,
                'operation', 'role_change',
                'old_role', OLD.role,
                'new_role', NEW.role,
                'affected_user', NEW.user_id,
                'changed_by', auth.uid()
            );
            
            INSERT INTO public.audit_logs (
                user_id, action, entity_type, entity_id, 
                ip_address, metadata
            ) VALUES (
                auth.uid(), 
                'sensitive_role_change',
                'team_member',
                NEW.id,
                inet_client_addr(),
                change_metadata
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 민감한 변경사항 감사 트리거 적용
DROP TRIGGER IF EXISTS audit_team_role_changes ON public.team_members;
CREATE TRIGGER audit_team_role_changes
    AFTER UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION log_sensitive_changes();

-- =====================================================
-- 시간 기반 접근 제한 정책
-- =====================================================

-- 업무 시간 외 민감한 작업 제한 (선택적 활용)
CREATE OR REPLACE FUNCTION auth.is_business_hours()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    current_hour INTEGER;
    current_day INTEGER;
BEGIN
    current_hour := EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Asia/Seoul');
    current_day := EXTRACT(DOW FROM NOW() AT TIME ZONE 'Asia/Seoul');
    
    -- 평일 09:00-18:00 정의
    RETURN (current_day BETWEEN 1 AND 5) AND (current_hour BETWEEN 9 AND 18);
END;
$$;

-- =====================================================
-- 고급 보안 정책들
-- =====================================================

-- IP 기반 접근 제한 (관리자 기능용)
CREATE OR REPLACE FUNCTION auth.is_allowed_ip()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    client_ip INET;
    allowed_ranges INET[];
BEGIN
    client_ip := inet_client_addr();
    
    -- 허용된 IP 대역 (예시 - 실제 환경에 맞게 수정)
    allowed_ranges := ARRAY[
        '10.0.0.0/8'::INET,      -- 내부 네트워크
        '192.168.0.0/16'::INET,  -- 로컬 네트워크
        '127.0.0.1/32'::INET     -- 로컬호스트
    ];
    
    -- 개발 환경에서는 모든 IP 허용
    IF current_setting('app.environment', true) = 'development' THEN
        RETURN true;
    END IF;
    
    -- IP 대역 검사
    RETURN client_ip << ANY(allowed_ranges);
END;
$$;

-- =====================================================
-- 성능 최적화된 RLS 정책들
-- =====================================================

-- 기존 복잡한 서브쿼리 정책들을 최적화된 함수 호출로 교체

-- Projects 테이블 정책 최적화
DROP POLICY IF EXISTS "Team members can view projects" ON public.projects;
CREATE POLICY "Optimized team project access"
    ON public.projects FOR SELECT
    TO authenticated
    USING (
        goal_id IN (
            SELECT g.id 
            FROM public.goals g
            WHERE g.team_id = ANY(auth.user_team_ids())
        )
    );

-- Tasks 테이블 정책 최적화
DROP POLICY IF EXISTS "Team members can view tasks" ON public.tasks;
CREATE POLICY "Optimized team task access"
    ON public.tasks FOR SELECT  
    TO authenticated
    USING (
        project_id IN (
            SELECT p.id
            FROM public.projects p
            JOIN public.goals g ON g.id = p.goal_id
            WHERE g.team_id = ANY(auth.user_team_ids())
        )
    );

-- =====================================================
-- 데이터 마스킹 정책 (개인정보 보호)
-- =====================================================

-- 개인정보 마스킹 함수
CREATE OR REPLACE FUNCTION mask_sensitive_data(
    data_value TEXT, 
    mask_type TEXT DEFAULT 'partial'
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    CASE mask_type
        WHEN 'email' THEN
            RETURN LEFT(data_value, 2) || '***@' || 
                   RIGHT(SPLIT_PART(data_value, '@', 2), 6);
        WHEN 'phone' THEN
            RETURN '***-****-' || RIGHT(data_value, 4);
        WHEN 'partial' THEN
            RETURN LEFT(data_value, 2) || REPEAT('*', GREATEST(0, LENGTH(data_value) - 4)) || 
                   RIGHT(data_value, 2);
        ELSE
            RETURN data_value;
    END CASE;
END;
$$;

-- =====================================================
-- 보안 설정 검증 함수들
-- =====================================================

-- RLS 정책 상태 검증
CREATE OR REPLACE FUNCTION security.verify_rls_enabled()
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.schemaname::TEXT,
        t.tablename::TEXT,
        t.rowsecurity,
        COALESCE(p.policy_count, 0)::INTEGER
    FROM pg_tables t
    LEFT JOIN (
        SELECT 
            schemaname, 
            tablename, 
            COUNT(*) as policy_count
        FROM pg_policies 
        GROUP BY schemaname, tablename
    ) p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    ORDER BY t.tablename;
END;
$$;

-- 보안 설정 점검 함수
CREATE OR REPLACE FUNCTION security.security_audit()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- RLS 활성화 상태 확인
    RETURN QUERY
    SELECT 
        'RLS_ENABLED'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'FAIL' ELSE 'PASS' END::TEXT,
        'Tables without RLS: ' || COALESCE(STRING_AGG(tablename, ', '), 'None')::TEXT
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND NOT rowsecurity;
    
    -- 보안 함수 존재 확인
    RETURN QUERY
    SELECT 
        'SECURITY_FUNCTIONS'::TEXT,
        CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Security functions count: ' || COUNT(*)::TEXT
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'auth' 
    AND p.proname LIKE '%team%' OR p.proname LIKE '%mfa%';
    
END;
$$;

-- =====================================================
-- 설정 완료 및 권한 부여
-- =====================================================

-- auth 스키마 함수들에 대한 실행 권한
GRANT EXECUTE ON FUNCTION auth.require_mfa_level(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_team_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_team_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_business_hours() TO authenticated;

-- security 스키마 함수들은 관리자만 실행 가능
REVOKE ALL ON FUNCTION security.verify_rls_enabled() FROM PUBLIC;
REVOKE ALL ON FUNCTION security.security_audit() FROM PUBLIC;

-- 보안 강화 완료 로그
COMMENT ON SCHEMA auth IS 'Enhanced authentication and authorization functions for PM System 2025';
COMMENT ON SCHEMA security IS 'Security audit and verification functions - Admin access only';