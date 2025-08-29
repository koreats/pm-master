# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Quick Reference

```bash
# 개발 시작
npm run dev              # localhost:3000에서 개발 서버 시작

# 코드 품질 검증 (필수)
npm run type-check       # TypeScript 타입 체크
npm run lint            # ESLint 검사
npm run format          # Prettier 포맷팅

# 테스트 실행
npm run test            # Jest 단위 테스트 실행
npm run test:watch      # 감시 모드로 테스트 실행
npm run test:coverage   # 커버리지와 함께 테스트 실행

# 빌드 & 배포
npm run build           # 프로덕션 빌드
npm run start           # 프로덕션 실행
```

**주요 디렉토리**

- `app/` - Next.js App Router 페이지
- `components/` - React 컴포넌트 (ui/, features/, layouts/)
- `lib/supabase/` - Supabase 클라이언트 설정
- `supabase/migrations/` - 데이터베이스 스키마

# Claude Code 개발 지침

## 🚨 필수 준수 사항

### 기본 규칙

1. **모든 응답은 반드시 한국어로 작성**
2. **작업 완료 후 자동 커밋 실행** (feat, fix, refactor 등 적절한 타입 사용)
3. **Context7 MCP를 통한 최신 기술 문서 참조** (모든 개발 작업 시)
4. **코드 작업 완료 후 TypeScript 오류 검증** (`npm run type-check` 실행)

### 프로젝트 정보

- **프로젝트명**: PM System 2025
- **기술 스택**: Next.js 15.1.0, TypeScript, Supabase, Radix UI, TanStack Query, Zustand
- **목표**: 5명 이하 소규모 팀을 위한 초경량 프로젝트 관리 도구

---

## 📋 TDD 프로세스 가이드라인

### 핵심 사이클: Red → Green → Refactor

#### 1. RED 단계

- 실패하는 테스트를 먼저 작성
- 가장 간단한 시나리오 테스트
- 테스트가 올바른 이유로 실패하는지 확인
- 한 번에 하나의 테스트만

#### 2. GREEN 단계

- 테스트를 통과하는 최소한의 코드 작성
- "Fake it till you make it" 허용
- 조기 최적화 금지
- YAGNI 원칙 적용

#### 3. REFACTOR 단계

- 중복 제거
- 네이밍 개선
- 구조 단순화
- 테스트 통과 유지

### 테스트 품질: FIRST 원칙

- **Fast**: 밀리초 단위 실행
- **Independent**: 공유 상태 없음
- **Repeatable**: 항상 동일한 결과
- **Self-validating**: Pass/Fail 자동 판단
- **Timely**: 코드 작성 직전에 테스트 작성

### 테스트 구조: AAA 패턴

```typescript
// Arrange - 테스트 데이터 및 의존성 설정
// Act - 함수/메서드 실행
// Assert - 예상 결과 검증
```

### 테스트 피라미드 전략

- **단위 테스트** (70%): 빠르고 격리된 다수의 테스트
- **통합 테스트** (20%): 모듈 경계 테스트
- **인수 테스트** (10%): 사용자 시나리오

---

## 📝 Git 커밋 메시지 규칙

### 형식 구조

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 타입 (필수)

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서만 변경
- `style`: 포맷팅, 세미콜론 누락 등
- `refactor`: 버그 수정이나 기능 추가가 아닌 코드 변경
- `perf`: 성능 개선
- `test`: 누락된 테스트 추가
- `chore`: 빌드 작업, 의존성 업데이트 등
- `ci`: CI 설정 변경
- `build`: 빌드 시스템 변경
- `revert`: 이전 커밋 되돌리기

### 설명 규칙

- 명령형 사용: "add" (added나 adds 아님)
- 첫 글자 소문자
- 마지막 마침표 없음
- 최대 50자
- 구체적이고 실행 가능한 내용

### 본문 가이드라인

