# 📐 기술 요구사항 문서 (TRD)

## PM System 2025 Web Application

---

## 1. 시스템 아키텍처

### 1.1 전체 아키텍처 다이어그램

```typescript
interface SystemArchitecture {
  frontend: {
    framework: 'Next.js 15.1.0 (App Router)'
    runtime: 'Edge Runtime + Node.js'
    rendering: 'SSR + SSG + ISR + CSR 하이브리드'
    cdn: 'Vercel Edge Network'
  }

  backend: {
    database: 'Supabase (PostgreSQL 15)'
    auth: 'Supabase Auth'
    realtime: 'Supabase Realtime (WebSocket)'
    storage: 'Supabase Storage (S3 compatible)'
    serverless: 'Vercel Functions + Edge Functions'
  }

  infrastructure: {
    hosting: 'Vercel'
    monitoring: 'Vercel Analytics + Sentry'
    ci_cd: 'GitHub Actions + Vercel Deploy'
    testing: 'Jest + Playwright + Cypress'
  }
}
```

### 1.2 레이어드 아키텍처

```typescript
// 클린 아키텍처 패턴 적용
interface LayeredArchitecture {
  presentation: {
    components: 'React Components (UI)'
    pages: 'Next.js Pages/App'
    layouts: 'Shared Layouts'
  }

  application: {
    hooks: 'Custom React Hooks'
    services: 'Business Logic Services'
    stores: 'Zustand State Stores'
  }

  domain: {
    entities: 'Domain Models'
    valueObjects: 'Value Objects'
    repositories: 'Repository Interfaces'
  }

  infrastructure: {
    api: 'Supabase Client'
    storage: 'File Storage'
    cache: 'React Query Cache'
  }
}
```

---

## 2. 기술 스택 상세 명세

### 2.1 프론트엔드 기술 스택

```typescript
interface FrontendStack {
  // 코어 프레임워크
  core: {
    next: '15.1.0'
    react: '18.3.1'
    typescript: '5.x'
  }

  // UI/UX 라이브러리
  ui: {
    styling: {
      tailwind: '3.4.1'
      tailwindAnimate: '1.0.7'
      clsx: '2.1.1'
      cva: '0.7.0'
    }
    components: {
      radixUi: {
        accordion: '1.2.3'
        dialog: '1.1.15'
        dropdown: '2.1.1'
        select: '2.1.4'
        tabs: '1.1.13'
        toast: '1.2.6'
      }
      custom: 'shadcn/ui components'
    }
    animation: {
      framerMotion: '11.x'
      transitions: 'Custom spring configs'
    }
    icons: {
      lucideReact: '0.469.0'
    }
  }

  // 상태 관리
  state: {
    server: {
      tanstack: '5.x'
      swr: 'fallback option'
    }
    client: {
      zustand: '4.x'
      context: 'React Context (theme, auth)'
    }
    forms: {
      reactHookForm: '7.x'
      zod: '3.x validation'
    }
  }

  // 유틸리티
  utilities: {
    dates: 'date-fns 4.1.0'
    dragDrop: '@dnd-kit/core 6.3.1'
    charts: 'recharts 2.12.7'
    patterns: 'ts-pattern 5.x'
    utils: 'es-toolkit 1.x'
    pdfGeneration: 'jspdf 2.5.1'
  }
}
```

### 2.2 백엔드 기술 스택

