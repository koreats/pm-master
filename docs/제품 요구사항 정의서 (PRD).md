# 📋 제품 요구사항 정의서 (PRD)

## PM System Web Application

---

## 1. 제품 개요

### 1.1 제품명

**PM System 2025** - 개인 및 소규모 팀을 위한 초경량 프로젝트 관리 앱

### 1.2 비전

개인 사용자와 5명 이하 소규모 팀을 위한 가장 심플하고 빠른 프로젝트 관리 도구

### 1.3 핵심 가치

- **5분 내 시작**: 회원가입 없이 즉시 사용 가능
- **극도로 단순한 UX**: 노션보다 쉽고 빠른 사용성
- **개인 무료 영구 사용**: 제한 없는 개인 사용
- **초경량 설계**: 빠른 로딩, 최소 리소스 사용

### 1.4 타겟 사용자

- **Primary**: 개인 사용자 (개발자, 디자이너, 기획자, 학생)
- **Secondary**: 1-5명 규모의 초기 스타트업

---

## 2. 기술 아키텍처

### 2.1 프론트엔드 스택

```typescript
{
  framework: "Next.js 15.1.0 (App Router + Turbopack)",
  ui: {
    styling: "Tailwind CSS 3.4.1",
    components: "Radix UI + shadcn/ui",
    animations: "Framer Motion 11",
    themes: "next-themes (다크모드 지원)"
  },
  stateManagement: {
    server: "TanStack Query v5",
    client: "Zustand v4",
    forms: "React Hook Form + Zod"
  },
  features: {
    dragDrop: "@dnd-kit",
    charts: "Recharts 2.12.7",
    dates: "date-fns v4",
    icons: "Lucide React"
  }
}
```

### 2.2 백엔드 스택

```typescript
{
  database: "Supabase (PostgreSQL)",
  authentication: "Supabase Auth (Google/GitHub 소셜 로그인, Magic Links, 이메일/비밀번호 지원)",
  realtime: "Supabase Realtime",
  storage: "Supabase Storage",
  api: "Next.js API Routes + Server Actions"
}
```

---

## 3. 핵심 기능 요구사항

### 3.1 인증 시스템

#### 3.1.1 기능 목록

- **인증 방식**: Supabase Auth를 통해 **이메일/비밀번호, 소셜 로그인(Google, GitHub), Magic Links** 방식 지원
- **세션 관리**: Supabase가 자동으로 관리하는 **JWT 기반**의 안전한 세션 사용
- **보안**: **다단계 인증(MFA)** 옵션 제공 및 이메일 확인, 비밀번호 재설정 기능 기본 포함
- **권한 관리**: Supabase의 **RLS(Row Level Security)** 와 연동하여 데이터베이스 레벨에서 역할 기반 접근 제어(RBAC) 구현

#### 3.1.2 기술 구현

```typescript
// 인증 플로우
interface AuthFlow {
  signUp: '이메일 인증 → 프로필 설정 → 워크스페이스 생성'
  signIn: '소셜/매직링크 → 세션 생성 → 대시보드 리다이렉트'
  permissions: ['owner', 'member']
}
```

### 3.2 데이터 모델 (3단계 계층구조)

#### 3.2.1 Level 1: Goals (목표)

```typescript
interface Goal {
  id: string
  title: string
  description: string
  colorTag: 'mint' | 'peach' | 'sky' | 'lavender' | 'coral' | 'sage'
  targetDate: Date
  status: 'planning' | 'active' | 'completed' | 'archived'
  userId: string
  workspaceId: string
  metrics: {
    progressPercentage: number
    completedProjects: number
    totalProjects: number
  }
  createdAt: Date
  updatedAt: Date
}
```

#### 3.2.2 Level 2: Projects (프로젝트)

```typescript
interface Project {
  id: string
  goalId: string // Relation to Goal
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold'
  priority: 'high' | 'medium' | 'low'
  startDate: Date
  endDate: Date
  assignees: string[] // User IDs
  dependencies: string[] // Other Project IDs
  progress: number // 0-100
  tags: string[]
  attachments: {
    id: string
    name: string
    url: string
    type: string
  }[]
  budget?: number
  actualCost?: number
}
```

#### 3.2.3 Level 3: Tasks (작업)

```typescript
interface Task {
  id: string
  projectId: string // Relation to Project
  parentTaskId?: string // For subtasks
  title: string
  description: string
  isCompleted: boolean
  priority: 'urgent' | 'high' | 'medium' | 'low'
  estimatedHours: number
  actualHours?: number
  dueDate: Date
  assigneeId: string
  labels: string[]
  checklist: {
    id: string
    text: string
    isChecked: boolean
  }[]
  comments: Comment[]
  activityLog: Activity[]
}
```