- 72자에서 줄 바꿈
- 무엇을, 왜 설명 (어떻게는 제외)
- 설명과 빈 줄로 구분
- 여러 변경사항은 불릿 포인트 사용

---

## 🔄 3단계 개발 프로세스

### 단계 1: 코드베이스 탐색 및 분석

**필수 작업:**

1. **체계적 파일 발견**
   - 모든 관련 파일, 디렉토리, 모듈 나열
   - 관련 키워드, 함수, 클래스, 패턴 검색
   - 식별된 각 파일 철저히 검토

2. **컨벤션 및 스타일 분석**
   - 코딩 컨벤션 문서화 (네이밍, 포맷팅, 아키텍처 패턴)
   - 기존 코드 스타일 가이드라인 식별
   - 프레임워크/라이브러리 사용 패턴 확인
   - 에러 처리 접근법 카탈로그화

### 단계 2: 구현 계획

체계적인 구현 로드맵 작성:

- 모듈별 요약 및 작업 목록
- 측정 가능한 수락 기준
- 성능/품질 요구사항

### 단계 3: 구현 실행

1. 단계 2의 계획에 따라 각 모듈 구현
2. 진행 전 모든 수락 기준 충족 확인
3. 단계 1에서 식별된 컨벤션 준수

---

## 🧹 클린 코드 원칙

### 핵심 원칙

- **DRY**: 중복을 철저히 제거
- **KISS**: 작동하는 가장 간단한 솔루션
- **YAGNI**: 지금 필요한 것만 구축
- **SOLID**: 5가지 원칙 일관되게 적용
- **보이스카우트 규칙**: 발견한 것보다 깨끗하게

### 네이밍 컨벤션

- **의도를 드러내는** 이름 사용
- 잘 알려진 것 외 약어 회피 (예: URL, API)
- 클래스: **명사**, 메서드: **동사**, 불린: **is/has/can** 접두사
- 상수: UPPER_SNAKE_CASE
- 매직 넘버 금지 - 명명된 상수 사용

### 함수 및 메서드

- **단일 책임** - 변경 이유는 하나
- 최대 20줄 (10줄 이하 선호)
- 최대 3개 매개변수 (더 많으면 객체 사용)
- 순수 함수에서 부작용 없음
- 중첩 조건보다 조기 반환

### 코드 구조

- **순환 복잡도** < 10
- 최대 중첩 깊이: 3 레벨
- 타입별이 아닌 기능별 구성
- 의존성은 내부를 향함 (클린 아키텍처)
- 구현보다 인터페이스

### 에러 처리

- 명확한 메시지로 빠르게 실패
- 에러 코드보다 예외 사용
- 적절한 레벨에서 에러 처리
- 일반 예외 캐치 금지
- 컨텍스트와 함께 에러 로깅

---

## 🔒 ISMS-P 기반 보안 개발 규칙

### 1. 인증 및 권한 부여

- **(A-1) 사용자 식별 및 인증**
  - **필수**: 모든 사용자는 개별적으로 식별 가능해야 함. 공유 계정 사용 금지
  - **필수**: 비밀번호는 다음 정책 중 하나를 만족:
    - (a) 8자 이상 + 문자, 숫자, 특수문자 혼합
    - (b) 10자 이상 + 문자, 숫자 혼합
  - **필수**: 로그인 실패 시 계정 잠금 정책 구현 (예: 5회 연속 실패 시 5분 잠금)

- **(A-2) 인증 자격 증명 관리**
  - **필수**: 비밀번호는 **bcrypt, scrypt, Argon2** 같은 적응형 해시 함수로 저장
  - **금지**: SHA-256 단독 사용 금지

- **(A-3) 권한 관리**
  - **필수**: **최소 권한 원칙**에 따라 역할에 필요한 최소 권한만 부여
  - **필수**: 권한 부여, 변경, 취소 모든 작업 로깅

### 2. 암호화