```typescript
interface BackendStack {
  // Supabase 구성
  supabase: {
    version: '2.56.0'
    auth: {
      providers: ['google', 'github', 'email']
      mfa: 'TOTP(필요시 활성화)'
      rbac: 'Custom policies (RLS 연동)'
    }
    database: {
      postgres: '15.x'
      extensions: [
        'pgvector', // AI 임베딩
        'pg_cron', // 스케줄링
        'uuid-ossp', // UUID 생성
        'pg_trgm', // 텍스트 검색
      ]
    }
    realtime: {
      channels: 'presence + broadcast + postgres changes'
      maxConnections: 100
      conflictResolution: {
        strategy: 'last-write-wins'
        implementation: {
          vectorClock: false // 소규모 팀은 단순한 타임스탬프 기반
          conflictDetection: 'automatic'
          mergeStrategy: 'timestamp-based'
          conflictNotification: 'toast + activity_log'
        }
      }
    }
    storage: {
      buckets: ['avatars', 'attachments', 'exports']
      maxFileSize: '100MB' // PRD와 통일
      allowedMimeTypes: ['image/*', 'application/pdf', 'text/csv']
    }
  }

  // API 레이어
  api: {
    type: 'RESTful + GraphQL (future)'
    authentication: 'JWT Bearer Token'
    rateLimit: '100 req/min per user'
    versioning: 'v1, v2'
    documentation: 'OpenAPI 3.0'
  }

  // 서버리스 함수
  serverless: {
    runtime: 'Node.js 20.x'
    maxDuration: '10s (Pro: 60s)'
    memory: '1024MB'
    regions: ['iad1', 'sin1']
  }
}
```

---

## 3. 데이터베이스 설계

### 3.1 스키마 정의

```sql
-- 워크스페이스 스키마
CREATE SCHEMA workspace;
CREATE SCHEMA project;
CREATE SCHEMA collaboration;
CREATE SCHEMA analytics;

-- RLS 활성화
ALTER TABLE ALL TABLES IN SCHEMA workspace ENABLE ROW LEVEL SECURITY;
```

### 3.2 핵심 테이블 구조

```sql
-- Users 테이블은 Supabase Auth에 의해 자동으로 생성 및 관리되는 auth.users 스키마를 사용함

-- 사용자 프로필 확장
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Seoul',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 워크스페이스
CREATE TABLE workspace.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free',
  member_limit INT DEFAULT 5,
  storage_limit BIGINT DEFAULT 5368709120, -- 5GB
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 워크스페이스 멤버
CREATE TABLE workspace.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspace.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'member')),  -- 단순화: Owner와 Member만
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- 목표 (Level 1)
CREATE TABLE project.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspace.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  color_tag TEXT CHECK (color_tag IN ('mint', 'peach', 'sky', 'lavender', 'coral', 'sage')),
  target_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'archived')),
  metrics JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 (Level 2)
CREATE TABLE project.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES project.goals(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspace.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  start_date DATE,
  end_date DATE,
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  tags TEXT[],
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 담당자
CREATE TABLE project.project_assignees (
  project_id UUID REFERENCES project.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- 프로젝트 의존성
CREATE TABLE project.project_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES project.projects(id) ON DELETE CASCADE,
  depends_on UUID REFERENCES project.projects(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start',
  lag_days INT DEFAULT 0,
  UNIQUE(project_id, depends_on)
);

-- 작업 (Level 3)
CREATE TABLE project.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES project.projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES project.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  estimated_hours DECIMAL(5, 2),
  actual_hours DECIMAL(5, 2),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assignee_id UUID REFERENCES auth.users(id),
  labels TEXT[],
  position INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 작업 체크리스트
CREATE TABLE project.task_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES project.tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT FALSE,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 댓글
CREATE TABLE collaboration.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('goal', 'project', 'task')),
  entity_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES collaboration.comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  mentions UUID[],
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 활동 로그
CREATE TABLE collaboration.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspace.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  entity_type TEXT,
  entity_id UUID,
  action TEXT NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 첨부파일
CREATE TABLE collaboration.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('project', 'task', 'comment')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 템플릿 시스템
CREATE TABLE workspace.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspace.workspaces(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('project', 'task', 'workflow')),
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace.template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0
);

-- 자동화 규칙 (소규모 팀용 단순화)
CREATE TABLE workspace.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspace.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT CHECK (trigger_type IN ('time_based', 'event_based', 'manual')),
  trigger_config JSONB NOT NULL,
  action_type TEXT CHECK (action_type IN ('create_task', 'update_status', 'send_notification')),
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES workspace.automation_rules(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  execution_time INT, -- milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 시스템
CREATE TABLE workspace.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('mention', 'assignment', 'due_date', 'comment', 'status_change')),
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('in_app', 'email', 'push')),
  type TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, channel, type)
);

-- 뷰 설정
CREATE TABLE workspace.saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspace.workspaces(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('goals', 'projects', 'tasks')),
  name TEXT NOT NULL,
  view_type TEXT CHECK (view_type IN ('table', 'kanban', 'calendar', 'timeline', 'gallery', 'list')),
  filters JSONB DEFAULT '{}',
  sorting JSONB DEFAULT '{}',
  grouping JSONB DEFAULT '{}',
  columns_config JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 인덱스 전략

```sql
-- 성능 최적화 인덱스 (소규모 팀 최적화)
CREATE INDEX idx_projects_workspace_status ON project.projects(workspace_id, status);
CREATE INDEX idx_projects_goal_id ON project.projects(goal_id);
CREATE INDEX idx_tasks_project_id ON project.tasks(project_id);
CREATE INDEX idx_tasks_assignee_due ON project.tasks(assignee_id, due_date);
CREATE INDEX idx_tasks_completed ON project.tasks(is_completed, updated_at);
CREATE INDEX idx_comments_entity ON collaboration.comments(entity_type, entity_id);
CREATE INDEX idx_activities_workspace_created ON collaboration.activities(workspace_id, created_at DESC);

