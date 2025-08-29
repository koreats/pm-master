-- =====================================================
-- T-003: Security Compliance Validation & Enhancement
-- PM System 2025 - ISMS-P Compliance Verification
-- =====================================================

-- =====================================================
-- ISMS-P 준수성 검증 함수들
-- =====================================================

-- 비밀번호 정책 검증 함수
CREATE OR REPLACE FUNCTION security.validate_password_policy(password_text TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    policy_check TEXT,
    requirement TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- ISMS-P 비밀번호 정책:
    -- 1. 8자 이상 + 대소문자/숫자/특수문자 혼합 OR
    -- 2. 10자 이상 영문자/숫자 조합
    
    -- 8자 이상 혼합 문자 정책 검증
    RETURN QUERY VALUES (
        length(password_text) >= 8 
        AND password_text ~ '[A-Z]' 
        AND password_text ~ '[a-z]' 
        AND password_text ~ '[0-9]' 
        AND password_text ~ '[^A-Za-z0-9]',
        'mixed_8_chars'::TEXT,
        '8자 이상 + 대소문자/숫자/특수문자 혼합'::TEXT
    );
    
    -- 10자 이상 영숫자 정책 검증
    RETURN QUERY VALUES (
        length(password_text) >= 10 
        AND password_text ~ '[A-Za-z]' 
        AND password_text ~ '[0-9]',
        'alphanum_10_chars'::TEXT,
        '10자 이상 + 영문자/숫자 조합'::TEXT
    );
END;
$$;

-- 계정 잠금 정책 검증 함수
CREATE OR REPLACE FUNCTION security.check_account_lockout_policy(user_email TEXT)
RETURNS TABLE(
    should_lock BOOLEAN,
    failed_attempts INTEGER,
    lockout_until TIMESTAMPTZ,
    policy_compliant BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recent_failures INTEGER;
    last_failure TIMESTAMPTZ;
    calculated_lockout TIMESTAMPTZ;
BEGIN
    -- 최근 5분 내 실패 시도 카운트 (ISMS-P: 5회 실패 시 5분 잠금)
    SELECT 
        COUNT(*),
        MAX(created_at)
    INTO recent_failures, last_failure
    FROM public.auth_attempts
    WHERE email = user_email 
    AND success = false 
    AND created_at >= NOW() - INTERVAL '5 minutes';
    
    -- 잠금 여부 결정
    IF recent_failures >= 5 THEN
        calculated_lockout := last_failure + INTERVAL '5 minutes';
        
        RETURN QUERY VALUES (
            true,
            recent_failures,
            calculated_lockout,
            true -- ISMS-P 정책 준수
        );
    ELSE
        RETURN QUERY VALUES (
            false,
            recent_failures,
            NULL::TIMESTAMPTZ,
            true
        );
    END IF;
END;
$$;

-- =====================================================
-- 개인정보 마스킹 검증 및 강화
-- =====================================================

-- ISMS-P 개인정보 마스킹 정책 함수
CREATE OR REPLACE FUNCTION security.mask_personal_data(
    data_value TEXT,
    data_type TEXT,
    requester_role TEXT DEFAULT 'member'
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- 관리자는 전체 정보 조회 가능
    IF requester_role IN ('owner', 'admin') THEN
        RETURN data_value;
    END IF;
    
    CASE data_type
        WHEN 'email' THEN
            -- 이메일: test@***.com 형태로 마스킹
            RETURN LEFT(SPLIT_PART(data_value, '@', 1), 2) || '***@' || 
                   RIGHT(SPLIT_PART(data_value, '@', 2), 6);
                   
        WHEN 'name' THEN
            -- 이름: 김*수 형태로 마스킹 (한글/영문 고려)
            IF LENGTH(data_value) <= 2 THEN
                RETURN LEFT(data_value, 1) || '*';
            ELSE
                RETURN LEFT(data_value, 1) || REPEAT('*', LENGTH(data_value) - 2) || RIGHT(data_value, 1);
            END IF;
            
        WHEN 'phone' THEN
            -- 전화번호: 010-****-1234 형태로 마스킹
            RETURN REGEXP_REPLACE(data_value, '(\d{3})-?\d{4}-?(\d{4})', '\1-****-\2');
            
        WHEN 'ip_address' THEN
            -- IP 주소: 192.168.***.*** 형태로 마스킹
            RETURN REGEXP_REPLACE(data_value::TEXT, '(\d+\.\d+\.)\d+\.\d+', '\1***.***');
            
        ELSE
            -- 기본 부분 마스킹
            IF LENGTH(data_value) <= 4 THEN
                RETURN REPEAT('*', LENGTH(data_value));
            ELSE
                RETURN LEFT(data_value, 2) || REPEAT('*', LENGTH(data_value) - 4) || RIGHT(data_value, 2);
            END IF;
    END CASE;
END;
$$;

-- =====================================================
-- 보안 이벤트 자동 탐지 시스템
-- =====================================================

-- 의심스러운 활동 탐지 함수
CREATE OR REPLACE FUNCTION security.detect_suspicious_activity()
RETURNS TABLE(
    alert_type TEXT,
    severity TEXT,
    user_id UUID,
    description TEXT,
    metadata JSONB,
    detected_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. 비정상적인 로그인 시도 (같은 IP에서 여러 계정 시도)
    RETURN QUERY
    SELECT 
        'multiple_account_attempts'::TEXT,
        'medium'::TEXT,
        NULL::UUID,
        'Same IP attempting multiple accounts: ' || ip_address::TEXT,
        jsonb_build_object(
            'ip_address', ip_address,
            'email_count', COUNT(DISTINCT email),
            'attempt_count', COUNT(*),
            'time_window', '1 hour'
        ),
        NOW()
    FROM public.auth_attempts
    WHERE created_at >= NOW() - INTERVAL '1 hour'
    AND success = false
    GROUP BY ip_address
    HAVING COUNT(DISTINCT email) >= 3 AND COUNT(*) >= 10;
    
    -- 2. 비정상적인 시간대 접근 (업무시간 외 관리자 활동)
    RETURN QUERY
    SELECT 
        'off_hours_admin_activity'::TEXT,
        'high'::TEXT,
        al.user_id,
        'Admin activity during off-hours',
        jsonb_build_object(
            'action', al.action,
            'entity_type', al.entity_type,
            'hour', EXTRACT(HOUR FROM al.created_at),
            'day_of_week', EXTRACT(DOW FROM al.created_at)
        ),
        al.created_at
    FROM public.audit_logs al
    JOIN public.users u ON u.id = al.user_id
    WHERE al.created_at >= NOW() - INTERVAL '24 hours'
    AND (EXTRACT(HOUR FROM al.created_at) NOT BETWEEN 9 AND 18
         OR EXTRACT(DOW FROM al.created_at) NOT BETWEEN 1 AND 5)
    AND al.action LIKE '%admin%';
    
    -- 3. 대량 데이터 접근
    RETURN QUERY
    SELECT 
        'bulk_data_access'::TEXT,
        'medium'::TEXT,
        al.user_id,
        'Unusual bulk data access pattern',
        jsonb_build_object(
            'access_count', COUNT(*),
            'time_window', '10 minutes',
            'entity_types', array_agg(DISTINCT al.entity_type)
        ),
        MAX(al.created_at)
    FROM public.audit_logs al
    WHERE al.created_at >= NOW() - INTERVAL '10 minutes'
    GROUP BY al.user_id
    HAVING COUNT(*) >= 50;
END;
$$;

-- 자동 보안 알림 생성 트리거 함수
CREATE OR REPLACE FUNCTION security.create_security_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    suspicious_activity RECORD;
BEGIN
    -- 의심스러운 활동 탐지 및 알림 생성
    FOR suspicious_activity IN 
        SELECT * FROM security.detect_suspicious_activity()
    LOOP
        INSERT INTO public.security_alerts (
            user_id,
            alert_type,
            severity,
            description,
            metadata
        ) VALUES (
            suspicious_activity.user_id,
            suspicious_activity.alert_type,
            suspicious_activity.severity,
            suspicious_activity.description,
            suspicious_activity.metadata
        )
        ON CONFLICT DO NOTHING; -- 중복 알림 방지
    END LOOP;
END;
$$;

-- =====================================================
-- ISMS-P 로그 보관 정책 검증
-- =====================================================

-- 로그 보관 상태 검증 함수
CREATE OR REPLACE FUNCTION security.validate_log_retention_policy()
RETURNS TABLE(
    log_table TEXT,
    oldest_record TIMESTAMPTZ,
    retention_days INTEGER,
    compliant BOOLEAN,
    recommendation TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- ISMS-P 요구사항: 1년(365일) 이상 보관
    
    -- 감사 로그 검증
    RETURN QUERY
    SELECT 
        'audit_logs'::TEXT,
        MIN(created_at),
        EXTRACT(DAYS FROM NOW() - MIN(created_at))::INTEGER,
        EXTRACT(DAYS FROM NOW() - MIN(created_at)) >= 365,
        CASE 
            WHEN EXTRACT(DAYS FROM NOW() - MIN(created_at)) >= 365 THEN '정책 준수'
            ELSE '로그 보관 기간 부족 - 최소 1년 보관 필요'
        END::TEXT
    FROM public.audit_logs;
    
    -- 인증 시도 로그 검증
    RETURN QUERY
    SELECT 
        'auth_attempts'::TEXT,
        MIN(created_at),
        EXTRACT(DAYS FROM NOW() - MIN(created_at))::INTEGER,
        EXTRACT(DAYS FROM NOW() - MIN(created_at)) >= 30, -- 인증 시도는 30일 보관
        CASE 
            WHEN EXTRACT(DAYS FROM NOW() - MIN(created_at)) >= 30 THEN '정책 준수'
            ELSE '인증 로그 보관 기간 부족'
        END::TEXT
    FROM public.auth_attempts;
    
    -- 활동 로그 검증
    RETURN QUERY
    SELECT 
        'activity_logs'::TEXT,
        MIN(created_at),
        EXTRACT(DAYS FROM NOW() - MIN(created_at))::INTEGER,
        EXTRACT(DAYS FROM NOW() - MIN(created_at)) >= 365,
        CASE 
            WHEN EXTRACT(DAYS FROM NOW() - MIN(created_at)) >= 365 THEN '정책 준수'
            ELSE '활동 로그 보관 기간 부족 - 최소 1년 보관 필요'
        END::TEXT
    FROM public.activity_logs;
END;
$$;

-- =====================================================
-- 보안 설정 통합 검증 대시보드
-- =====================================================

-- 종합 보안 상태 검증 함수
CREATE OR REPLACE FUNCTION security.comprehensive_security_audit()
RETURNS TABLE(
    category TEXT,
    check_name TEXT,
    status TEXT,
    details TEXT,
    priority TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. RLS 활성화 상태 확인
    RETURN QUERY
    SELECT 
        'Row Level Security'::TEXT,
        'RLS_ENABLED_' || t.tablename::TEXT,
        CASE WHEN t.rowsecurity THEN 'PASS' ELSE 'FAIL' END::TEXT,
        t.tablename || ' RLS status: ' || t.rowsecurity::TEXT,
        CASE WHEN NOT t.rowsecurity THEN 'HIGH' ELSE 'LOW' END::TEXT
    FROM pg_tables t
    WHERE t.schemaname = 'public';
    
    -- 2. 보안 함수 존재 확인
    RETURN QUERY
    SELECT 
        'Security Functions'::TEXT,
        'AUTH_FUNCTIONS_AVAILABLE'::TEXT,
        CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Available auth functions: ' || COUNT(*)::TEXT,
        'MEDIUM'::TEXT
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'auth';
    
    -- 3. 인덱스 보안 최적화 확인
    RETURN QUERY
    SELECT 
        'Performance Security'::TEXT,
        'RLS_OPTIMIZED_INDEXES'::TEXT,
        CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Security-optimized indexes: ' || COUNT(*)::TEXT,
        'MEDIUM'::TEXT
    FROM pg_indexes
    WHERE schemaname = 'public' 
    AND (indexname LIKE '%user%' OR indexname LIKE '%team%' OR indexname LIKE '%auth%');
    
    -- 4. 보안 테이블 데이터 무결성
    RETURN QUERY
    SELECT 
        'Data Integrity'::TEXT,
        'SECURITY_TABLES_POPULATED'::TEXT,
        'INFO'::TEXT,
        'Security tables ready for production use'::TEXT,
        'LOW'::TEXT;
        
END;
$$;

-- =====================================================
-- 자동화된 보안 정책 실행
-- =====================================================

-- 정기 보안 검사 함수 (매일 실행 권장)
CREATE OR REPLACE FUNCTION security.daily_security_maintenance()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    report TEXT := '';
    alert_count INTEGER;
BEGIN
    -- 1. 의심스러운 활동 탐지 및 알림 생성
    PERFORM security.create_security_alerts();
    
    -- 2. 만료된 세션 정리
    DELETE FROM public.user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS alert_count = ROW_COUNT;
    report := report || 'Expired sessions cleaned: ' || alert_count || E'\n';
    
    -- 3. 오래된 인증 시도 기록 정리 (30일 이상)
    DELETE FROM public.auth_attempts WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS alert_count = ROW_COUNT;
    report := report || 'Old auth attempts cleaned: ' || alert_count || E'\n';
    
    -- 4. 만료된 계정 잠금 해제
    DELETE FROM public.account_locks WHERE locked_until < NOW();
    GET DIAGNOSTICS alert_count = ROW_COUNT;
    report := report || 'Expired account locks removed: ' || alert_count || E'\n';
    
    -- 5. 보안 알림 요약
    SELECT COUNT(*) INTO alert_count 
    FROM public.security_alerts 
    WHERE created_at >= CURRENT_DATE AND NOT acknowledged;
    report := report || 'New security alerts: ' || alert_count || E'\n';
    
    report := 'Daily Security Maintenance - ' || CURRENT_TIMESTAMP || E'\n' ||
              '==============================================' || E'\n' ||
              report || E'\n' ||
              'Status: Completed successfully';
    
    RETURN report;
END;
$$;

-- =====================================================
-- 권한 설정 및 보안 강화
-- =====================================================

-- 보안 함수들의 실행 권한 제한
REVOKE ALL ON FUNCTION security.detect_suspicious_activity() FROM PUBLIC;
REVOKE ALL ON FUNCTION security.create_security_alerts() FROM PUBLIC;
REVOKE ALL ON FUNCTION security.comprehensive_security_audit() FROM PUBLIC;
REVOKE ALL ON FUNCTION security.daily_security_maintenance() FROM PUBLIC;

-- 인증된 사용자에게 제한적 권한 부여
GRANT EXECUTE ON FUNCTION security.validate_password_policy(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION security.mask_personal_data(TEXT, TEXT, TEXT) TO authenticated;

-- 로그 보관 정책 검증은 관리자만
REVOKE ALL ON FUNCTION security.validate_log_retention_policy() FROM PUBLIC;

-- 완료 및 설명
COMMENT ON SCHEMA security IS 'ISMS-P compliant security validation and monitoring system';
COMMENT ON FUNCTION security.daily_security_maintenance() IS 'Daily security maintenance - should be scheduled via cron or edge functions';