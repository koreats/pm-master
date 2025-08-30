# 실시간 협업 기능 (T-007)

## 개요
PM System 2025의 실시간 협업 기능은 팀원들이 동시에 작업하며 실시간으로 상호작용할 수 있는 환경을 제공합니다.

## 주요 기능

### 1. 실시간 프레즌스 (Presence)
- **ActiveUsersList**: 현재 온라인 상태인 팀원 목록 표시
- **PresenceAvatars**: 사용자 아바타와 상태 표시
- **TypingIndicator**: 타이핑 중인 사용자 표시
- 사용자별 커서 및 선택 영역 추적

### 2. 실시간 알림 시스템
- **NotificationManager**: 중앙 집중식 알림 관리
- **NotificationBell**: 실시간 알림 표시 UI
- **ActivityFeed**: 팀 활동 피드
- 데스크톱 알림 지원
- 사운드 알림 옵션

### 3. 오프라인 지원
- **OfflineQueueManager**: 오프라인 작업 큐 관리
- **LocalCacheManager**: IndexedDB 기반 로컬 캐싱
- **SyncStatusDashboard**: 동기화 상태 대시보드
- 자동 재연결 및 동기화
- 충돌 해결 메커니즘

### 4. 실시간 댓글 시스템
- **RealtimeComments**: 실시간 댓글 컴포넌트
- 답글 및 스레드 지원
- 댓글 편집/삭제
- 이모지 반응 (준비 중)
- 파일 첨부 (준비 중)

### 5. 협업 대시보드
- **CollaborationDashboard**: 통합 협업 인터페이스
- 팀 활동 메트릭
- 실시간 사용자 상태
- 동기화 상태 모니터링

## 기술 구현

### 아키텍처
```
┌─────────────────────┐
│   Client (React)    │
├─────────────────────┤
│  Realtime Hooks     │
├─────────────────────┤
│  Supabase Realtime  │
├─────────────────────┤
│  PostgreSQL + CDC   │
└─────────────────────┘
```

### 핵심 컴포넌트

#### PresenceManager
```typescript
// 프레즌스 관리
const presenceManager = new PresenceManager({
  channelName: 'team:123',
  userId: 'user_id',
  onPresenceUpdate: (presences) => {
    // 프레즌스 업데이트 처리
  }
})
```

#### NotificationManager
```typescript
// 알림 관리
const notificationManager = new NotificationManager({
  teamId: 'team_id',
  userId: 'user_id',
  enableSound: true,
  enableDesktop: true
})
```

#### OfflineQueueManager
```typescript
// 오프라인 큐 관리
const queueManager = new OfflineQueueManager({
  maxRetries: 3,
  retryDelay: 1000
})
```

### 사용 예제

#### 실시간 프레즌스 사용
```tsx
import { usePresence } from '@/lib/realtime/hooks/usePresence'

function MyComponent() {
  const { presences, updatePresence } = usePresence('channel_name', {
    userId: 'user_id',
    autoTrackCursor: true
  })

  return (
    <div>
      {presences.map(presence => (
        <div key={presence.userId}>
          {presence.user.name} is {presence.status}
        </div>
      ))}
    </div>
  )
}
```

#### 실시간 알림 사용
```tsx
import { useNotifications } from '@/lib/realtime/hooks/useNotifications'

function MyComponent() {
  const { notifications, unreadCount } = useNotifications('team_id')

  return (
    <div>
      <Badge>{unreadCount} unread</Badge>
      {notifications.map(notification => (
        <div key={notification.id}>
          {notification.message}
        </div>
      ))}
    </div>
  )
}
```

#### 오프라인 동기화 사용
```tsx
import { useOfflineSync } from '@/lib/realtime/hooks/useOfflineSync'

function MyComponent() {
  const { isOnline, pendingCount, sync } = useOfflineSync()

  return (
    <div>
      {isOnline ? 'Online' : `Offline (${pendingCount} pending)`}
      <button onClick={sync}>Sync Now</button>
    </div>
  )
}
```

## 성능 최적화

### 1. 메시지 배치 처리
- 100ms 간격으로 메시지 배치
- 최대 50개 메시지까지 배치 처리

### 2. 이벤트 스로틀링
- 프레즌스 업데이트: 1초 스로틀
- 타이핑 상태: 500ms 스로틀

### 3. 데이터 압축
- 1KB 이상 데이터 자동 압축
- 키 단축을 통한 페이로드 최소화

### 4. 연결 풀링
- 최대 5개 동시 연결
- 연결당 최대 10개 채널
- 자동 유휴 연결 정리

### 5. 캐싱 전략
- 5분 캐시 TTL
- 최대 100개 항목 캐싱
- LRU 캐시 교체 정책

## 데이터베이스 구조

### activity_logs 테이블
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### comments 테이블
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id),
  is_edited BOOLEAN DEFAULT FALSE,
  reactions JSONB,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 보안 고려사항

### 1. RLS (Row Level Security)
- 모든 테이블에 RLS 정책 적용
- 팀 멤버십 기반 접근 제어

### 2. 데이터 암호화
- WebSocket 연결 TLS 암호화
- 민감한 데이터 E2E 암호화

### 3. 인증 및 권한
- JWT 기반 인증
- 역할 기반 접근 제어 (RBAC)

### 4. 속도 제한
- API 호출 속도 제한
- 메시지 전송 속도 제한

## 모니터링 및 디버깅

### 메트릭 수집
- 연결 상태
- 메시지 처리량
- 오류율
- 지연 시간

### 디버깅 도구
```typescript
// 디버그 모드 활성화
localStorage.setItem('realtime_debug', 'true')

// 연결 상태 확인
const stats = connectionPool.getStats()
console.log(stats)

// 메모리 사용량 확인
const memory = performanceOptimizer.getMemoryUsage()
console.log(memory)
```

## 향후 개선 계획

### 단기 (1-2개월)
- [ ] WebRTC 기반 P2P 연결
- [ ] 화면 공유 기능
- [ ] 음성/영상 통화
- [ ] 파일 공동 편집

### 중기 (3-6개월)
- [ ] AI 기반 충돌 해결
- [ ] 고급 분석 대시보드
- [ ] 플러그인 시스템
- [ ] 서드파티 통합

### 장기 (6개월+)
- [ ] 엔터프라이즈 기능
- [ ] 고급 보안 옵션
- [ ] 글로벌 CDN 지원
- [ ] 오프라인 우선 모드

## 트러블슈팅

### 연결 문제
```bash
# Supabase 연결 확인
npx supabase status

# WebSocket 연결 테스트
wscat -c wss://[PROJECT_REF].supabase.co/realtime/v1/websocket?apikey=[ANON_KEY]
```

### 동기화 문제
```javascript
// 캐시 초기화
localStorage.clear()
indexedDB.deleteDatabase('pm-system-cache')

// 강제 동기화
await offlineSync.forceSync()
```

### 성능 문제
```javascript
// 성능 프로파일링
performance.mark('realtime-start')
// ... 작업 수행
performance.mark('realtime-end')
performance.measure('realtime', 'realtime-start', 'realtime-end')
```

## 라이선스
MIT License

## 문의
기술 지원: support@pm-system.com
문서: https://docs.pm-system.com