-- 템플릿 & 알림 인덱스
CREATE INDEX idx_templates_workspace_category ON workspace.templates(workspace_id, category);
CREATE INDEX idx_notifications_user_unread ON workspace.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_automation_rules_workspace ON workspace.automation_rules(workspace_id, is_active);

-- 텍스트 검색 인덱스
CREATE INDEX idx_projects_search ON project.projects USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_tasks_search ON project.tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### 3.4 Row Level Security (RLS) 정책

```sql
-- 워크스페이스 접근 정책
CREATE POLICY workspace_access ON workspace.workspaces
  FOR ALL
  USING (
    id IN (
      SELECT workspace_id
      FROM workspace.members
      WHERE user_id = auth.uid()
    )
  );

-- 프로젝트 접근 정책
CREATE POLICY project_access ON project.projects
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace.members
      WHERE user_id = auth.uid()
    )
  );

-- 작업 접근 정책
CREATE POLICY task_access ON project.tasks
  FOR ALL
  USING (
    project_id IN (
      SELECT id
      FROM project.projects
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace.members
        WHERE user_id = auth.uid()
      )
    )
  );
```

---

## 4. API 설계

### 4.1 RESTful API 엔드포인트

```typescript
// API 라우트 구조
interface APIRoutes {
  // 인증
  auth: {
    // 인증 관련 모든 기능은 Supabase 클라이언트 SDK를 통해 직접 처리하므로, 별도의 REST API 엔드포인트를 사용하지 않음.
  }

  // 워크스페이스
  workspace: {
    'GET /api/workspaces': '워크스페이스 목록'
    'POST /api/workspaces': '워크스페이스 생성'
    'GET /api/workspaces/:id': '워크스페이스 상세'
    'PUT /api/workspaces/:id': '워크스페이스 수정'
    'DELETE /api/workspaces/:id': '워크스페이스 삭제'
    'POST /api/workspaces/:id/invite': '멤버 초대'
    'GET /api/workspaces/:id/members': '멤버 목록'
  }

  // 목표 (Goals)
  goals: {
    'GET /api/goals': '목표 목록'
    'POST /api/goals': '목표 생성'
    'GET /api/goals/:id': '목표 상세'
    'PUT /api/goals/:id': '목표 수정'
    'DELETE /api/goals/:id': '목표 삭제'
    'GET /api/goals/:id/metrics': '목표 메트릭'
  }

  // 프로젝트
  projects: {
    'GET /api/projects': '프로젝트 목록'
    'POST /api/projects': '프로젝트 생성'
    'GET /api/projects/:id': '프로젝트 상세'
    'PUT /api/projects/:id': '프로젝트 수정'
    'DELETE /api/projects/:id': '프로젝트 삭제'
    'POST /api/projects/:id/assignees': '담당자 할당'
    'GET /api/projects/:id/timeline': '타임라인 조회'
  }

  // 작업
  tasks: {
    'GET /api/tasks': '작업 목록'
    'POST /api/tasks': '작업 생성'
    'GET /api/tasks/:id': '작업 상세'
    'PUT /api/tasks/:id': '작업 수정'
    'DELETE /api/tasks/:id': '작업 삭제'
    'POST /api/tasks/:id/complete': '작업 완료'
    'POST /api/tasks/:id/checklist': '체크리스트 추가'
    'POST /api/tasks/bulk': '벌크 작업'
  }

  // 협업
  collaboration: {
    'GET /api/comments': '댓글 목록'
    'POST /api/comments': '댓글 작성'
    'PUT /api/comments/:id': '댓글 수정'
    'DELETE /api/comments/:id': '댓글 삭제'
    'GET /api/activities': '활동 로그'
    'POST /api/attachments': '파일 업로드'
  }

  // 자동화
  automation: {
    'GET /api/automations': '자동화 규칙 목록'
    'POST /api/automations': '자동화 생성'
    'PUT /api/automations/:id': '자동화 수정'
    'DELETE /api/automations/:id': '자동화 삭제'
    'POST /api/automations/:id/trigger': '수동 트리거'
  }

  // 분석
  analytics: {
    'GET /api/analytics/dashboard': '대시보드 데이터'
    'GET /api/analytics/reports': '리포트 생성'
    'GET /api/analytics/insights': 'AI 인사이트'
    'POST /api/analytics/export': '데이터 내보내기'
  }
}
```

