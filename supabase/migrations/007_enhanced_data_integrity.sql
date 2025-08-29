-- =====================================================
-- T-003: Enhanced Data Integrity Constraints
-- PM System 2025 - Data Consistency & Business Rules
-- =====================================================

-- =====================================================
-- 도메인 타입 정의 (재사용 가능한 데이터 타입)
-- =====================================================

-- 이메일 도메인 타입
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_address') THEN
        CREATE DOMAIN email_address AS TEXT
        CHECK (VALUE ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
END
$$;

-- URL 도메인 타입
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'url_address') THEN
        CREATE DOMAIN url_address AS TEXT
        CHECK (VALUE ~ '^https?://[^\s]+$');
    END IF;
END
$$;

-- 상태 열거형 타입들
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
        CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
END
$$;

-- =====================================================
-- 비즈니스 룰 검증 함수들
-- =====================================================

-- 날짜 일관성 검증 함수
CREATE OR REPLACE FUNCTION validate_date_range(
    start_date DATE,
    end_date DATE,
    allow_same_day BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- NULL 값 허용
    IF start_date IS NULL OR end_date IS NULL THEN
        RETURN true;
    END IF;
    
    -- 종료일이 시작일보다 이전인 경우 거부
    IF end_date < start_date THEN
        RETURN false;
    END IF;
    
    -- 같은 날 허용 여부 확인
    IF NOT allow_same_day AND end_date = start_date THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- 진행률 일관성 검증 함수
CREATE OR REPLACE FUNCTION validate_progress_status(
    progress INTEGER,
    status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- 완료 상태인데 진행률이 100%가 아닌 경우
    IF status IN ('completed', 'done') AND progress < 100 THEN
        RETURN false;
    END IF;
    
    -- 시작되지 않은 상태인데 진행률이 0%가 아닌 경우
    IF status IN ('planning', 'todo') AND progress > 0 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- 팀 역할 계층 검증
CREATE OR REPLACE FUNCTION validate_team_role_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    owner_count INTEGER;
    current_role TEXT;
BEGIN
    -- INSERT/UPDATE 시 검증
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        current_role := NEW.role;
        
        -- 팀당 소유자는 최소 1명 이상 있어야 함
        SELECT COUNT(*) INTO owner_count
        FROM team_members
        WHERE team_id = NEW.team_id AND role = 'owner';
        
        -- 마지막 소유자를 다른 역할로 변경하려는 경우 방지
        IF TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner' AND owner_count <= 1 THEN
            RAISE EXCEPTION '팀에는 최소 한 명의 소유자가 있어야 합니다.';
        END IF;
    END IF;
    
    -- DELETE 시 검증
    IF TG_OP = 'DELETE' THEN
        -- 마지막 소유자 삭제 방지
        SELECT COUNT(*) INTO owner_count
        FROM team_members
        WHERE team_id = OLD.team_id AND role = 'owner' AND id != OLD.id;
        
        IF OLD.role = 'owner' AND owner_count = 0 THEN
            RAISE EXCEPTION '팀의 마지막 소유자는 삭제할 수 없습니다.';
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- 기존 테이블 제약조건 강화
-- =====================================================

-- users 테이블 제약조건 강화
ALTER TABLE public.users 
ADD CONSTRAINT IF NOT EXISTS email_format_check 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.users 
ADD CONSTRAINT IF NOT EXISTS avatar_url_format_check 
CHECK (avatar_url IS NULL OR avatar_url ~ '^https?://');

ALTER TABLE public.users 
ADD CONSTRAINT IF NOT EXISTS name_length_check 
CHECK (length(trim(name)) >= 1);

-- teams 테이블 제약조건 강화
ALTER TABLE public.teams 
ADD CONSTRAINT IF NOT EXISTS team_name_not_empty 
CHECK (length(trim(name)) >= 2);

ALTER TABLE public.teams 
ADD CONSTRAINT IF NOT EXISTS description_length_limit 
CHECK (length(description) <= 1000);

-- goals 테이블 제약조건 강화
ALTER TABLE public.goals 
ADD CONSTRAINT IF NOT EXISTS goal_title_not_empty 
CHECK (length(trim(title)) >= 3);

ALTER TABLE public.goals 
ADD CONSTRAINT IF NOT EXISTS goal_date_consistency 
CHECK (validate_date_range(start_date, end_date));

ALTER TABLE public.goals 
ADD CONSTRAINT IF NOT EXISTS goal_progress_status_consistency 
CHECK (validate_progress_status(progress, status));

-- projects 테이블 제약조건 강화
ALTER TABLE public.projects 
ADD CONSTRAINT IF NOT EXISTS project_title_not_empty 
CHECK (length(trim(title)) >= 3);

ALTER TABLE public.projects 
ADD CONSTRAINT IF NOT EXISTS project_date_consistency 
CHECK (validate_date_range(start_date, end_date));

ALTER TABLE public.projects 
ADD CONSTRAINT IF NOT EXISTS project_progress_status_consistency 
CHECK (validate_progress_status(progress, status));

-- tasks 테이블 제약조건 강화
ALTER TABLE public.tasks 
ADD CONSTRAINT IF NOT EXISTS task_title_not_empty 
CHECK (length(trim(title)) >= 2);

ALTER TABLE public.tasks 
ADD CONSTRAINT IF NOT EXISTS task_hours_positive 
CHECK (estimated_hours IS NULL OR estimated_hours > 0);

ALTER TABLE public.tasks 
ADD CONSTRAINT IF NOT EXISTS actual_hours_positive 
CHECK (actual_hours IS NULL OR actual_hours > 0);

ALTER TABLE public.tasks 
ADD CONSTRAINT IF NOT EXISTS task_position_non_negative 
CHECK (position >= 0);

-- comments 테이블 제약조건 강화
ALTER TABLE public.comments 
ADD CONSTRAINT IF NOT EXISTS comment_content_not_empty 
CHECK (length(trim(content)) >= 1);

ALTER TABLE public.comments 
ADD CONSTRAINT IF NOT EXISTS comment_content_length_limit 
CHECK (length(content) <= 10000);

-- attachments 테이블 제약조건 강화
ALTER TABLE public.attachments 
ADD CONSTRAINT IF NOT EXISTS file_name_not_empty 
CHECK (length(trim(file_name)) >= 1);

ALTER TABLE public.attachments 
ADD CONSTRAINT IF NOT EXISTS file_size_positive 
CHECK (file_size > 0);

ALTER TABLE public.attachments 
ADD CONSTRAINT IF NOT EXISTS file_size_limit 
CHECK (file_size <= 104857600); -- 100MB 제한

ALTER TABLE public.attachments 
ADD CONSTRAINT IF NOT EXISTS mime_type_valid 
CHECK (mime_type ~ '^[a-z]+/[a-z0-9\.\-\+]+$');

-- =====================================================
-- 보안 테이블 제약조건 강화
-- =====================================================

-- auth_attempts 테이블 제약조건
ALTER TABLE public.auth_attempts 
ADD CONSTRAINT IF NOT EXISTS auth_email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- user_sessions 테이블 제약조건
ALTER TABLE public.user_sessions 
ADD CONSTRAINT IF NOT EXISTS session_expires_after_created 
CHECK (expires_at > created_at);

ALTER TABLE public.user_sessions 
ADD CONSTRAINT IF NOT EXISTS token_hash_not_empty 
CHECK (length(token_hash) >= 32);

-- rate_limits 테이블 제약조건
ALTER TABLE public.rate_limits 
ADD CONSTRAINT IF NOT EXISTS window_end_after_start 
CHECK (window_end > window_start);

ALTER TABLE public.rate_limits 
ADD CONSTRAINT IF NOT EXISTS rate_count_positive 
CHECK (count > 0);

-- security_alerts 테이블 제약조건
ALTER TABLE public.security_alerts 
ADD CONSTRAINT IF NOT EXISTS alert_description_not_empty 
CHECK (length(trim(description)) >= 10);

-- =====================================================
-- 문서화 시스템 제약조건 강화
-- =====================================================

-- documentation_events 제약조건
ALTER TABLE public.documentation_events 
ADD CONSTRAINT IF NOT EXISTS doc_event_id_format 
CHECK (id ~ '^[a-zA-Z0-9_-]+$');

ALTER TABLE public.documentation_events 
ADD CONSTRAINT IF NOT EXISTS doc_event_retry_limit 
CHECK (retry_count >= 0 AND retry_count <= 10);

-- documentation_cache 제약조건
ALTER TABLE public.documentation_cache 
ADD CONSTRAINT IF NOT EXISTS doc_cache_content_not_empty 
CHECK (length(content) >= 10);

ALTER TABLE public.documentation_cache 
ADD CONSTRAINT IF NOT EXISTS doc_cache_version_format 
CHECK (version ~ '^v?\d+\.\d+(\.\d+)?(-[a-zA-Z0-9]+)?$');

-- documentation_quality_metrics 제약조건
ALTER TABLE public.documentation_quality_metrics 
ADD CONSTRAINT IF NOT EXISTS word_count_non_negative 
CHECK (word_count >= 0);

ALTER TABLE public.documentation_quality_metrics 
ADD CONSTRAINT IF NOT EXISTS code_examples_non_negative 
CHECK (code_examples_count >= 0);

ALTER TABLE public.documentation_quality_metrics 
ADD CONSTRAINT IF NOT EXISTS broken_links_non_negative 
CHECK (broken_links_count >= 0);

-- =====================================================
-- 비즈니스 룰 트리거들
-- =====================================================

-- 팀 역할 계층 검증 트리거
DROP TRIGGER IF EXISTS validate_team_role_hierarchy_trigger ON public.team_members;
CREATE TRIGGER validate_team_role_hierarchy_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION validate_team_role_hierarchy();

-- 중복 파일명 방지 (같은 태스크/프로젝트 내)
CREATE OR REPLACE FUNCTION prevent_duplicate_attachments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    -- 같은 태스크에 동일한 파일명 체크
    IF NEW.task_id IS NOT NULL THEN
        SELECT COUNT(*) INTO existing_count
        FROM attachments
        WHERE task_id = NEW.task_id 
        AND file_name = NEW.file_name
        AND id != COALESCE(NEW.id, gen_random_uuid());
        
        IF existing_count > 0 THEN
            RAISE EXCEPTION '같은 작업에 동일한 파일명이 이미 존재합니다: %', NEW.file_name;
        END IF;
    END IF;
    
    -- 같은 프로젝트에 동일한 파일명 체크
    IF NEW.project_id IS NOT NULL THEN
        SELECT COUNT(*) INTO existing_count
        FROM attachments
        WHERE project_id = NEW.project_id 
        AND file_name = NEW.file_name
        AND id != COALESCE(NEW.id, gen_random_uuid());
        
        IF existing_count > 0 THEN
            RAISE EXCEPTION '같은 프로젝트에 동일한 파일명이 이미 존재합니다: %', NEW.file_name;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_attachments_trigger ON public.attachments;
CREATE TRIGGER prevent_duplicate_attachments_trigger
    BEFORE INSERT OR UPDATE ON public.attachments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_attachments();

-- =====================================================
-- 데이터 정합성 검증 함수들
-- =====================================================

-- 전체 데이터 정합성 검증
CREATE OR REPLACE FUNCTION data_integrity.full_consistency_check()
RETURNS TABLE(
    check_name TEXT,
    table_name TEXT,
    inconsistency_count BIGINT,
    details TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 고아 레코드 체크
    RETURN QUERY
    SELECT 
        'ORPHANED_PROJECTS'::TEXT,
        'projects'::TEXT,
        COUNT(*)::BIGINT,
        'Projects without valid goals: ' || COUNT(*)::TEXT
    FROM projects p
    LEFT JOIN goals g ON p.goal_id = g.id
    WHERE g.id IS NULL;
    
    -- 날짜 일관성 체크
    RETURN QUERY
    SELECT 
        'INVALID_DATE_RANGES'::TEXT,
        'goals'::TEXT,
        COUNT(*)::BIGINT,
        'Goals with end_date before start_date: ' || COUNT(*)::TEXT
    FROM goals
    WHERE start_date IS NOT NULL 
    AND end_date IS NOT NULL 
    AND end_date < start_date;
    
    -- 진행률 일관성 체크
    RETURN QUERY
    SELECT 
        'PROGRESS_STATUS_MISMATCH'::TEXT,
        'projects'::TEXT,
        COUNT(*)::BIGINT,
        'Projects with inconsistent progress/status: ' || COUNT(*)::TEXT
    FROM projects
    WHERE NOT validate_progress_status(progress, status);
    
END;
$$;

-- 정기적 데이터 검증 함수
CREATE OR REPLACE FUNCTION data_integrity.daily_consistency_check()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    check_result RECORD;
    total_issues INTEGER := 0;
    report TEXT := '';
BEGIN
    report := 'Daily Data Integrity Check - ' || CURRENT_TIMESTAMP || E'\n' ||
              '=========================================' || E'\n\n';
    
    FOR check_result IN 
        SELECT * FROM data_integrity.full_consistency_check()
    LOOP
        total_issues := total_issues + check_result.inconsistency_count::INTEGER;
        report := report || check_result.check_name || ': ' || 
                  check_result.inconsistency_count || ' issues' || E'\n';
        
        IF check_result.inconsistency_count > 0 THEN
            report := report || '  Details: ' || check_result.details || E'\n';
        END IF;
    END LOOP;
    
    report := report || E'\nTotal Issues Found: ' || total_issues || E'\n';
    
    IF total_issues = 0 THEN
        report := report || 'Status: ✅ All checks passed!' || E'\n';
    ELSE
        report := report || 'Status: ⚠️  Issues detected - review required' || E'\n';
    END IF;
    
    RETURN report;
END;
$$;

-- =====================================================
-- 권한 및 보안 설정
-- =====================================================

-- 스키마 생성 및 권한 설정
CREATE SCHEMA IF NOT EXISTS data_integrity;
GRANT USAGE ON SCHEMA data_integrity TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA data_integrity TO authenticated;

-- 데이터 정합성 검증 함수 권한은 제한적으로 부여
REVOKE ALL ON FUNCTION data_integrity.full_consistency_check() FROM PUBLIC;
REVOKE ALL ON FUNCTION data_integrity.daily_consistency_check() FROM PUBLIC;

-- 완료 메시지
COMMENT ON SCHEMA data_integrity IS 'Data integrity validation and consistency check functions';