# UI Component Library

PM System 2025의 완전한 UI 컴포넌트 라이브러리입니다.

## 🎨 디자인 시스템

### 테마 시스템

이 라이브러리는 CSS 변수 기반의 테마 시스템을 사용합니다:

- **토큰 기반**: 색상, 스페이싱, 타이포그래피 등 모든 디자인 토큰이 중앙집중화
- **다크 모드**: 자동 다크/라이트 모드 지원
- **일관성**: 모든 컴포넌트가 동일한 테마 시스템을 공유

### 구성 패턴

**Composition Pattern**을 통해 유연하고 재사용 가능한 UI를 구축할 수 있습니다:

```tsx
// 기본 사용법
<Box display="flex" className="gap-4">
  <Text size="lg" weight="bold">제목</Text>
  <Button variant="outline">액션</Button>
</Box>

// asChild를 통한 다형성
<Button asChild>
  <a href="/link">링크 버튼</a>
</Button>
```

## 🧩 컴포넌트 구조

### 기본 UI 컴포넌트
- `Button` - 다양한 variant와 크기 옵션
- `Input` - 폼 입력 컴포넌트
- `Card` - 콘텐츠 컨테이너
- `Modal` - 오버레이 다이얼로그
- `Toast` - 알림 메시지

### 프리미티브 컴포넌트
- `Box` - 기본 레이아웃 컨테이너
- `Flex` - 플렉스박스 레이아웃
- `Grid` - CSS 그리드 레이아웃
- `Stack` / `HStack` - 수직/수평 스택
- `Text` - 텍스트 스타일링
- `Heading` - 헤딩 요소

## 📖 사용법

### 기본 컴포넌트

```tsx
import { Button, Input, Card } from '@/components/ui'

function MyComponent() {
  return (
    <Card variant="elevated" size="lg">
      <div className="space-y-4">
        <Input variant="success" placeholder="입력하세요" />
        <Button variant="destructive" size="lg">
          삭제
        </Button>
      </div>
    </Card>
  )
}
```

### 프리미티브 조합

```tsx
import { Box, Text, Flex, Stack } from '@/components/ui/primitives'

function LayoutExample() {
  return (
    <Flex direction="column" gap={4}>
      <Text size="2xl" weight="bold" color="primary">
        메인 제목
      </Text>
      
      <Stack gap={2}>
        <Text size="base">첫 번째 단락</Text>
        <Text size="base" color="muted">두 번째 단락</Text>
      </Stack>
      
      <Box display="grid" className="grid-cols-2 gap-4">
        <div>왼쪽 컬럼</div>
        <div>오른쪽 컬럼</div>
      </Box>
    </Flex>
  )
}
```

## 🎭 Variant 시스템

모든 컴포넌트는 Class Variance Authority (CVA)를 사용한 타입 안전한 variant 시스템을 제공합니다.

### Button Variants

```tsx
// variant 옵션
<Button variant="default">기본</Button>
<Button variant="destructive">위험</Button>
<Button variant="outline">아웃라인</Button>
<Button variant="secondary">보조</Button>
<Button variant="ghost">고스트</Button>
<Button variant="link">링크</Button>

// size 옵션
<Button size="sm">작음</Button>
<Button size="default">기본</Button>
<Button size="lg">큼</Button>
<Button size="icon">아이콘</Button>
```

### Text Variants

```tsx
// 크기 옵션
<Text size="xs">매우 작음</Text>
<Text size="base">기본</Text>
<Text size="2xl">매우 큼</Text>

// 색상 옵션
<Text color="primary">주요</Text>
<Text color="secondary">보조</Text>
<Text color="muted">음소거</Text>
<Text color="success">성공</Text>
<Text color="warning">경고</Text>
<Text color="error">오류</Text>

// 정렬 옵션
<Text align="left">왼쪽</Text>
<Text align="center">중앙</Text>
<Text align="right">오른쪽</Text>
<Text align="justify">양쪽 정렬</Text>
```

## 🧪 Storybook

모든 컴포넌트는 Storybook으로 문서화되어 있습니다:

```bash
npm run storybook
```

다음 URL에서 확인할 수 있습니다: http://localhost:6006

## ✅ 테스팅

컴포넌트들은 포괄적인 테스트 커버리지를 가지고 있습니다:

```bash
# UI 컴포넌트 테스트
npm run test -- __tests__/components/ui/

# 프리미티브 컴포넌트 테스트
npm run test -- __tests__/components/ui/primitives/
```

### 테스트 커버리지

- **Button**: 9개 테스트 케이스 (모든 variant, size, 이벤트 처리)
- **Box**: 8개 테스트 케이스 (display, position, overflow variants)
- **Text**: 11개 테스트 케이스 (size, weight, align, color variants)

## 🔧 개발

### 새 컴포넌트 추가

1. 컴포넌트 구현 (`components/ui/my-component.tsx`)
2. CVA variants 정의
3. TypeScript 타입 정의
4. Storybook 스토리 작성 (`components/ui/my-component.stories.ts`)
5. 테스트 작성 (`__tests__/components/ui/my-component.test.tsx`)

### 스타일 가이드

- **CVA 사용**: 모든 variant 시스템은 CVA로 구현
- **forwardRef**: 모든 컴포넌트는 ref forwarding 지원
- **asChild 패턴**: 필요한 경우 Radix Slot으로 다형성 지원
- **TypeScript**: 완전한 타입 안전성
- **접근성**: WAI-ARIA 준수

## 📦 종속성

- **@radix-ui/react-slot**: asChild 패턴 구현
- **class-variance-authority**: 타입 안전한 variant 시스템
- **tailwind-merge**: 클래스 병합 및 충돌 해결
- **lucide-react**: 아이콘 시스템

## 🚀 최적화

- **Tree Shaking**: 사용하지 않는 컴포넌트 제거
- **CSS Purging**: 사용하지 않는 CSS 제거
- **Bundle Size**: 각 컴포넌트 < 10KB
- **런타임 성능**: Virtual DOM 최적화

---

이 라이브러리는 PM System 2025의 디자인 시스템을 완전히 구현하며, 확장 가능하고 유지보수가 쉬운 컴포넌트 아키텍처를 제공합니다.