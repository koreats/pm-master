-- =====================================================
-- 📋 문서 자동화 시스템 데이터베이스 스키마
-- PM System 2025 - 실시간 문서 추적 및 동기화
-- =====================================================

-- 문서화 이벤트 테이블
CREATE TABLE IF NOT EXISTS documentation_events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN (
        'progress_update',
        'milestone_reached', 
        'task_completed',
        'blocker_added',
        'quality_alert'
    )),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL CHECK (source IN (
        'git',
        'supabase', 
        'manual',
        'ci',
        'quality_gate',
        'sync_manager',
        'file_watcher',
        'database'
    )),
    processed_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    
    -- 인덱스를 위한 컬럼들
    event_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE
);

-- 문서 캐시 테이블  
CREATE TABLE IF NOT EXISTS documentation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL CHECK (document_type IN (
        'progress',
        'api', 
        'component',
        'schema'
    )),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version TEXT NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    file_hash TEXT, -- 콘텐츠 변경 감지용
    expires_at TIMESTAMPTZ, -- 캐시 만료
    
    -- 복합 유니크 제약조건 (팀별, 문서타입별 최신 버전)
    UNIQUE(team_id, document_type, version)
);

-- 문서 품질 메트릭 테이블
CREATE TABLE IF NOT EXISTS documentation_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_path TEXT,
    
    -- 품질 지표
    completeness_score DECIMAL(3,2) CHECK (completeness_score >= 0 AND completeness_score <= 1),
    accuracy_score DECIMAL(3,2) CHECK (accuracy_score >= 0 AND accuracy_score <= 1), 
    freshness_score DECIMAL(3,2) CHECK (freshness_score >= 0 AND freshness_score <= 1),
    readability_score DECIMAL(3,2) CHECK (readability_score >= 0 AND readability_score <= 1),
    
    -- 기술적 지표
    word_count INTEGER DEFAULT 0,
    code_examples_count INTEGER DEFAULT 0,
    broken_links_count INTEGER DEFAULT 0,
    outdated_references_count INTEGER DEFAULT 0,
    
    -- 추적 정보
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    measurement_source TEXT NOT NULL,
    
    -- 월별 파티셔닝을 위한 컬럼
    measurement_month DATE GENERATED ALWAYS AS (DATE_TRUNC('month', measured_at)::DATE) STORED
);