### 4.2 Server Actions (Next.js 15)

```typescript
// app/actions/projects.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// 프로젝트 생성 스키마
const createProjectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  goalId: z.string().uuid(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

export async function createProject(formData: FormData) {
  const supabase = createClient()

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 유효성 검사
  const validatedData = createProjectSchema.parse({
    title: formData.get('title'),
    description: formData.get('description'),
    goalId: formData.get('goalId'),
    priority: formData.get('priority'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
  })

  // 데이터베이스 트랜잭션
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...validatedData,
      created_by: user.id,
      workspace_id: formData.get('workspaceId'),
    })
    .select()
    .single()

  if (error) throw error

  // 캐시 무효화
  revalidatePath('/projects')
  revalidatePath(`/goals/${validatedData.goalId}`)

  return { success: true, data }
}

export async function updateProjectProgress(projectId: string, progress: number) {
  const supabase = createClient()

  const { error } = await supabase.from('projects').update({ progress }).eq('id', projectId)

  if (error) throw error

  // 실시간 브로드캐스트 with 충돌 해결
  const timestamp = new Date().toISOString()
  await supabase.channel(`project:${projectId}`).send({
    type: 'broadcast',
    event: 'progress_update',
    payload: {
      progress,
      timestamp, // Last-Write-Wins 타임스탬프
      userId: user.id,
    },
  })

  revalidatePath(`/projects/${projectId}`)
}
```

### 4.3 실시간 구독

```typescript
// hooks/useRealtimeProject.ts
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeProject(projectId: string) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    // 데이터베이스 변경 구독
    const channel = supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'project',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        payload => {
          // 충돌 감지 및 해결 (Last-Write-Wins)
          const currentData = queryClient.getQueryData(['project', projectId])
          if (currentData?.updated_at && payload.new?.updated_at) {
            const isNewer = new Date(payload.new.updated_at) > new Date(currentData.updated_at)
            if (isNewer) {
              queryClient.setQueryData(['project', projectId], payload.new)
              // 충돌 알림 (선택적)
              if (payload.new.updated_by !== currentUserId) {
                toast.info('프로젝트가 다른 사용자에 의해 업데이트되었습니다.')
              }
            }
          } else {
            queryClient.invalidateQueries({
              queryKey: ['project', projectId],
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'project',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        payload => {
          // 작업 목록 업데이트
          queryClient.invalidateQueries({
            queryKey: ['tasks', projectId],
          })
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        // 현재 보고 있는 사용자 표시
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, queryClient, supabase])
}
```

