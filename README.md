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

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. Supabase 설정

자세한 내용은 [`docs/supabase_setup.md`](docs/supabase_setup.md)를 참조하세요.

간략한 단계:

1. [Supabase 대시보드](https://supabase.com/dashboard)에서 새 프로젝트 생성
2. `supabase/migrations/001_initial_schema.sql` 실행
3. Database → Replication에서 Realtime 활성화
4. 프로젝트 루트에 `.env` 파일 생성:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxx
```

### 3. 앱 실행

```bash
# 개발 서버 시작
npx expo start

# Android
npx expo start --android

# iOS
npx expo start --ios
```

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
├── components/            # 재사용 가능한 컴포넌트
│   ├── common/           # 공통 컴포넌트
│   ├── posts/            # 게시글 관련
│   ├── comments/         # 댓글 관련
│   └── reactions/        # 반응 관련
├── hooks/                # 커스텀 훅
│   ├── useAPI.ts         # API 호출 훅
│   ├── useAuthor.ts      # 작성자 관리
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

## 개발 가이드

### 새로운 테이블 추가

1. `supabase/migrations/` 폴더에 새 SQL 파일 생성
2. Supabase SQL Editor에서 실행
3. `lib/supabase.ts`의 `Database` 타입에 테이블 정의 추가
4. `lib/api.ts`에 API 함수 추가

### 새로운 화면 추가

1. `app/` 폴더에 새 파일 생성 (예: `app/settings.tsx`)
2. Expo Router가 자동으로 라우트 생성
3. `router.push('/settings')`로 네비게이션

### 린트 및 타입 체크

```bash
# TypeScript 타입 체크
npx tsc --noEmit
```

## 배포

### EAS Build

```bash
# EAS CLI 설치
npm install -g eas-cli

# 로그인
eas login

# Android 빌드
eas build --platform android

# iOS 빌드
eas build --platform ios
```

## 문제 해결

### Metro 캐시 문제

```bash
npx expo start --clear
```

### 의존성 충돌

```bash
rm -rf node_modules package-lock.json
npm install
```

### Supabase 연결 문제

- `.env` 파일의 URL과 API 키 확인
- Supabase 대시보드에서 프로젝트 상태 확인
- `docs/supabase_setup.md` 참조

## 라이선스

MIT

## 기여

이슈와 PR은 언제나 환영합니다!

---

**Made with ❤️ for peaceful communities**
