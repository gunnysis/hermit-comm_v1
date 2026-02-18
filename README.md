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

## 문서

전체 문서 목록은 [docs/README.md](docs/README.md)를 참고하세요. AI 작업 시 [claude.md](claude.md)에서 프로젝트 컨텍스트를 참고할 수 있습니다.

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 아키텍처·API 레이어·데이터 페칭 전략
- [docs/APP_USAGE_GUIDE.md](docs/APP_USAGE_GUIDE.md) — 사용자·운영자 사용법
- [docs/supabase_setup.md](docs/supabase_setup.md) — Supabase 설정·마이그레이션(001~008)
- [docs/PROJECT_SETUP_PROPOSAL.md](docs/PROJECT_SETUP_PROPOSAL.md) — 기술 스택·폴더 구조 제안(참고용)
- [supabase/migrations/README.md](supabase/migrations/README.md) — 마이그레이션 순서·요약
- [ROADMAP.md](ROADMAP.md) — 로드맵

