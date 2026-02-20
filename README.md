# 🏡 은둔마을 (Hermit Community)

평화로운 익명 커뮤니티 앱

## 기술 스택

- **Frontend**: React Native (Expo SDK 54)
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Styling**: NativeWind (Tailwind CSS)
- **Routing**: Expo Router (File-based)
- **Language**: TypeScript

## 주요 기능

- ✍️ 게시글 작성 및 조회
- 💬 댓글 시스템
- ❤️ 반응 (좋아요)
- 🔄 **실시간 업데이트** (Supabase Realtime)
- 📱 크로스 플랫폼 (iOS, Android)



## 프로젝트 구조

```
gns-hermit-comm/
├── app/                    # Expo Router 페이지
│   ├── (tabs)/            # 탭 네비게이션
│   │   ├── index.tsx      # 홈 (게시글 목록)
│   │   └── create.tsx     # 게시글 작성
│   ├── post/
│   │   └── [id].tsx       # 게시글 상세
│   └── _layout.tsx        # 루트 레이아웃
├── .maestro/            # E2E 테스트 시나리오 (Maestro)
├── components/            # 재사용 가능한 컴포넌트
│   ├── common/           # 공통 컴포넌트
│   ├── posts/            # 게시글 관련
│   ├── comments/         # 댓글 관련
│   └── reactions/        # 반응 관련
├── hooks/                # 커스텀 훅
│   ├── useAuthor.ts      # 작성자 관리
│   ├── usePostDetail.ts  # 게시글 단건 조회 (React Query)
│   ├── useRealtimePosts.ts      # 게시글 실시간 구독
│   └── useRealtimeComments.ts   # 댓글 실시간 구독
├── lib/                  # 라이브러리 설정
│   ├── supabase.ts       # Supabase 클라이언트
│   └── api.ts            # API 레이어
├── types/                # TypeScript 타입 정의
├── styles/               # 스타일 테마
├── utils/                # 유틸리티 함수
├── supabase/            # Supabase 마이그레이션
│   └── migrations/
└── docs/                # 문서
    └── supabase_setup.md
```

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

### EAS Insights

`expo-insights`가 설치되어 있어, EAS 빌드/스토어 빌드 실행 시 **앱 실행(콜드 스타트)** 이벤트가 EAS Insights로 전송됩니다. 별도 코드·설정 없이 동작하며, expo.dev → 프로젝트 → **Insights** 메뉴에서 사용량·플랫폼·앱 버전별 통계를 볼 수 있습니다. (EAS 프로젝트 연결·`extra.eas.projectId` 사용 중.)

## 문서

전체 문서 목록은 [docs/README.md](docs/README.md)를 참고하세요. AI 작업 시 [claude.md](claude.md)에서 프로젝트 컨텍스트를 참고할 수 있습니다.

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 아키텍처·API 레이어·데이터 페칭 전략
- [docs/APP_USAGE_GUIDE.md](docs/APP_USAGE_GUIDE.md) — 사용자·운영자 사용법
- [docs/supabase_setup.md](docs/supabase_setup.md) — Supabase 설정·마이그레이션(001~008)
- [docs/PROJECT_SETUP_PROPOSAL.md](docs/PROJECT_SETUP_PROPOSAL.md) — 기술 스택·폴더 구조 제안(참고용)
- [supabase/migrations/README.md](supabase/migrations/README.md) — 마이그레이션 순서·요약
- [ROADMAP.md](ROADMAP.md) — 로드맵