- **(C-1) 민감 정보 암호화**
  - **필수**: 법적 민감 정보(주민번호, 여권번호, 계좌번호, 카드번호) 및 비밀번호 저장/전송 시 암호화
  - **필수**: **AES-256** 같은 안전하고 검증된 암호화 알고리즘 사용
  - **금지**: 자체 개발 암호화 알고리즘 사용 금지

- **(C-2) 암호화 키 관리**
  - **금지**: 소스 코드, 설정 파일, 주석에 암호화 키 하드코딩 금지
  - **필수**: **환경 변수** 또는 전용 **키 관리 시스템(KMS, HSM)** 사용
  - **필수**: 키 접근 최소화 및 생성, 사용, 폐기 등 모든 수명주기 관리 절차 로깅

### 3. 보안 개발

- **(D-1) 보안 설계**
  - **필수**: **OWASP Top 10** 주요 취약점(SQL Injection, XSS, CSRF 등)에 대한 방어 메커니즘 설계 단계에서 포함

- **(D-2) 보안 코딩**
  - **필수**: 모든 외부 입력(요청 매개변수, 헤더, 쿠키)을 신뢰할 수 없는 것으로 처리. **검증 및 살균** 로직 항상 적용
  - **필수**: 모든 SQL 쿼리는 **매개변수화된 쿼리(prepared statements)** 사용
  - **금지**: 동적 쿼리 문자열 연결 금지
  - **필수**: 에러 처리 시 내부 시스템 세부사항(스택 트레이스, 데이터베이스 정보) 사용자에게 노출 금지

### 4. 개인정보 처리

- **(P-1) 수집 및 사용**
  - **필수**: 서비스 제공에 필요한 최소한의 개인정보만 수집
  - **필수**: 수집 목적을 사용자에게 명확히 공개하고 동의 획득
  - **금지**: 법적 근거나 별도 사용자 동의 없이 민감 정보(신념, 사상) 또는 고유 식별 정보 처리 금지

- **(P-2) 저장 및 표시**
  - **필수**: 화면 표시 시 개인정보 **마스킹** (예: John D**, +1-\***-**\*-1234, test@\*\***.com)
  - **금지**: 동의된 목적 범위를 벗어난 개인정보 사용 또는 제3자 제공 금지

### 5. 로깅 및 관리

- **(L-1) 로그 기록**
  - **필수**: 중요 활동(로그인, 개인정보 접근, 권한 변경) 로그를 **최소 1년간** 안전하게 보관
  - **필수**: 로그는 표준화되고 최소한 다음 포함: [타임스탬프, 사용자 ID, 소스 IP, 요청/작업, 성공/실패 상태]

---

## 🏛️ 아키텍처 개요

### 시스템 구조

```
┌─────────────────┐     ┌──────────────────┐
│   Next.js App   │────▶│   Supabase DB    │
│  (App Router)   │     │  (PostgreSQL)    │
└────────┬────────┘     └─────────┬────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  React Query    │     │   Realtime       │
│  (서버 상태)    │     │  (WebSocket)     │
└─────────────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│    Zustand      │
│ (클라이언트상태) │
└─────────────────┘
```

### 핵심 패턴

1. **인증 플로우**: Supabase Auth → Middleware → Server/Client 컴포넌트
2. **데이터 페칭**: TanStack Query로 서버 상태 관리, 캐싱, 동기화
3. **실시간 동기화**: Supabase Realtime으로 다중 사용자 협업
4. **상태 관리**: 서버 상태(Query) / 클라이언트 상태(Zustand) 분리
5. **UI 컴포넌트**: Radix UI 프리미티브 + CVA로 변형 관리

### 데이터 모델 관계

```
Users ──┬──▶ TeamMembers ◀──┬── Teams
        │                    │
        ├──▶ Tasks          │
        │                    ├──▶ Goals
        └──▶ Comments       │
                            └──▶ Projects ──▶ Tasks
```

