# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# 은둔마을 — AI 작업 가이드

**언어**: 응답·주석·문서·사용자 facing 문자열 모두 한국어.

---

## 1. 프로젝트 개요

익명 커뮤니티 앱 (공개·그룹 게시판). React Native(Expo) + Supabase.

- **인증**: 기본은 Supabase 익명 로그인. 관리자만 이메일/비밀번호 로그인 후 `app_admin` 테이블로 권한 판단.
- **익명 표시**: `shared/lib/anonymous.ts`의 `resolveDisplayName`이 보드별 `anon_mode`(`always_anon` / `allow_choice` / `require_name`)에 따라 `is_anonymous`, `display_name`을 결정.

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트 | React Native, Expo SDK 54, TypeScript |
| 스타일 | NativeWind (Tailwind) |
| 라우팅 | Expo Router (파일 기반) |
| 서버 상태 | TanStack Query (`useQuery`/`useMutation`) |
| 백엔드 | Supabase (Auth, PostgreSQL, Realtime) |
| 폼/검증 | React Hook Form, Zod |
| 경로 별칭 | `@/` → `src/` |

---

## 3. 폴더 구조

```
src/
├── app/              # 라우팅만. (tabs)/, post/[id], post/edit/[id], groups/, admin/
├── features/
│   ├── auth/         # signInAnonymously, useAuth
│   ├── admin/        # adminApi (createGroupWithBoard, getMyManagedGroups), useIsAdmin
│   ├── community/    # communityApi, useBoards, useBoardPosts, useMyGroups, useGroupBoards, useGroupPosts
│   ├── posts/        # PostCard, PostList, usePostDetail, useRealtimePosts, useRealtimeReactions
│   └── comments/     # CommentList, useRealtimeComments
├── shared/
│   ├── components/   # 공통 UI (Button, Input, Container, Loading, ErrorView, ScreenHeader, SortTabs, FloatingActionButton)
│   ├── lib/          # supabase, api, queryClient, admin, anonymous, errors, storage
│   ├── hooks/        # useNetworkStatus, useResponsiveLayout
│   └── utils/        # validate, format, logger
└── types/            # Post, Comment, Board, Reaction 등 전역 타입
```

---

## 4. 개발 명령어

```bash
# 개발 서버
npx expo start
npx expo start --clear        # 캐시 클리어 후 실행

# Android 에뮬레이터
npm run android               # 빌드·설치·실행
# 서명 불일치 시: adb uninstall com.gns.hermitcomm.dev

# 검사
npm test                      # 단위 테스트
npm run test:watch            # 감시 모드
npm run test:coverage         # 커버리지
npx jest path/to/file.test.ts # 단일 파일 테스트
npx tsc --noEmit              # 타입 체크
npm run lint                  # ESLint
npm run lint:fix              # 자동 수정

# E2E 테스트 (Maestro)
npm run test:e2e              # 전체 E2E
npm run test:e2e:admin        # 관리자 시나리오만
# 환경 변수: MAESTRO_ADMIN_EMAIL, MAESTRO_ADMIN_PASSWORD (.env에 설정)

# EAS 빌드
eas build --platform android --profile development
eas build --platform android --profile preview
eas build --platform all --profile production --auto-submit

# OTA 업데이트
npm run update:preview
npm run update:production
```

**`npm test`와 `npx tsc --noEmit` 통과 유지 필수.**

---

## 5. 데이터 페칭 원칙

서버 데이터는 **TanStack Query로만** 조회·캐싱·재검증.

- **API 계층**:
  - `shared/lib/api.ts` — 저수준 CRUD (게시글·댓글·반응)
  - `features/community/api/communityApi.ts` — 보드·그룹·보드별 글, 그룹 검색, 그룹 탈퇴
  - `features/admin/api/adminApi.ts` — 관리자 전용
- **UI 원칙**: feature API(communityApi, adminApi) 우선 사용. 공개 게시판 글 작성 등은 `api.createPost` 직접 호출 허용.
- **실시간**: `useRealtimePosts`, `useRealtimeComments`, `useRealtimeReactions`가 Supabase Realtime 구독 후 `queryClient.setQueryData` 또는 `invalidateQueries`로 캐시 갱신.

---

## 6. DB·마이그레이션

`supabase/migrations/` 001~012 **순서 필수**. 요약은 `supabase/migrations/README.md`.

- **관리자 등록**: Supabase Auth에 이메일 사용자 생성 후 `INSERT INTO app_admin (user_id) VALUES (...)`.
- **RLS**: 글/댓글 읽기는 공개 또는 그룹 승인 멤버만. groups/boards INSERT는 `app_admin` 등록자만.
- **로컬 Supabase**: `supabase start` → 마이그레이션 자동 적용.

---

## 7. 주요 경로

