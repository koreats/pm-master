# PM System 2025

> 🚀 개인과 소규모 팀을 위한 초경량 프로젝트 관리 도구

## 📋 프로젝트 개요

PM System 2025는 1-5명 규모의 소규모 팀과 개인을 위해 설계된 직관적이고 강력한 프로젝트 관리 시스템입니다. 복잡한 기업용 도구의 부담 없이, 필수 기능에 집중하여 생산성을 극대화합니다.

### 🎯 핵심 가치

- **단순함**: 3단계 계층 구조 (목표 → 프로젝트 → 작업)
- **유연함**: 6가지 뷰 시스템 (테이블, 칸반, 캘린더, 타임라인, 갤러리, 리스트)
- **실시간**: 팀원 간 즉각적인 동기화와 협업
- **접근성**: 모든 기기에서 완벽한 경험 (PWA 지원)

## ✨ 주요 기능

### 계층적 작업 관리
- **목표 (Goals)**: 큰 그림의 목표 설정 및 추적
- **프로젝트 (Projects)**: 목표 달성을 위한 프로젝트 관리
- **작업 (Tasks)**: 실행 가능한 구체적 작업 관리

### 다양한 뷰 시스템
- **테이블 뷰**: 스프레드시트 스타일의 상세 관리
- **칸반 보드**: 드래그 앤 드롭으로 작업 흐름 관리
- **캘린더**: 일정 기반 작업 계획 및 추적
- **타임라인**: 간트 차트 스타일의 프로젝트 일정 관리
- **갤러리**: 비주얼 중심의 프로젝트 관리
- **리스트**: 간단하고 빠른 작업 목록 관리

### 협업 기능
- 실시간 동기화 (Supabase Realtime)
- 댓글 및 멘션 시스템
- 파일 첨부 및 공유
- 활동 로그 및 알림

### 고급 기능
- 마크다운 에디터 지원
- 다크 모드
- PWA 오프라인 지원
- 키보드 단축키
- 일괄 작업 처리
- 고급 필터링 및 검색

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 15.1.0 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: 
  - TanStack Query v5 (서버 상태)
  - Zustand v4 (클라이언트 상태)
- **Forms**: React Hook Form + Zod

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Realtime**: Supabase Realtime
- **Storage**: Supabase Storage
- **API**: Next.js API Routes

### DevOps
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics
- **Testing**: Jest + React Testing Library

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary (Mint)**: 신선함과 성장
- **Secondary (Peach)**: 따뜻함과 친근함
- **Tertiary (Sky)**: 신뢰와 전문성

### 디자인 원칙
- 미니멀하고 깔끔한 인터페이스
- 일관된 8px 그리드 시스템
- WCAG 2.1 AA 접근성 준수
- 반응형 디자인 (Mobile-first)

## 🚀 시작하기

### 필수 요구사항
- Node.js 20.0 이상
- npm 10.0 이상
- Supabase 계정

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/pm-system-2025.git
cd pm-system-2025

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 Supabase 정보 입력

# 개발 서버 실행
npm run dev
```

### 환경 변수 설정

`.env.local` 파일에 다음 변수들을 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 데이터베이스 설정

```bash
# Supabase CLI 설치 (선택사항)
npm install -g supabase

# 마이그레이션 실행
supabase db push
```

## 📁 프로젝트 구조

```
pm-system-2025/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── auth/              # 인증 페이지
│   ├── dashboard/         # 대시보드
│   └── (features)/        # 기능별 페이지
├── components/            # React 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── features/         # 기능별 컴포넌트
│   └── layouts/          # 레이아웃 컴포넌트
├── lib/                   # 유틸리티 및 설정
│   ├── supabase/         # Supabase 클라이언트
│   ├── hooks/            # 커스텀 훅
│   ├── stores/           # Zustand 스토어
│   └── utils/            # 유틸리티 함수
├── supabase/             # Supabase 설정
│   ├── migrations/       # 데이터베이스 마이그레이션
│   └── functions/        # Edge Functions
├── public/               # 정적 파일
├── styles/               # 글로벌 스타일
└── types/                # TypeScript 타입 정의
```

## 📅 개발 로드맵

### Phase 1: 기초 구축 (Week 1-3)
- ✅ 프로젝트 설정 및 환경 구성
- ✅ 인증 시스템 구현
- ✅ 기본 UI 컴포넌트 개발
- ✅ 데이터베이스 스키마 설계

### Phase 2: 핵심 기능 (Week 4-6)
- ✅ 3단계 계층 구조 구현
- ✅ CRUD 작업 구현
- ✅ 실시간 동기화
- ✅ 기본 뷰 시스템 (테이블, 칸반)

### Phase 3: 고급 기능 (Week 7-9)
- 🔄 모든 뷰 시스템 완성
- 🔄 파일 업로드 및 관리
- 🔄 검색 및 필터링
- 🔄 알림 시스템

### Phase 4: 최적화 (Week 10-11)
- ⏳ 성능 최적화
- ⏳ PWA 구현
- ⏳ 테스트 커버리지 확대
- ⏳ 문서화 완성

### Phase 5: 출시 준비
- ⏳ 베타 테스트
- ⏳ 버그 수정
- ⏳ 프로덕션 배포
- ⏳ 모니터링 설정

## 🧪 테스트

```bash
# 단위 테스트 실행
npm run test

# 테스트 커버리지
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

## 📝 개발 가이드

### 코드 품질

```bash
# TypeScript 타입 체크
npm run type-check

# ESLint 검사
npm run lint

# Prettier 포맷팅
npm run format
```

### 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 작업 수정
```

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀

- **Project Manager**: 프로젝트 전체 관리 및 조율
- **Frontend Developer**: UI/UX 구현 및 클라이언트 개발
- **Backend Developer**: API 및 데이터베이스 개발
- **Designer**: 디자인 시스템 및 UI 디자인

## 📞 문의

프로젝트에 대한 문의사항이나 제안사항이 있으시면 다음으로 연락주세요:

- Email: contact@pmsystem2025.com
- GitHub Issues: [https://github.com/yourusername/pm-system-2025/issues](https://github.com/yourusername/pm-system-2025/issues)

---

<div align="center">
  <strong>🚀 PM System 2025 - 작은 팀의 큰 성과를 위한 도구</strong>
</div>