---

## 5. 보안 요구사항

### 5.1 인증 및 인가

```typescript
interface SecurityRequirements {
  authentication: 'Supabase Auth를 통해 OAuth 2.0, Magic Link, 이메일/비밀번호, MFA(TOTP) 방식 제공'

  session: 'httpOnly 보안 쿠키에 저장되며 Supabase 클라이언트를 통해 자동으로 갱신 및 관리'

  authorization: 'PostgreSQL의 Row Level Security (RLS)를 통해 데이터베이스 레벨에서 직접 역할 및 속성 기반 접근 제어 구현'

  encryption: {
    atRest: 'AES-256-GCM'
    inTransit: 'TLS 1.3'
    keys: 'AWS KMS managed'
  }

  compliance: {
    standards: ['SOC 2', 'GDPR', 'ISO 27001']
    dataResidency: '선택 가능'
    auditLog: '90일 보관'
  }
}
```

### 5.2 보안 헤더

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
  },
]
```

---

## 6. 성능 요구사항

### 6.1 성능 목표

```typescript
interface PerformanceTargets {
  webVitals: {
    LCP: '< 2.0s' // Largest Contentful Paint (소규모 팀용 최적화)
    FID: '< 50ms' // First Input Delay (빠른 반응성)
    CLS: '< 0.05' // Cumulative Layout Shift (안정적 레이아웃)
    TTFB: '< 400ms' // Time to First Byte (빠른 초기 로딩)
    FCP: '< 1.5s' // First Contentful Paint (즉시 사용 가능)
  }

  api: {
    p50: '< 100ms'
    p95: '< 200ms'
    p99: '< 500ms'
    errorRate: '< 0.1%'
  }

  database: {
    queryTime: '< 30ms' // 소규모 데이터셋 최적화
    connectionPool: 10 // 5명 이하 팀용 축소
    cacheHitRate: '> 95%' // 적극적 캐싱
  }

  realtime: {
    latency: '< 50ms' // 소규모 팀 빠른 동기화
    throughput: '1,000 msg/s' // 5명 팀 충분
    connections: '50 concurrent' // 최대 5명 x 10 디바이스
  }
}
```

### 6.2 최적화 전략

```typescript
// 이미지 최적화
import Image from 'next/image';

// 코드 스플리팅
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
});

// 데이터 프리페칭
export async function generateStaticParams() {
  const projects = await getPopularProjects();
  return projects.map((project) => ({
    id: project.id,
  }));
}

// React Query 캐싱
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분
      cacheTime: 5 * 60 * 1000, // 5분
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 7. 인프라 요구사항

### 7.1 배포 아키텍처

```yaml
# vercel.json
{
  'framework': 'nextjs',
  'buildCommand': 'pnpm build',
  'devCommand': 'pnpm dev',
  'installCommand': 'pnpm install',
  'regions': ['iad1', 'sin1'],
  'functions': { 'app/api/**/*.ts': { 'maxDuration': 10 } },
  'crons': [{ 'path': '/api/cron/daily-report', 'schedule': '0 9 * * *' }],
}
```

### 7.2 모니터링 및 로깅

```typescript
// 에러 트래킹 (Sentry)
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
})

// 성능 모니터링
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// 커스텀 메트릭
export function trackEvent(name: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    window.analytics?.track(name, properties)
  }
}
```

---

## 8. 개발 표준

### 8.1 코드 컨벤션