### 3.3 대시보드 시스템

#### 3.3.1 메인 대시보드 구성요소

```typescript
interface Dashboard {
  widgets: {
    clock: '실시간 디지털/아날로그 시계'
    weather: '위치 기반 날씨 정보'
    progressBar: '전체 진행도 시각화'
    todayFocus: '오늘의 작업 목록'
    activeProjects: '진행 중인 프로젝트 갤러리'
    weeklyTimeline: '주간 일정 타임라인'
    quickStats: '핵심 지표 카드'
  }
  layout: 'Responsive Grid (12 columns)'
  customization: '드래그앤드롭으로 위젯 재배치'
}
```

#### 3.3.2 데이터 시각화

- **차트 유형**: Line, Bar, Pie, Area, Radar
- **실시간 업데이트**: WebSocket 기반
- **인터랙티브**: 호버, 클릭, 필터링
- **Export**: PNG, CSV, PDF

### 3.4 뷰 시스템

#### 3.4.1 지원 뷰 타입

```typescript
enum ViewType {
  TABLE = 'table', // 스프레드시트 형태
  KANBAN = 'kanban', // 칸반 보드
  CALENDAR = 'calendar', // 캘린더 뷰
  TIMELINE = 'timeline', // 간트 차트
  GALLERY = 'gallery', // 카드 갤러리
  LIST = 'list', // 리스트 뷰
}
```

#### 3.4.2 뷰 기능

- **필터링**: 다중 조건 AND/OR 필터
- **정렬**: 다중 필드 정렬
- **그룹화**: 상태, 우선순위, 담당자별
- **저장된 뷰**: 커스텀 뷰 저장 및 공유

### 3.5 자동화 엔진

#### 3.5.1 트리거 타입

```typescript
interface AutomationTrigger {
  timeBased: '특정 시간/주기적 실행'
  eventBased: '상태 변경, 생성, 삭제 시'
  conditional: '특정 조건 충족 시'
  manual: '버튼 클릭 시'
}
```

#### 3.5.2 액션 타입

```typescript
interface AutomationAction {
  createItems: '작업/프로젝트 자동 생성'
  updateFields: '필드 값 자동 업데이트'
  sendNotifications: '이메일/슬랙 알림'
  generateReports: '리포트 자동 생성'
  moveItems: '상태/카테고리 자동 이동'
}
```

### 3.6 협업 기능

#### 3.6.1 실시간 기능

- 실시간 동기화: 데이터베이스 변경 사항을 실시간으로 반영 (마지막 쓰기 우선 정책 적용)
- **프레즌스**: 현재 보고 있는 사용자 표시
- **커서 공유**: 다른 사용자의 커서 위치 표시
- **실시간 댓글**: 즉각적인 피드백

#### 3.6.2 커뮤니케이션

```typescript
interface Communication {
  comments: {
    threaded: boolean
    mentions: boolean
    reactions: string[] // 이모지 반응
  }
  notifications: {
    inApp: boolean
    email: boolean
    push: boolean
    customRules: Rule[]
  }
  activityFeed: {
    filters: string[]
    realtime: boolean
  }
}
```

### 3.7 템플릿 시스템

#### 3.7.1 템플릿 카테고리

```typescript
interface TemplateCategories {
  project: ['스프린트 계획', '제품 출시', '마케팅 캠페인', '이벤트 기획']
  task: ['일일 체크리스트', '회의 준비', '코드 리뷰', 'QA 테스트']
  workflow: ['애자일 스크럼', '칸반', '워터폴', '하이브리드']
}
```

---

## 4. 비기능 요구사항

### 4.1 성능 요구사항

```typescript
interface PerformanceMetrics {
  pageLoadTime: '< 2초 (초기 로드)'
  apiResponseTime: '< 200ms (95 percentile)'
  realtimeLatency: '< 100ms'
  concurrentUsers: '1000+ 동시 접속'
  dataCapacity: '100GB/workspace'
}
```

### 4.2 보안 요구사항

- **데이터 암호화**: AES-256 (저장), TLS 1.3 (전송)
- **인증**: OAuth 2.0, JWT
- **권한**: Row Level Security (RLS)
- **감사**: 모든 중요 작업 로깅
- **백업**: 일일 자동 백업, 30일 보관

### 4.3 접근성 요구사항

- **WCAG 2.1 Level AA** 준수
- **키보드 네비게이션** 완벽 지원
- **스크린 리더** 호환성
- **고대비 모드** 지원
- **반응형 디자인** (모바일, 태블릿, 데스크톱)

