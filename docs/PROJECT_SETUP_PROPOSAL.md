## 0. 아키텍처 문서

아키텍처·API 레이어·데이터 페칭 전략은 [ARCHITECTURE.md](ARCHITECTURE.md)에 정리되어 있습니다.

> **참고**: 이 제안서의 기술 스택·폴더 구조·데이터 전략은 대부분 반영된 상태입니다. CI/CD·컨벤션 등은 참고용으로 활용하세요.

---

## 1. 기술 스택 고도화 제안

현재 스택(Expo, Supabase, NativeWind)은 훌륭합니다. V2(그룹 기능) 및 로드맵(오프라인 지원, 성능 최적화) 달성을 위해 다음 라이브러리 도입을 강력히 권장합니다.

| 구분 | 추천 라이브러리 | 도입 이유 |
|------|----------------|-----------|
| **서버 상태 관리** | **TanStack Query (React Query)** | `useEffect` 기반의 데이터 페칭을 대체. 캐싱, 자동 재요청, 오프라인 지원, 무한 스크롤 구현 용이. |
| **전역 상태 관리** | **Zustand** | 가볍고 직관적인 클라이언트 상태 관리 (예: 현재 선택된 그룹 ID, 테마 설정 등). |
| **폼 관리** | **React Hook Form** + **Zod** | 게시글 작성, 초대 코드 입력 등 유효성 검사가 필요한 로직을 간소화. |
| **날짜 처리** | **date-fns** | 가볍고 트리쉐이킹이 지원되는 날짜 라이브러리. |

---

## 2. 폴더 구조 재편 (Feature-based)

기능이 늘어날수록(그룹, 채팅, 알림 등) 파일 종류별(`components`, `hooks`) 분류는 유지보수가 어려워집니다. **기능(Feature) 단위**로 응집도를 높이는 구조를 제안합니다.

### 제안 구조

```text
src/
├── app/                 # Expo Router (라우팅 및 레이아웃만 담당)
├── features/            # 핵심 비즈니스 로직 (기능별 분류)
│   ├── auth/            # 인증 (익명 로그인, 세션)
│   ├── groups/          # V2: 그룹 (초대, 가입, 멤버십)
│   ├── posts/           # 게시글 (목록, 상세, 작성)
│   │   ├── components/  # 게시글 전용 컴포넌트 (PostCard 등)
│   │   ├── hooks/       # 게시글 관련 훅 (usePosts, useCreatePost)
│   │   └── api/         # 게시글 API 함수
│   └── comments/        # 댓글 기능
├── shared/              # 공용 모듈
│   ├── components/      # UI 키트 (Button, Input, Layout) - 도메인 로직 없음
│   ├── hooks/           # 공용 훅 (useAppState, useOnlineManager)
│   ├── lib/             # 외부 라이브러리 설정 (supabase, queryClient)
│   └── utils/           # 순수 유틸리티 함수
└── types/               # 전역 타입 정의 (DB 스키마 등)
```