```typescript
// 폴더 구조
interface ProjectStructure {
  'app/': 'Next.js App Router'
  'components/': {
    'ui/': '기본 UI 컴포넌트'
    'features/': '기능별 컴포넌트'
    'layouts/': '레이아웃 컴포넌트'
  }
  'lib/': {
    'supabase/': 'Supabase 클라이언트'
    'utils/': '유틸리티 함수'
    'hooks/': '커스텀 훅'
    'stores/': 'Zustand 스토어'
  }
  'types/': 'TypeScript 타입 정의'
  'styles/': '글로벌 스타일'
  'public/': '정적 파일'
}

// 네이밍 컨벤션
interface NamingConventions {
  components: 'PascalCase'
  files: 'kebab-case'
  functions: 'camelCase'
  constants: 'UPPER_SNAKE_CASE'
  types: 'PascalCase'
  interfaces: 'IPascalCase'
}
```

### 8.2 Git 워크플로우

```bash
# 브랜치 전략
main          # 프로덕션
├── develop   # 개발
├── feature/* # 기능 개발
├── fix/*     # 버그 수정
└── release/* # 릴리즈 준비

# 커밋 메시지 컨벤션
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 업무 수정
```

---

## 9. 테스팅 전략

### 9.1 테스트 레벨

```typescript
interface TestingStrategy {
  unit: {
    framework: 'Jest + React Testing Library'
    coverage: '> 80%'
    files: '*.test.ts, *.test.tsx'
  }

  integration: {
    framework: 'Jest + MSW'
    scope: 'API 통합, 컴포넌트 통합'
    mocking: 'Mock Service Worker'
  }

  e2e: {
    framework: 'Playwright'
    browsers: ['chromium', 'firefox', 'webkit']
    scenarios: 'Critical user journeys'
  }

  performance: {
    tools: ['Lighthouse CI', 'WebPageTest']
    budget: 'performance.budget.json'
  }
}
```

### 9.2 테스트 예제

```typescript
// 단위 테스트
describe('TaskCard', () => {
  it('should render task title', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
  });

  it('should handle completion toggle', async () => {
    const onComplete = jest.fn();
    render(<TaskCard task={mockTask} onComplete={onComplete} />);

    await userEvent.click(screen.getByRole('checkbox'));
    expect(onComplete).toHaveBeenCalledWith(mockTask.id);
  });
});

// E2E 테스트
test('create new project', async ({ page }) => {
  await page.goto('/projects');
  await page.click('text=New Project');
  await page.fill('[name=title]', 'Test Project');
  await page.selectOption('[name=priority]', 'high');
  await page.click('text=Create');

  await expect(page).toHaveURL(/\/projects\/.+/);
  await expect(page.locator('h1')).toContainText('Test Project');
});
```

---

## 10. 배포 전략

### 10.1 CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test:ci
      - name: Run type check
        run: pnpm type-check
      - name: Run lint
        run: pnpm lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 10.2 환경 변수

```typescript
// .env.local
// Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

// Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xxx

// External Services
SENTRY_DSN=xxx
VERCEL_ANALYTICS_ID=xxx

// Feature Flags
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## 11. 마이그레이션 전략

### 11.1 데이터베이스 마이그레이션

```sql
-- migrations/001_initial_schema.sql
BEGIN;

-- 스키마 생성
CREATE SCHEMA IF NOT EXISTS workspace;
CREATE SCHEMA IF NOT EXISTS project;

-- 테이블 생성
-- ...

COMMIT;

-- migrations/002_add_indexes.sql
BEGIN;

-- 인덱스 추가
CREATE INDEX CONCURRENTLY IF NOT EXISTS ...;

COMMIT;
```

### 11.2 버전 관리

```typescript
// 버전 호환성 관리
interface VersionCompatibility {
  minClientVersion: '1.0.0'
  currentApiVersion: 'v1'
  deprecatedEndpoints: [
    {
      endpoint: '/api/v0/*'
      deprecatedAt: '2025-02-01'
      removalDate: '2025-05-01'
    },
  ]
  breakingChanges: [
    {
      version: '2.0.0'
      changes: ['New auth system', 'Updated data model']
    },
  ]
}
```
