-- =====================================================
-- T-003: Performance Optimization Indexes
-- PM System 2025 - Query Performance & RLS Optimization
-- Based on RLS policy analysis and query patterns
-- =====================================================

-- =====================================================
-- RLS 정책 최적화 인덱스
-- =====================================================

-- team_members 테이블 - RLS 정책에서 가장 자주 사용됨
-- 기존: idx_team_members_team_id, idx_team_members_user_id
-- 추가: 복합 인덱스와 역할별 인덱스

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_user_team_role 
ON public.team_members (user_id, team_id, role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_team_role 
ON public.team_members (team_id, role) 
WHERE role IN ('owner', 'admin');

-- users 테이블 - 프로필 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_verified 
ON public.users (email) 
WHERE is_email_verified = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_sessions 
ON public.users (id, last_login_at) 
WHERE NOT is_locked;

-- =====================================================
-- 계층적 쿼리 최적화 인덱스
-- =====================================================

-- goals 테이블 - 팀별 목표 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_team_status_progress 
ON public.goals (team_id, status, progress DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_team_dates 
ON public.goals (team_id, start_date, end_date) 
WHERE start_date IS NOT NULL;

-- projects 테이블 - 목표별 프로젝트와 담당자별 조회
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_goal_status_priority 
ON public.projects (goal_id, status, priority DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_assigned_status 
ON public.projects (assigned_to, status) 
WHERE assigned_to IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_team_lookup 
ON public.projects (goal_id, assigned_to, status);

-- tasks 테이블 - 프로젝트별 작업과 담당자별 조회
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_status_position 
ON public.tasks (project_id, status, position);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned_due_date 
ON public.tasks (assigned_to, due_date) 
WHERE assigned_to IS NOT NULL AND due_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_assigned_status 
ON public.tasks (project_id, assigned_to, status);

-- =====================================================
-- 시간 기반 조회 최적화
-- =====================================================

-- 최근 활동 조회를 위한 인덱스들
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_team_recent 
ON public.activity_logs (team_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_recent 
ON public.activity_logs (user_id, created_at DESC) 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_task_recent 
ON public.comments (task_id, created_at DESC);

-- 만료된 데이터 정리를 위한 인덱스들
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_cleanup 
ON public.user_sessions (expires_at) 
WHERE expires_at < NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_attempts_cleanup 
ON public.auth_attempts (created_at) 
WHERE created_at < CURRENT_DATE - INTERVAL '30 days';

-- =====================================================
-- 검색 및 필터링 최적화
-- =====================================================

-- 텍스트 검색을 위한 GIN 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_text_search 
ON public.goals USING gin(to_tsvector('korean', title || ' ' || COALESCE(description, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_text_search 
ON public.projects USING gin(to_tsvector('korean', title || ' ' || COALESCE(description, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_text_search 
ON public.tasks USING gin(to_tsvector('korean', title || ' ' || COALESCE(description, '')));

-- 메타데이터 검색을 위한 GIN 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_metadata_search 
ON public.activity_logs USING gin(metadata);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_metadata_search 
ON public.audit_logs USING gin(metadata);

-- =====================================================
-- 보안 및 감사 최적화
-- =====================================================

-- 보안 이벤트 추적용 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_attempts_ip_time 
ON public.auth_attempts (ip_address, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_attempts_email_fail 
ON public.auth_attempts (email, created_at DESC) 
WHERE success = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_alerts_unacknowledged 
ON public.security_alerts (user_id, severity, created_at DESC) 
WHERE NOT acknowledged;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_locks_active 
ON public.account_locks (email, locked_until) 
WHERE locked_until > NOW();

-- 감사 로그 효율적 조회
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_ip_action 
ON public.audit_logs (ip_address, action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_timeline 
ON public.audit_logs (entity_type, entity_id, created_at DESC);

-- =====================================================
-- 문서화 시스템 최적화
-- =====================================================

-- 문서 캐시 효율성 향상
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doc_cache_team_type_version 
ON public.documentation_cache (team_id, document_type, version DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doc_cache_active 
ON public.documentation_cache (team_id, document_type, last_updated DESC) 
WHERE expires_at IS NULL OR expires_at > NOW();

-- 문서 품질 메트릭 분석용
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doc_quality_team_scores 
ON public.documentation_quality_metrics (team_id, measurement_month, completeness_score, accuracy_score);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doc_quality_trend_analysis 
ON public.documentation_quality_metrics (team_id, document_type, measurement_month DESC);

-- 문서 생성 작업 큐 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doc_jobs_queue_priority 
ON public.documentation_generation_jobs (status, priority DESC, created_at) 
WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doc_jobs_retry_queue 
ON public.documentation_generation_jobs (retry_after, retry_count) 
WHERE status = 'failed' AND retry_count < max_retries AND retry_after <= NOW();

-- =====================================================
-- 통계 및 집계 최적화
-- =====================================================

-- 팀별 통계 집계용 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_statistics 
ON public.team_members (team_id) 
INCLUDE (user_id, role, joined_at);

-- 진행률 집계용 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_aggregation_goals 
ON public.goals (team_id, status) 
INCLUDE (progress);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_aggregation_projects 
ON public.projects (goal_id, status) 
INCLUDE (progress);

-- 시간 추적 집계용 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_tracking 
ON public.tasks (assigned_to, created_at) 
INCLUDE (estimated_hours, actual_hours) 
WHERE assigned_to IS NOT NULL;

-- =====================================================
-- 부분 인덱스 (조건부 인덱스)
-- =====================================================

-- 활성 상태 데이터만 인덱싱
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_goals 
ON public.goals (team_id, created_at DESC) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_projects 
ON public.projects (goal_id, created_at DESC) 
WHERE status IN ('planning', 'in_progress', 'review');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_tasks 
ON public.tasks (project_id, assigned_to, due_date) 
WHERE status IN ('todo', 'in_progress') AND assigned_to IS NOT NULL;

-- 첨부파일 크기별 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_large_attachments 
ON public.attachments (uploaded_by, created_at DESC) 
WHERE file_size > 10485760; -- 10MB 이상

-- =====================================================
-- 복합 비즈니스 로직 인덱스
-- =====================================================

-- 마감일이 임박한 작업들
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_due_soon 
ON public.tasks (assigned_to, due_date, status) 
WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' 
AND status IN ('todo', 'in_progress');

-- 지연된 작업들
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_overdue 
ON public.tasks (project_id, assigned_to, due_date) 
WHERE due_date < CURRENT_DATE AND status IN ('todo', 'in_progress');

-- 비활성 사용자 세션
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inactive_sessions 
ON public.user_sessions (user_id, last_activity) 
WHERE last_activity < NOW() - INTERVAL '30 days';

-- =====================================================
-- 인덱스 사용량 모니터링 함수
-- =====================================================

-- 인덱스 효율성 분석 함수
CREATE OR REPLACE FUNCTION performance.analyze_index_usage()
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT,
    efficiency_ratio NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        tablename::TEXT,
        indexrelname::TEXT,
        pg_size_pretty(pg_relation_size(i.indexrelid))::TEXT,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        CASE 
            WHEN idx_scan = 0 THEN 0
            ELSE ROUND(idx_tup_fetch::NUMERIC / idx_scan::NUMERIC, 2)
        END as efficiency_ratio
    FROM pg_stat_user_indexes i
    JOIN pg_index idx ON i.indexrelid = idx.indexrelid
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC, efficiency_ratio DESC;
END;
$$;

-- 미사용 인덱스 탐지 함수
CREATE OR REPLACE FUNCTION performance.find_unused_indexes()
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    last_scan TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        tablename::TEXT,
        indexrelname::TEXT,
        pg_size_pretty(pg_relation_size(i.indexrelid))::TEXT,
        stats_reset::TIMESTAMP
    FROM pg_stat_user_indexes i
    WHERE schemaname = 'public'
    AND idx_scan = 0
    AND NOT idx.indisunique  -- 유니크 제약조건은 제외
    ORDER BY pg_relation_size(i.indexrelid) DESC;
END;
$$;

-- 느린 쿼리 분석 함수 (pg_stat_statements 확장 필요)
CREATE OR REPLACE FUNCTION performance.analyze_slow_queries(
    min_calls INTEGER DEFAULT 100,
    min_avg_time_ms NUMERIC DEFAULT 100
)
RETURNS TABLE(
    query_text TEXT,
    calls BIGINT,
    total_time_ms NUMERIC,
    avg_time_ms NUMERIC,
    rows_affected BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- pg_stat_statements가 활성화된 경우에만 작동
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        RAISE NOTICE 'pg_stat_statements extension is not installed';
        RETURN;
    END IF;
    
    RETURN QUERY
    EXECUTE '
        SELECT 
            query::TEXT,
            calls::BIGINT,
            ROUND(total_exec_time::NUMERIC, 2) as total_time_ms,
            ROUND(mean_exec_time::NUMERIC, 2) as avg_time_ms,
            rows::BIGINT
        FROM pg_stat_statements
        WHERE calls >= $1 
        AND mean_exec_time >= $2
        ORDER BY mean_exec_time DESC
        LIMIT 20'
    USING min_calls, min_avg_time_ms;
END;
$$;

-- =====================================================
-- 권한 및 보안 설정
-- =====================================================

-- performance 스키마 생성
CREATE SCHEMA IF NOT EXISTS performance;
GRANT USAGE ON SCHEMA performance TO authenticated;

-- 성능 분석 함수들은 관리자만 실행 가능
REVOKE ALL ON FUNCTION performance.analyze_index_usage() FROM PUBLIC;
REVOKE ALL ON FUNCTION performance.find_unused_indexes() FROM PUBLIC;
REVOKE ALL ON FUNCTION performance.analyze_slow_queries(INTEGER, NUMERIC) FROM PUBLIC;

-- 인덱스 생성 완료 로그
COMMENT ON SCHEMA performance IS 'Performance monitoring and analysis functions for PM System 2025';

-- 통계 업데이트 (새로 생성된 인덱스들의 통계 수집)
ANALYZE public.team_members, public.goals, public.projects, public.tasks, 
        public.comments, public.attachments, public.activity_logs,
        public.auth_attempts, public.user_sessions, public.audit_logs;