> **Note:** 기존 `c:\Users\Administrator\programming\app\gns-hermit-comm\` 루트에 있는 소스들을 `src` 폴더로 이동하고, `tsconfig.json`에서 Path Alias(`@/*`)를설정하여 import 경로를 깔끔하게 관리하는 것을 추천합니다.

---

## 3. 데이터 관리 전략 (Data Fetching Strategy)

현재 `api.ts`와 `useEffect` 조합은 V2의 복잡한 데이터 의존성(그룹 변경 시 게시글 갱신 등)을 처리하기 어렵습니다.

### TanStack Query 도입 시 패턴

```typescript
// features/posts/hooks/usePosts.ts
export const usePosts = (groupId: number) => {
  return useQuery({
    queryKey: ['posts', groupId], // 그룹 ID가 바뀌면 자동 재조회
    queryFn: () => api.getGroupPosts(groupId),
    staleTime: 1000 * 60, // 1분간 캐시 유지
  });
};
```

### Optimistic Updates (낙관적 업데이트)
좋아요, 댓글 작성 시 서버 응답을 기다리지 않고 UI를 즉시 갱신하여 체감 속도를 높입니다.

---

## 5. 코딩 컨벤션 및 품질 관리

### 5.1. TypeScript
- **Strict Mode**: `tsconfig.json`에서 `strict: true` 유지.
- **No Any**: `any` 타입 사용 지양. Supabase CLI를 통해 DB 타입을 자동 생성하여 사용 (`supabase gen types`).

### 5.2. 컴포넌트 설계 원칙
- **Presentational & Container**:
  - `app/` 폴더의 페이지는 데이터 로딩과 상태 관리를 담당(Container).
  - `components/` 폴더의 컴포넌트는 props로 데이터만 받아 렌더링(Presentational).
- **NativeWind**: 스타일은 인라인 클래스로 작성하되, 복잡한 스타일은 `cva`(class-variance-authority) 등을 활용해 분리.

### 5.3. 절대 경로 (Absolute Imports)
`../../components/Button` 대신 `@/components/Button` 사용.

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## 6. CI/CD 및 배포 파이프라인

### 6.1. Git Hooks (Husky)
커밋 전 코드 품질 검사 자동화.
- `pre-commit`: `tsc` (타입 체크), `eslint` (린트), `prettier` (포맷팅).
- `pre-push`: 단위 테스트 실행.

### 6.2. EAS Build 프로필 세분화 (`eas.json`)
- **development**: 개발자용, 디버깅 가능.
- **preview**: 내부 QA용, 프로덕션 API 연결.
- **production**: 스토어 배포용.

---

## 7. 커뮤니티 / 익명 게시판 설계 개요

### 7.1 도메인 개념

- **boards**
  - 게시판 메타 정보: `name`, `description`, `visibility(public/private)`, `anon_mode`.
  - 예: `id=1` 을 기본 익명 커뮤니티 보드로 사용.
- **posts / comments**
  - 공통 컬럼에 다음 필드를 추가해 익명/게시판 기능을 구현:
    - `board_id` / `group_id`
    - `is_anonymous` (boolean)
    - `display_name` (UI에 노출되는 이름: 닉네임 또는 랜덤 별칭)
- **groups / group_members**
  - 추후 소규모 비공개 그룹용으로 사용하도록 설계만 되어 있고, 현재는 `board_id` 중심으로 동작.

### 7.2 익명성 정책 (`boards.anon_mode`)

- `always_anon`
  - 항상 익명 표시. UI에는 익명 토글이 없고, `display_name`은 랜덤 별칭으로 생성.
- `allow_choice`
  - 작성자가 \"이번 글에 닉네임 공개\" 토글을 통해 선택.
  - 토글 OFF → 랜덤 별칭, 토글 ON → 입력한 닉네임.
- `require_name`
  - 항상 닉네임 표시. 익명 선택 불가(현재 기본 게시판에서는 사용하지 않지만 확장용).

### 7.3 클라이언트 구조

- 주요 파일
  - `src/features/community/api/communityApi.ts`
    - `getBoards`, `getBoardPosts(boardId, options)`, `createBoardPost(...)` 등 게시판 전용 API.
  - `src/features/community/hooks/useBoards.ts`
    - `boards` 목록을 TanStack Query로 캐싱.
  - `src/features/community/hooks/useBoardPosts.ts`
    - `useBoardPosts(boardId, sortOrder)`로 게시판별 글 목록 조회.
  - `src/shared/lib/anonymous.ts`
    - 익명/닉네임 정책을 적용해 `is_anonymous`, `display_name`을 결정.
    - `generateAlias(seed)`를 통해 랜덤 별칭(예: \"따뜻한 고래 3\") 생성.

### 7.4 UX 요약

- **글 작성 (`src/app/(tabs)/create.tsx`)**
  - 작성자 필드: \"닉네임 (선택)\" 으로, 비워도 글 작성 가능.
  - 게시판의 `anon_mode`에 따라:
    - `always_anon`: \"항상 익명으로 표시됩니다\" 안내 문구만 노출.
    - `allow_choice`: \"이번 글에 내 닉네임을 함께 표시하기\" 토글 제공.
  - 최종 `display_name`은 `resolveDisplayName`을 통해 결정되어 Supabase에 저장.
- **글/목록 헤더**
  - `boards.description`을 홈 탭(`(tabs)/index.tsx`)과 글 작성 화면 상단에 노출해,
    - 각 게시판의 목적/분위기를 사용자에게 자연스럽게 전달.