**핵심 테이블 구조**:
- `users`: Supabase auth.users 확장 (id, email, name, avatar_url)
- `teams`: 팀 정보 (id, name, description, created_by)
- `team_members`: 팀 멤버십 (team_id, user_id, role: owner|admin|member)
- `goals`: 팀 목표 (team_id, title, status: active|completed|archived, progress 0-100)
- `projects`: 프로젝트 (goal_id, title, status: planning|in_progress|review|completed|on_hold, priority)
- `tasks`: 작업 (project_id, title, status: todo|in_progress|review|done|cancelled, assigned_to)
- `comments`: 작업 댓글 (task_id, user_id, content)
- `attachments`: 첨부파일 (task_id/project_id, file_url, file_size)
- `activity_logs`: 활동 로그 (team_id, user_id, entity_type, entity_id, action)

---

## 🏗️ 프로젝트 특화 규칙

### Next.js 15.1.0 App Router

- App Router 디렉토리 구조 준수 (`app/` 폴더)
- 서버 컴포넌트 우선, 클라이언트 컴포넌트는 필요시만
- `use client` 지시문은 최소한으로
- 레이아웃과 페이지 컴포넌트 분리
- 병렬 라우트와 인터셉팅 라우트 활용

### Supabase 통합

- 클라이언트: `lib/supabase/client.ts` 사용 (브라우저 환경)
- 서버: `lib/supabase/server.ts` 사용 (서버 컴포넌트)
- 미들웨어: `lib/supabase/middleware.ts` 사용 (인증 검증)
- RLS(Row Level Security) 정책 필수 적용
- 실시간 기능: `supabase/migrations/003_realtime_setup.sql` 참조

**인증 플로우**:
- 공개 경로: `/auth/login`, `/auth/signup`, `/auth/callback`, `/api/auth`
- 미들웨어가 모든 경로에서 인증 상태 확인
- 비인증 사용자는 로그인 페이지로 리다이렉트
- 인증된 사용자는 세션 자동 갱신

### UI 컴포넌트

- Radix UI + shadcn/ui 컴포넌트 우선 사용
- 커스텀 컴포넌트는 `components/ui/` 디렉토리에 배치
- CVA(class-variance-authority)로 스타일 변형 관리
- Tailwind CSS 유틸리티 클래스 사용

### 상태 관리

- 서버 상태: TanStack Query v5 사용
- 클라이언트 상태: Zustand v4 사용
- 폼 상태: React Hook Form + Zod 검증

**TanStack Query 설정** (`components/providers.tsx`):
- staleTime: 1분 (데이터 신선함 유지)
- gcTime: 5분 (가비지 컬렉션)
- refetchOnWindowFocus: false
- retry: 1 (실패 시 1회 재시도)

**Theme Provider**: next-themes 사용 (light 기본, system 지원)

### 파일 구조

```
app/
  ├── api/          # API 라우트
  ├── auth/         # 인증 페이지
  ├── dashboard/    # 대시보드
  └── (기능별)/     # 기능별 그룹
components/
  ├── ui/           # 기본 UI 컴포넌트
  ├── features/     # 기능별 컴포넌트
  └── layouts/      # 레이아웃 컴포넌트
lib/
  ├── supabase/     # Supabase 클라이언트
  ├── hooks/        # 커스텀 훅
  └── stores/       # Zustand 스토어
```

### 개발 명령어

#### 핵심 명령어

```bash
npm run dev          # 개발 서버 실행 (http://localhost:3000)
npm run build        # 프로덕션 빌드 생성
npm run start        # 프로덕션 서버 실행
npm run type-check   # TypeScript 타입 체크 (작업 완료 후 필수 실행)
npm run lint         # ESLint로 코드 품질 검사
npm run format       # Prettier로 코드 포맷팅
npm run format:check # 포맷팅 검증 (CI용)
```

#### 개발 워크플로우

1. `npm run dev`로 개발 서버 시작
2. 코드 수정 후 `npm run type-check` 실행
3. 커밋 전 `npm run lint` 및 `npm run format` 실행
4. 빌드 테스트: `npm run build`

