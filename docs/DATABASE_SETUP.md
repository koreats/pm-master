# 데이터베이스 설정 가이드

## 📊 PM System 2025 - Supabase 데이터베이스 설정

### 🚀 시작하기 전에

PM System 2025는 Supabase를 백엔드로 사용합니다. 다음 단계를 따라 데이터베이스를 설정하세요.

---

## 1️⃣ Supabase 프로젝트 생성

### 온라인 설정 (권장)

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Project Name**: pm-system-2025
   - **Database Password**: 강력한 비밀번호 설정 (저장 필수!)
   - **Region**: 가장 가까운 지역 선택
4. "Create new project" 클릭

### 프로젝트 생성 후

프로젝트가 생성되면 다음 정보를 수집하세요:

1. **Settings > API** 페이지에서:
   - Project URL (`https://[YOUR-PROJECT-REF].supabase.co`)
   - Anon/Public Key
   - Service Role Key (보안 주의!)

2. **Settings > Database** 페이지에서:
   - Connection string

---

## 2️⃣ 환경 변수 설정

`.env.local` 파일을 열고 수집한 정보를 입력:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI... # Optional
```

---

## 3️⃣ 데이터베이스 마이그레이션 실행

### 준비된 마이그레이션 파일

프로젝트에는 다음 마이그레이션 파일이 준비되어 있습니다:

1. **001_initial_schema.sql** - 기본 테이블 구조
2. **002_rls_policies.sql** - Row Level Security 정책
3. **003_realtime_setup.sql** - 실시간 기능 설정
4. **004_documentation_system.sql** - 문서화 시스템 테이블

### 마이그레이션 실행 방법

#### 옵션 1: Supabase Dashboard 사용 (권장)

1. Supabase Dashboard > SQL Editor 열기
2. 각 마이그레이션 파일 순서대로 실행:
   ```sql
   -- 1. 001_initial_schema.sql 내용 복사 & 실행
   -- 2. 002_rls_policies.sql 내용 복사 & 실행
   -- 3. 003_realtime_setup.sql 내용 복사 & 실행
   -- 4. 004_documentation_system.sql 내용 복사 & 실행
   ```

#### 옵션 2: Supabase CLI 사용

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 링크
supabase link --project-ref [YOUR-PROJECT-REF]

# 마이그레이션 실행
supabase db push
```

#### 옵션 3: psql 직접 연결

```bash
# DATABASE_URL 사용하여 직접 연결
psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql
psql $DATABASE_URL -f supabase/migrations/002_rls_policies.sql
psql $DATABASE_URL -f supabase/migrations/003_realtime_setup.sql
psql $DATABASE_URL -f supabase/migrations/004_documentation_system.sql
```

---

## 4️⃣ 인증 설정

### 이메일 인증 활성화

1. Supabase Dashboard > Authentication > Providers
2. Email 활성화 확인
3. 다음 설정 구성:
   - **Enable Email Confirmations**: ON
   - **Minimum Password Length**: 8

### 소셜 로그인 설정 (선택사항)

Google 로그인 설정:
1. Authentication > Providers > Google
2. Google Cloud Console에서 OAuth 2.0 Client ID 생성
3. Client ID와 Secret 입력
4. Redirect URL을 Google Console에 추가

GitHub 로그인 설정:
1. Authentication > Providers > GitHub
2. GitHub Settings > Developer settings > OAuth Apps
3. 새 OAuth App 생성
4. Client ID와 Secret 입력

---

## 5️⃣ 실시간 기능 활성화

Dashboard > Database > Replication에서 다음 테이블의 실시간 기능 활성화:

- [ ] `goals`
- [ ] `projects`
- [ ] `tasks`
- [ ] `comments`
- [ ] `team_members`

---

## 6️⃣ 보안 설정

### Row Level Security (RLS) 확인

모든 테이블에 RLS가 활성화되어 있는지 확인:

```sql
-- RLS 상태 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 정책 검증

```sql
-- 정책 목록 확인
SELECT * FROM pg_policies;
```

---

## 7️⃣ 초기 데이터 설정 (선택사항)

테스트용 초기 데이터 생성:

```sql
-- 테스트 팀 생성
INSERT INTO teams (name, description, created_by)
VALUES ('Demo Team', '데모 팀입니다', auth.uid());

-- 테스트 목표 생성
INSERT INTO goals (team_id, title, description, status, progress)
VALUES (
  (SELECT id FROM teams WHERE name = 'Demo Team'),
  '프로젝트 초기 설정',
  'PM System 2025 초기 설정 완료',
  'active',
  50
);
```

---

## 8️⃣ 타입 생성

TypeScript 타입 자동 생성:

```bash
# Supabase CLI로 타입 생성
npx supabase gen types typescript --project-id [YOUR-PROJECT-ID] > types/database.generated.ts
```

---

## ✅ 설정 완료 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 마이그레이션 실행 완료
- [ ] RLS 정책 적용 완료
- [ ] 실시간 기능 활성화 완료
- [ ] 인증 설정 완료
- [ ] TypeScript 타입 생성 완료

---

## 🔧 문제 해결

### 연결 오류

```bash
# 연결 테스트
npx supabase db remote list
```

### RLS 정책 오류

RLS가 활성화되어 있으면 anon key로는 데이터를 읽을 수 없습니다.
Service Role Key를 사용하거나 적절한 정책을 설정하세요.

### 마이그레이션 충돌

이미 존재하는 테이블 오류가 발생하면:

```sql
-- 기존 스키마 백업 후 초기화
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

---

## 📚 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js + Supabase 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [RLS 정책 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [실시간 기능 가이드](https://supabase.com/docs/guides/realtime)

---

## 🤝 지원

문제가 발생하면:
1. [GitHub Issues](https://github.com/your-repo/pm-system-2025/issues) 에 문제 보고
2. `docs/` 폴더의 다른 문서 참조
3. Supabase Discord 커뮤니티 활용

---

*최종 업데이트: 2024년 12월*