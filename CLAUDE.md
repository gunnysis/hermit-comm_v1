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
│   ├── components/   # 공통 UI (Button, Input, Container, Loading, ErrorView)
│   ├── lib/          # supabase, api, queryClient, admin, anonymous
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
  - `features/community/api/communityApi.ts` — 보드·그룹·보드별 글
  - `features/admin/api/adminApi.ts` — 관리자 전용
- **UI 원칙**: feature API(communityApi, adminApi) 우선 사용. 공개 게시판 글 작성 등은 `api.createPost` 직접 호출 허용.
- **실시간**: `useRealtimePosts`, `useRealtimeComments`, `useRealtimeReactions`가 Supabase Realtime 구독 후 `queryClient.setQueryData` 또는 `invalidateQueries`로 캐시 갱신.

---

## 6. DB·마이그레이션

`supabase/migrations/` 001~008 **순서 필수**. 요약은 `supabase/migrations/README.md`.

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

## 8. 작업 시 유의사항

- **환경 변수**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`만 사용. 관리자 UID 하드코딩 금지.
- **Expo Router 타입 단언**: `router.replace('/admin')` 등 typed route 이슈 시 `as Parameters<typeof router.replace>[0]` 사용.
- **스플래시/아이콘 변경**: prebuild 시점 에셋이므로 변경 후 `npx expo prebuild --clean` 후 재빌드 필요.
- **상세 문서**: `docs/ARCHITECTURE.md`, `docs/supabase_setup.md`, `dev.md` 참고.