### 테스팅 전략

- **현재 설정**: Jest + React Testing Library + jsdom 환경
- **테스트 실행**: `npm run test` (단일), `npm run test:watch` (감시), `npm run test:coverage` (커버리지)
- **테스트 파일 위치**: `__tests__/` 디렉토리 (컴포넌트별 구조)
- **설정 파일**: `jest.config.js`, `jest.setup.js`
- **커버리지 대상**: `app/`, `components/`, `lib/` 디렉토리
- **테스트 목표**:
  - 단위 테스트: 비즈니스 로직 및 유틸리티 (70%)
  - 통합 테스트: API 엔드포인트 및 데이터베이스 상호작용 (20%)
  - E2E 테스트: 핵심 사용자 워크플로우 (10%)

### 성능 목표

- 초기 로딩: 3초 이내
- 상호작용 지연: 100ms 이내
- 번들 크기: 500KB 이하

### 보안 체크리스트

- [ ] 환경 변수로 민감 정보 관리
- [ ] Supabase RLS 정책 적용
- [ ] 입력 검증 및 살균
- [ ] HTTPS 사용
- [ ] CORS 정책 설정
- [ ] 보안 헤더 설정

---

## ⚠️ 금지 사항

1. **절대 금지**
   - 비밀번호나 API 키를 코드에 하드코딩
   - `console.log`를 프로덕션 코드에 남기기
   - `any` 타입 남용
   - 테스트 없이 배포
   - 주석 처리된 코드 커밋

2. **피해야 할 사항**
   - 300줄 이상의 파일
   - 5단계 이상의 중첩
   - 동기식 API 호출 체이닝
   - 전역 상태 남용
   - 인라인 스타일 과도 사용

3. **보안 금지사항**
   - SQL 인젝션 취약점이 있는 동적 쿼리
   - XSS 취약점이 있는 비살균 출력
   - CSRF 토큰 없는 상태 변경 요청
   - 암호화되지 않은 민감 데이터 저장
   - 공개 저장소에 .env 파일 커밋

---

## 📌 우선순위

1. **보안** > 기능 > 성능 > 편의성
2. **테스트 가능성** > 구현 속도
3. **유지보수성** > 초기 개발 속도
4. **사용자 경험** > 개발자 경험

---

## 🔄 워크플로우

1. **기능 개발 시**:
   - Context7 MCP로 최신 문서 확인
   - TDD 사이클 적용
   - 클린 코드 원칙 준수
   - TypeScript 오류 확인
   - 커밋 메시지 규칙 따라 커밋

2. **버그 수정 시**:
   - 재현 가능한 테스트 작성
   - 최소한의 코드로 수정
   - 리그레션 테스트 추가
   - TypeScript 오류 확인
   - fix 타입으로 커밋

3. **리팩토링 시**:
   - 테스트 커버리지 확인
   - 단계별 리팩토링
   - 각 단계마다 테스트 실행
   - TypeScript 오류 확인
   - refactor 타입으로 커밋

---

## ✅ 체크리스트

커밋 전 확인:

- [ ] 모든 테스트 통과
- [ ] TypeScript 오류 없음 (`npm run type-check`)
- [ ] 린트 오류 없음 (`npm run lint`)
- [ ] 콘솔 로그 제거
- [ ] 주석 처리된 코드 제거
- [ ] 티켓 없는 TODO 제거
- [ ] 성능 수용 가능
- [ ] 보안 고려됨
- [ ] 문서 업데이트됨

---

## 📚 참조

- Next.js 15 문서: Context7 MCP 통해 확인
- Supabase 문서: Context7 MCP 통해 확인
- Radix UI: Context7 MCP 통해 확인
- TanStack Query: Context7 MCP 통해 확인
- Zustand: Context7 MCP 통해 확인

**기억하세요**: 읽기 쉬운 코드가 좋은 코드입니다. 똑똑함보다 가독성과 유지보수성을 최적화하세요.
