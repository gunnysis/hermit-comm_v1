# 은둔마을 아키텍처

기술 스택, 폴더 구조, 데이터 페칭 전략, API 레이어 역할을 한곳에 정리합니다.  
그룹·보드·RLS 상세는 [architecture_v2_groups.md](../architecture_v2_groups.md), [supabase_setup.md](supabase_setup.md)를 참조하세요.

---

## 1. 기술 스택

| 구분 | 라이브러리 | 용도 |
|------|------------|------|
| **프론트엔드** | React Native (Expo SDK 54) | 크로스 플랫폼 앱 |
| **백엔드** | Supabase | PostgreSQL, Realtime, Auth |
| **스타일** | NativeWind (Tailwind CSS) | 스타일링 |
| **라우팅** | Expo Router | 파일 기반 라우팅 |
| **서버 상태** | TanStack Query (React Query) | 데이터 페칭·캐싱·재검증 |
| **폼/검증** | React Hook Form + Zod | 게시글·댓글·관리자 폼 |
| **글 작성·본문** | TenTap(`@10play/tentap-editor`), react-native-webview, react-native-render-html | 리치 텍스트 작성·HTML 본문 표시 |
| **날짜** | date-fns | 날짜 포맷 |
| **언어** | TypeScript | 타입 안정성 |

---

## 2. 폴더 구조 (Feature-based)

```
src/
├── app/                    # Expo Router (라우팅·레이아웃만)
│   ├── (tabs)/             # 탭: 홈, 그룹, 작성, 설정
│   ├── post/[id].tsx       # 게시글 상세
│   ├── post/edit/[id].tsx  # 게시글 수정
│   ├── groups/             # 내 그룹 목록, 그룹 게시판
│   ├── admin/              # 관리자 (그룹·보드 생성)
│   └── _layout.tsx
├── features/
│   ├── auth/               # 인증 (익명 로그인, useAuth)
│   ├── admin/              # 관리자 API (createGroupWithBoard, getMyManagedGroups)
│   ├── community/          # 보드·그룹·보드별 글 (communityApi, useBoards, useBoardPosts 등)
│   ├── posts/              # 게시글 (PostCard, PostList, PostBody, usePostDetail, useRealtimePosts)
│   └── comments/           # 댓글 (CommentList, useRealtimeComments)
├── shared/
│   ├── components/         # UI 키트 (Button, Input, Container, ContentEditor, Loading, ErrorView)
│   ├── hooks/              # useResponsiveLayout 등
│   ├── lib/                # supabase, api, queryClient, admin, anonymous
│   └── utils/              # validate, format, logger, html(stripHtml, getExcerpt, isLikelyHtml)
└── types/                  # 전역 타입 (Post, Comment, Board 등)
```

---

## 3. 데이터 페칭 전략 (React Query 일원화)

- **원칙**: 서버 데이터는 **TanStack Query**로만 조회·캐싱·재검증. 홈·그룹·관리자·게시글 상세·수정 화면 모두 `useQuery`/`useMutation` 사용.
- **패턴**:
  - 목록: `useQuery({ queryKey: ['posts', boardId], queryFn: () => getBoardPosts(...) })`
  - 단건: `usePostDetail(postId)` → 내부적으로 `useQuery(['post', postId], () => api.getPost(...))`
  - 댓글/반응: `useQuery(['comments', postId], ...)` / `useQuery(['reactions', postId], ...)` + 실시간 구독 시 `queryClient.setQueryData`로 캐시 갱신.
- **실시간**: Supabase Realtime 구독(useRealtimePosts, useRealtimeComments, useRealtimeReactions)은 유지하며, 이벤트 시 캐시만 갱신하거나 `invalidateQueries` 호출.

---

## 4. API 레이어 역할

| 레이어 | 경로 | 역할 |
|--------|------|------|
| **공통 저수준 API** | `shared/lib/api.ts` | 게시글·댓글·반응 CRUD, 검색(`getPosts`, `getPost`, `createPost`, `getComments`, `createComment`, `getReactions`, `createReaction` 등). 인증·RLS는 Supabase에 위임. |
| **커뮤니티 API** | `features/community/api/communityApi.ts` | 보드·그룹·보드별 글 조회 및 게시글 생성·그룹 참여. `getBoards`, `getMyGroups`, `getGroupBoards`, `getBoardPosts`, `getGroupPosts`, `createBoardPost`, `joinGroupByInviteCode`(내부에서 Supabase 직접 호출). |
| **관리자 API** | `features/admin/api/adminApi.ts` | 관리자 전용. 그룹·기본 보드 생성, 본인이 owner인 그룹 목록. `createGroupWithBoard`, `getMyManagedGroups`. |

- **UI 사용 원칙**: 가능한 한 **feature API**(communityApi, adminApi)만 사용. 공개 게시판 글 작성 등은 기존처럼 `api.createPost` 직접 호출 허용.

---

## 5. 글 작성·본문 표시

- **작성**: `shared/components/ContentEditor.tsx`(TenTap 래퍼). 본문은 HTML로 저장되며, `shared/utils/validate.ts`의 `validatePostContent`에서 `stripHtml`로 실제 텍스트 길이 검사(최대 5000자).
- **보기**: `features/posts/components/PostBody.tsx`가 `html.isLikelyHtml(content)`로 분기 후, HTML이면 `react-native-render-html`로 안전 렌더(script/iframe 등 제한), 실패 시 plain 텍스트 fallback. 빈 본문은 "내용 없음" + 접근성 라벨.
- **목록 미리보기**: `PostCard`에서 `html.getExcerpt(post.content, 120)`으로 요약 표시.

---

## 6. 인증·익명 정책 요약

- **인증**: 앱 시작 시 Supabase 익명 로그인(`signInAnonymously`). `useAuth`로 세션·로딩·에러 관리.
- **관리자 구분**: DB의 `app_admin` 테이블 조회로 판단. 관리자 전용 **이메일/비밀번호 로그인** 후에만 관리자 영역 접근. DB 쪽 생성 권한은 `app_admin` 테이블 + RLS로 제한.
- **익명 표시**: `shared/lib/anonymous.ts`의 `resolveDisplayName`, `generateAlias`. 보드별 `anon_mode`(always_anon / allow_choice / require_name)에 따라 `is_anonymous`, `display_name` 결정.

### 6.1 관리자 계정 분리(운영 정책)

- **원칙**
  - 일반 사용자는 **Supabase 익명 로그인**을 기본으로 사용한다.
  - 관리자는 일반 사용자와 **계정을 공유하지 않고**, Supabase Auth의 **별도 이메일/비밀번호 계정**으로만 로그인한다.
  - MFA 등 로그인 단계를 추가하지 않는다. (운영 요구사항)

## 7. 관련 문서

- [PROJECT_SETUP_PROPOSAL.md](PROJECT_SETUP_PROPOSAL.md) — 기술 스택 제안·폴더 구조 제안·CI/CD
- [APP_USAGE_GUIDE.md](APP_USAGE_GUIDE.md) — 사용자·운영자 사용법
- [supabase_setup.md](supabase_setup.md) — Supabase 설정·마이그레이션·RLS
- [architecture_v2_groups.md](../architecture_v2_groups.md) — 그룹형 익명 커뮤니티 설계
- [ROADMAP.md](../ROADMAP.md) — 로드맵