| 목적 | 경로 |
|------|------|
| 인증 훅 | `src/features/auth/hooks/useAuth.ts` |
| 관리자 여부 훅 | `src/features/admin/hooks/useIsAdmin.ts` |
| 관리자 판단 함수 | `src/shared/lib/admin.ts` → `checkAppAdmin(userId)` |
| 익명 표시명 결정 | `src/shared/lib/anonymous.ts` → `resolveDisplayName`, `generateAlias` |
| Supabase 클라이언트 | `src/shared/lib/supabase.ts` |
| 공통 API | `src/shared/lib/api.ts` |
| 전역 타입 | `src/types/index.ts` |

---

## 8. 탭·그룹·관리자 플로우 요약

- **탭 구조**: `(tabs)/_layout.tsx` 기준으로 `홈(index)`, `그룹(groups)`, `작성(create)`, `설정(settings)` 네 개 탭을 사용.
  - `src/app/(tabs)/groups.tsx` → `src/app/groups/index.tsx` 를 re-export 하여 그룹 탭 화면을 구성.
- **그룹 탭 / 초대 코드**
  - 그룹 탭 상단의 `초대 코드로 참여` 카드에서 초대 코드를 입력해 그룹에 참여.
  - 각 그룹 카드 하단에 `나가기` 버튼으로 그룹 탈퇴 가능.
  - 관련 코드:
    - API: `src/features/community/api/communityApi.ts` → `joinGroupByInviteCode`, `leaveGroup`, `searchGroupPosts`.
    - 훅: `src/features/community/hooks/useJoinGroupByInviteCode.ts`.
    - 화면: `src/app/groups/index.tsx` (초대 코드 카드 + 내 그룹 목록 + 탈퇴).
  - 그룹 목록 쿼리: `useMyGroups` / `getMyGroups` (`features/community/hooks/api`).
- **그룹 게시판 화면** (`src/app/groups/[groupId].tsx`)
  - 다중 보드 탭 지원 (보드가 2개 이상일 때 수평 스크롤 탭 표시)
  - 제목·내용 검색 기능
  - 최신순/인기순 정렬
- **관리자 진입**
  - 일반 사용자는 항상 익명 로그인으로 시작, UI 상에서는 관리자 진입 동선이 거의 드러나지 않게 유지.
  - 앱 내 관리자 로그인 진입:
    - 하단 **설정 탭** → `운영자 관리 페이지` → `/admin/login`.
  - 이미 관리자 판별이 끝난 경우, 홈 헤더 우측의 작은 `관리자` 버튼으로 `/admin` 바로 진입.
  - `/admin/_layout.tsx` 에서 관리자 여부(`useIsAdmin`)와 세션(`useAuth`)을 함께 체크하고, 비관리자/미로그인은 탭 화면으로 되돌린 뒤 익명 세션을 복구.

---

## 9. RLS 관련 주의사항 (Supabase)

- **게시글 생성 (`createPost`)**: `.insert().select().single()` 체인에서 그룹 게시글의 경우 SELECT RLS(그룹 멤버십 요구)에 의해 차단될 수 있음. 42501 에러 시 `.select()` 없이 재시도하는 fallback 패턴 적용됨.
- **게시글/댓글 삭제**: soft delete(`update({ deleted_at })`)는 UPDATE RLS의 `deleted_at IS NULL` 조건과 충돌. **hard delete(`.delete()`)를 사용**해야 함.
- **댓글 작성**: 게시글 상세 화면에서 해당 보드의 `anon_mode`를 동적으로 조회(`useGroupBoards`/`useBoards`)하여 올바른 익명 처리 적용.

---

## 10. E2E 테스트 (Maestro)

`.maestro/` 폴더에 시나리오 파일:

| 파일 | 테스트 내용 |
|------|-------------|
| `app-launch.yaml` | 앱 실행 + 홈 화면 노출 확인 |
| `admin-login.yaml` | 설정 → 관리자 로그인 → 관리자 페이지 진입 |
| `admin-create-group.yaml` | 관리자 로그인 → 그룹 생성 → 목록 확인 |
| `admin-logout.yaml` | 관리자 로그인 → 로그아웃 → 익명 세션 복구 |

관리자 자격증명은 `.env`의 `MAESTRO_ADMIN_EMAIL`, `MAESTRO_ADMIN_PASSWORD`로 관리. 코드에 직접 하드코딩 금지.

---

## 11. 작업 시 유의사항

- **환경 변수**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`만 사용. 관리자 UID 하드코딩 금지.
- **Expo Router 타입 단언**: `router.replace('/admin')` 등 typed route 이슈 시 `as Parameters<typeof router.replace>[0]` 사용.
- **스플래시/아이콘 변경**: prebuild 시점 에셋이므로 변경 후 `npx expo prebuild --clean` 후 재빌드 필요.
- **캐시 무효화**: 게시글/댓글 생성·수정·삭제 후 반드시 관련 쿼리 키(`boardPosts`, `groupPosts`, `post` 등) `invalidateQueries` 호출.
- **상세 문서**: `docs/ARCHITECTURE.md`, `docs/supabase_setup.md`, `dev.md` 참고.