-- 문서 생성 작업 테이블 (비동기 작업 추적)
CREATE TABLE IF NOT EXISTS documentation_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN (
        'progress_report',
        'api_documentation', 
        'component_documentation',
        'schema_documentation',
        'full_regeneration'
    )),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing', 
        'completed',
        'failed',
        'cancelled'
    )),
    
    -- 작업 설정
    config JSONB NOT NULL DEFAULT '{}',
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    -- 진행 상황
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_step TEXT,
    total_steps INTEGER DEFAULT 1,
    
    -- 결과
    result_content TEXT,
    result_metadata JSONB,
    error_message TEXT,
    error_details JSONB,
    
    -- 시간 추적
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- 성능 메트릭
    processing_time_ms INTEGER,
    memory_usage_mb DECIMAL(8,2),
    
    -- 재시도 로직
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    retry_after TIMESTAMPTZ
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- documentation_events 인덱스
CREATE INDEX IF NOT EXISTS idx_doc_events_type_date ON documentation_events(type, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_doc_events_source_created ON documentation_events(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_events_team_created ON documentation_events(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_events_unprocessed ON documentation_events(created_at) WHERE processed_at IS NULL;

-- documentation_cache 인덱스  
CREATE INDEX IF NOT EXISTS idx_doc_cache_team_type ON documentation_cache(team_id, document_type);
CREATE INDEX IF NOT EXISTS idx_doc_cache_updated ON documentation_cache(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_doc_cache_expires ON documentation_cache(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_doc_cache_hash ON documentation_cache(file_hash) WHERE file_hash IS NOT NULL;

-- documentation_quality_metrics 인덱스
CREATE INDEX IF NOT EXISTS idx_doc_quality_team_type ON documentation_quality_metrics(team_id, document_type);
CREATE INDEX IF NOT EXISTS idx_doc_quality_measured ON documentation_quality_metrics(measurement_month DESC);
CREATE INDEX IF NOT EXISTS idx_doc_quality_file ON documentation_quality_metrics(file_path);

-- documentation_generation_jobs 인덱스
CREATE INDEX IF NOT EXISTS idx_doc_jobs_status_priority ON documentation_generation_jobs(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_doc_jobs_team_type ON documentation_generation_jobs(team_id, job_type);
CREATE INDEX IF NOT EXISTS idx_doc_jobs_retry ON documentation_generation_jobs(retry_after) WHERE status = 'failed' AND retry_count < max_retries;
CREATE INDEX IF NOT EXISTS idx_doc_jobs_created ON documentation_generation_jobs(created_at DESC);

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- documentation_events RLS
ALTER TABLE documentation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "팀 멤버는 자신의 팀 문서 이벤트 조회 가능"
    ON documentation_events FOR SELECT
    USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "팀 멤버는 자신의 팀 문서 이벤트 생성 가능" 
    ON documentation_events FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
        )
    );

-- documentation_cache RLS
ALTER TABLE documentation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "팀 멤버는 자신의 팀 문서 캐시 조회 가능"
    ON documentation_cache FOR SELECT  
    USING (
        team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "팀 관리자는 자신의 팀 문서 캐시 관리 가능"
    ON documentation_cache FOR ALL
    USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- documentation_quality_metrics RLS  
ALTER TABLE documentation_quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "팀 멤버는 자신의 팀 품질 메트릭 조회 가능"
    ON documentation_quality_metrics FOR SELECT
    USING (
        team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "시스템은 품질 메트릭 생성/수정 가능"
    ON documentation_quality_metrics FOR ALL
    USING (true); -- 시스템 계정으로 실행되는 자동화 작업용

-- documentation_generation_jobs RLS
ALTER TABLE documentation_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "팀 멤버는 자신의 팀 문서 생성 작업 조회 가능"
    ON documentation_generation_jobs FOR SELECT
    USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "팀 멤버는 자신의 팀 문서 생성 작업 생성 가능"
    ON documentation_generation_jobs FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 함수 및 트리거
-- =====================================================

-- 문서 캐시 정리 함수 (오래된 버전 자동 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_documentation_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- 각 팀/문서타입별로 최신 5개 버전만 유지
    DELETE FROM documentation_cache 
    WHERE id IN (
        SELECT id
        FROM (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY team_id, document_type 
                       ORDER BY last_updated DESC
                   ) as rn
            FROM documentation_cache
        ) ranked
        WHERE rn > 5
    );
    
    -- 만료된 캐시 삭제
    DELETE FROM documentation_cache 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$;

-- 품질 메트릭 집계 함수
CREATE OR REPLACE FUNCTION calculate_team_documentation_score(target_team_id UUID)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql  
AS $$
DECLARE
    overall_score DECIMAL(3,2);
BEGIN
    SELECT 
        COALESCE(
            AVG(
                (COALESCE(completeness_score, 0.5) * 0.3) +
                (COALESCE(accuracy_score, 0.5) * 0.3) +
                (COALESCE(freshness_score, 0.5) * 0.2) +
                (COALESCE(readability_score, 0.5) * 0.2)
            ), 
            0.5
        )
    INTO overall_score
    FROM documentation_quality_metrics
    WHERE team_id = target_team_id
    AND measured_at >= NOW() - INTERVAL '30 days';
    
    RETURN LEAST(1.0, GREATEST(0.0, overall_score));
END;
$$;

-- 문서 이벤트 트리거 함수 
CREATE OR REPLACE FUNCTION process_documentation_event_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 중요한 이벤트는 즉시 처리 마킹
    IF NEW.type IN ('milestone_reached', 'blocker_added', 'quality_alert') THEN
        NEW.processed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

-- 문서 이벤트 트리거 생성
DROP TRIGGER IF EXISTS tr_documentation_event_process ON documentation_events;
CREATE TRIGGER tr_documentation_event_process
    BEFORE INSERT ON documentation_events
    FOR EACH ROW
    EXECUTE FUNCTION process_documentation_event_trigger();

-- =====================================================
-- 실시간 구독 설정  
-- =====================================================

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE documentation_events;
ALTER PUBLICATION supabase_realtime ADD TABLE documentation_cache;
ALTER PUBLICATION supabase_realtime ADD TABLE documentation_generation_jobs;

-- =====================================================
-- 초기 데이터 및 설정
-- =====================================================

-- 시스템 설정 테이블 (문서 자동화 설정)
CREATE TABLE IF NOT EXISTS documentation_settings (
    team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
    
    -- 자동화 설정
    auto_generation_enabled BOOLEAN DEFAULT true,
    sync_interval_minutes INTEGER DEFAULT 30 CHECK (sync_interval_minutes >= 5),
    max_cache_versions INTEGER DEFAULT 5 CHECK (max_cache_versions >= 1),
    
    -- 품질 임계값
    min_completeness_score DECIMAL(3,2) DEFAULT 0.7,
    min_accuracy_score DECIMAL(3,2) DEFAULT 0.8,
    min_freshness_days INTEGER DEFAULT 7,
    
    -- 알림 설정
    milestone_notifications BOOLEAN DEFAULT true,
    quality_alert_notifications BOOLEAN DEFAULT true, 
    daily_summary_enabled BOOLEAN DEFAULT false,
    
    -- 템플릿 설정
    progress_template TEXT DEFAULT 'standard',
    language_preference TEXT DEFAULT 'ko',
    timezone TEXT DEFAULT 'Asia/Seoul',
    
    -- 메타데이터
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- documentation_settings RLS
ALTER TABLE documentation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "팀 관리자는 문서 설정 관리 가능"
    ON documentation_settings FOR ALL
    USING (
        team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- 자동 정리 작업을 위한 cron 함수 등록 (Supabase Edge Functions에서 호출)
COMMENT ON FUNCTION cleanup_old_documentation_cache() IS 
'문서 캐시 정리 함수 - 매일 자정 실행 권장';

-- =====================================================
-- 완료 로그
-- =====================================================

INSERT INTO activity_logs (team_id, user_id, entity_type, entity_id, action, created_at)
SELECT 
    teams.id,
    auth.uid(),
    'system',
    'documentation_system',
    '문서 자동화 시스템 데이터베이스 스키마 생성 완료',
    NOW()
FROM teams 
JOIN team_members ON teams.id = team_members.team_id
WHERE team_members.user_id = auth.uid()
AND team_members.role = 'owner'
LIMIT 1;