### 4.4 국제화 (i18n)

```typescript
interface Localization {
  languages: ['ko', 'en']
  dateFormats: '로케일별 자동 적용'
  currency: '다중 통화 지원'
  timezone: '사용자별 타임존'
}
```

---

## 5. UI/UX 디자인 요구사항

### 5.1 디자인 시스템

```typescript
interface DesignSystem {
  colors: {
    mint: {
      500: '#B8E6B8' // Primary color
    }
    peach: {
      400: '#FFE4E1' // Secondary color
    }
    sky: {
      400: '#87CEEB' // Accent color
    }
    cream: {
      50: '#FFFEF9' // Background color
    }
    charcoal: {
      600: '#4A5568' // Text color
    }
    dark: {
      // 다크모드 색상 팔레트
      background: '#1A1A1A'
      surface: '#2D2D2D'
      text: '#E5E5E5'
    }
  }
  typography: {
    fontFamily: 'Pretendard, Inter, system-ui'
    scale: [12, 14, 16, 18, 20, 24, 28, 32, 48] // 9단계로 통일
    weights: [400, 500, 600, 700]
  }
  spacing: {
    unit: 4 // 4px 그리드 시스템
    scale: [0, 4, 8, 12, 16, 24, 32, 48, 64]
  }
  borderRadius: {
    small: 8
    medium: 12
    large: 16
    full: 9999
  }
  shadows: {
    small: '0 2px 4px rgba(0,0,0,0.05)'
    medium: '0 4px 6px rgba(0,0,0,0.07)'
    large: '0 10px 15px rgba(0,0,0,0.1)'
  }
}
```

### 5.2 인터랙션 패턴

- **마이크로 인터랙션**: 호버, 클릭 피드백
- **스켈레톤 로딩**: 콘텐츠 로딩 중 표시
- **옵티미스틱 업데이트**: 즉각적인 UI 반응
- **프로그레시브 디스클로저**: 단계적 정보 공개
- **애니메이션**: Framer Motion 기반 부드러운 전환

---

## 6. 개발 로드맵

### Phase 1: 기초 구축 (2주)

- [ ] 프로젝트 셋업 및 개발 환경 구성
- [ ] Supabase 데이터베이스 스키마 설계
- [ ] 인증 시스템 구현
- [ ] 기본 레이아웃 및 라우팅

### Phase 2: 핵심 기능 (3주)

- [ ] 목표, 프로젝트, 작업 CRUD
- [ ] 대시보드 위젯 시스템
- [ ] 뷰 시스템 (테이블, 칸반)
- [ ] 실시간 동기화

### Phase 3: 고급 기능 (2주)

- [ ] 자동화 엔진
- [ ] 템플릿 시스템
- [ ] 협업 기능
- [ ] 리포팅 및 분석

### Phase 4: 최적화 (1주)

- [ ] 성능 최적화
- [ ] 보안 강화
- [ ] 테스트 및 버그 수정
- [ ] 배포 준비

---

## 7. 성공 지표 (KPIs)

```typescript
interface SuccessMetrics {
  userEngagement: {
    dailyActiveUsers: '70% of registered users'
    averageSessionDuration: '> 15 minutes'
    taskCompletionRate: '> 80%'
  }
  performance: {
    loadTime: '< 2 seconds'
    uptime: '99.9%'
    errorRate: '< 0.1%'
  }
  business: {
    userRetention: '> 85% (30 days)'
    nps: '> 40'
    conversionRate: '> 5%'
  }
}
```

---

## 8. 리스크 및 완화 전략

| 리스크             | 영향도 | 완화 전략                 |
| ------------------ | ------ | ------------------------- |
| 실시간 동기화 충돌 | 높음   | CRDT 알고리즘 적용        |
| 대용량 데이터 처리 | 중간   | 페이지네이션, 가상 스크롤 |
| 브라우저 호환성    | 낮음   | 폴리필, 점진적 향상       |
| 보안 취약점        | 높음   | 정기 보안 감사, 펜테스팅  |

---

## 9. 부록

### 9.1 API 명세 예시

```typescript
// RESTful API 엔드포인트
GET    /api/goals
POST   /api/goals
PUT    /api/goals/:id
DELETE /api/goals/:id

// WebSocket 이벤트
socket.on('task:created', (task) => {})
socket.on('task:updated', (task) => {})
socket.on('presence:update', (users) => {})
```

### 9.2 데이터베이스 스키마

```sql
-- 주요 테이블 구조
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')),
  -- ...
);
```
