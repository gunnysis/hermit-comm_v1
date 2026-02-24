# 🏡 은둔마을 (Hermit Community)

평화로운 익명 커뮤니티 앱

## 기술 스택

- **Frontend**: React Native (Expo SDK 54)
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Styling**: NativeWind (Tailwind CSS)
- **Routing**: Expo Router (File-based)
- **Language**: TypeScript
- **글 작성·본문**: TenTap 에디터(`@10play/tentap-editor`), `react-native-webview`, `react-native-render-html` (HTML 본문 표시)

## 주요 기능

- ✍️ **리치 텍스트** 게시글 작성 및 HTML 본문 표시 (TenTap 에디터)
- 💬 댓글 시스템
- ❤️ 반응 (좋아요·하트·웃음)
- 🔄 **실시간 업데이트** (Supabase Realtime)
- 📱 크로스 플랫폼 (iOS, Android)



## 프로젝트 구조

```
src/
├── app/                    # Expo Router (라우팅·레이아웃)
│   ├── (tabs)/             # 탭: 홈, 그룹, 작성, 설정
│   ├── post/[id].tsx       # 게시글 상세
│   ├── post/edit/[id].tsx  # 게시글 수정
│   ├── groups/             # 내 그룹, 그룹 게시판
│   └── admin/              # 관리자 (그룹·보드 생성)
├── features/
│   ├── auth/               # 익명 로그인, useAuth
│   ├── admin/              # 관리자 API·useIsAdmin
│   ├── community/          # 보드·그룹·communityApi
│   ├── posts/              # PostCard, PostList, PostBody, usePostDetail, 실시간
│   └── comments/           # CommentList, useRealtimeComments
├── shared/
│   ├── components/         # Button, Input, ContentEditor, ErrorView 등
│   ├── lib/                # supabase, api, queryClient, admin, anonymous
│   ├── hooks/              # useNetworkStatus, useResponsiveLayout
│   └── utils/              # validate, format, logger, html(stripHtml, getExcerpt)
└── types/                  # Post, Comment, Board 등
```

- `.maestro/` — E2E 시나리오 (Maestro)
- `supabase/migrations/` — DB 마이그레이션
- `docs/` — 아키텍처·설정·사용 가이드

## 실시간 업데이트

앱은 Supabase Realtime을 사용하여 실시간 업데이트를 제공합니다:

- 📝 **새 게시글**: 다른 사용자가 게시글을 작성하면 자동으로 목록에 추가됨
- 🗑️ **게시글 삭제**: 삭제된 게시글이 자동으로 목록에서 제거됨
- 💬 **새 댓글**: 댓글이 작성되면 실시간으로 표시됨

## 환경 변수

- `EXPO_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase Publishable Key

## 배포 (EAS)

배포는 EAS Workflows로 자동화되어 있으며, **`main` 브랜치에 push할 때마다** 프로덕션 빌드와 OTA 업데이트가 실행되어 비용이 발생합니다.

- **평소**: `commit`만 하고 **push는 하지 않기** → 로컬에서만 이력 쌓이고, 빌드/업데이트가 돌지 않아 비용·자동 배포가 발생하지 않음.
- **배포할 때**: “이제 배포해야겠다”고 결정한 뒤 **`main`에 push** → 그 시점에 프로덕션 빌드 + OTA가 실행됨.

다른 브랜치에 push하는 것은 프로덕션 배포를 트리거하지 않습니다. **`main`에 push하는 시점 = 배포가 실행된다**는 점만 유의하면 됩니다.

| 워크플로우 | push 시 실행 | 하는 일 |
|------------|--------------|----------|
| Build Preview / Publish Update (Preview) | ❌ 수동만 | - |
| **Build and Submit to Play Store** | ✅ main push 시 | **빌드 후 Play Store에 APK/AAB 제출** (스토어에 새 버전 올라감) |
| Publish Update (Production) | ✅ main push 시 | **OTA만** (이미 설치한 사용자에게 JS 번들 전달, 스토어 업로드 아님) |
| Build Production (빌드만) | ❌ 수동만 | - |

**중요**: expo.dev에 "Publish Update (Production)"만 보인다면 → OTA 퍼블리시만 된 상태입니다. **Play Store에 실제로 올라가려면 "Build and Submit to Play Store" 워크플로우**가 실행·성공해야 합니다.

- **expo.dev에서 확인**: 프로젝트 → **Workflows** (또는 **Builds**)에서 **"Build and Submit to Play Store"** 실행 이력을 찾고, **Submit to Play Store** 단계가 성공했는지 확인하세요.
- **실패했다면**: 해당 실행 로그에서 빌드/제출 실패 원인 확인 (서비스 계정, 트랙, 서명 등). 성공했어도 Google Play Console에서 심사·출시까지 시간이 걸릴 수 있습니다.

### OTA vs Production 빌드

| 변경 유형 | 배포 방법 |
|-----------|-----------|
| **JS/TS·리소스만** (로직·UI 텍스트 등) | **OTA** (`npm run update:production` 또는 워크플로우 "Publish Update (Production)") |
| **네이티브 의존성 추가/변경** (예: 새 네이티브 모듈, `react-native-webview`, TenTap 에디터 등) | **Production 빌드 후 스토어 제출** (`eas build --profile production --auto-submit` 또는 "Build and Submit to Play Store") |

리치 텍스트 에디터(TenTap, WebView) 도입처럼 **네이티브 코드가 바뀌는 수정**은 반드시 새 앱 빌드 후 스토어 제출이 필요합니다. OTA만으로는 기존 사용자 앱에 네이티브 모듈이 추가되지 않습니다.

### EAS 빌드·의존성

- **`.npmrc`**: 프로젝트 루트에 `legacy-peer-deps=true`가 설정되어 있습니다. TenTap 등 React 18 peer 의존성과의 호환을 위해 EAS 클라우드 설치 단계에서 사용됩니다.

### EAS Insights

`expo-insights`가 설치되어 있어, EAS 빌드/스토어 빌드 실행 시 **앱 실행(콜드 스타트)** 이벤트가 EAS Insights로 전송됩니다. 별도 코드·설정 없이 동작하며, expo.dev → 프로젝트 → **Insights** 메뉴에서 사용량·플랫폼·앱 버전별 통계를 볼 수 있습니다. (EAS 프로젝트 연결·`extra.eas.projectId` 사용 중.)

## 문서

전체 문서 목록은 [docs/README.md](docs/README.md)를 참고하세요. AI 작업 시 [CLAUDE.md](CLAUDE.md)에서 프로젝트 컨텍스트를 참고할 수 있습니다.

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 아키텍처·API 레이어·데이터 페칭 전략
- [docs/APP_USAGE_GUIDE.md](docs/APP_USAGE_GUIDE.md) — 사용자·운영자 사용법
- [docs/supabase_setup.md](docs/supabase_setup.md) — Supabase 설정·마이그레이션(001~008)
- [docs/PROJECT_SETUP_PROPOSAL.md](docs/PROJECT_SETUP_PROPOSAL.md) — 기술 스택·폴더 구조 제안(참고용)
- [supabase/migrations/README.md](supabase/migrations/README.md) — 마이그레이션 순서·요약
- [ROADMAP.md](ROADMAP.md) — 로드맵

