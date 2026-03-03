# 멀티프로젝트 관리 가이드

앱(React Native/Expo)과 웹(Next.js)이 동일 Supabase 백엔드를 공유하며 별도 레포로 운영됨.

## 전체 아키텍처

```
                    ┌───────────────────────────────┐
                    │  supabase-hermit (WSL) — SSoT │
                    │  ~/apps/supabase-hermit       │
                    │                               │
                    │  shared/constants.ts           │
                    │  shared/types.ts               │
                    │  supabase/migrations/          │
                    │  scripts/sync-to-projects.sh   │
                    └───────────┬───────────────────┘
                                │ sync
                    ┌───────────┴───────────┐
                    │                       │
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│  앱 레포 (Windows)               │   │  웹 레포 (WSL/Ubuntu)            │
│  gns-hermit-comm                │   │  web-hermit-comm                │
│  C:\...\gns-hermit-comm         │   │  ~/apps/web                     │
│                                 │   │                                 │
│  React Native + Expo SDK 54     │   │  Next.js 16                     │
│  NativeWind (Tailwind)          │   │  Tailwind CSS v4                │
│  TanStack Query                 │   │  TanStack Query                 │
│  Expo Router                    │   │  App Router                     │
│                                 │   │                                 │
│  ★ Edge Functions 원본          │   │  (마이그레이션 복사본)            │
│  ★ shared-palette.js (자동생성)  │   │                                 │
└────────────────┬────────────────┘   └────────────────┬────────────────┘
                 │                                     │
                 └──────────────┬──────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Supabase (Seoul)     │
                    │  gns-hermit-comm      │
                    │  PostgreSQL + Auth    │
                    │  + Realtime           │
                    │  + Edge Functions     │
                    └───────────────────────┘
```

## 역할 경계

| 항목 | SSoT | 앱 레포 | 웹 레포 |
|------|------|---------|---------|
| Supabase 마이그레이션 | **supabase-hermit** | 복사본 수신 | 복사본 수신 |
| Edge Functions | 앱 레포 | **원본** (`supabase/functions/`) | 없음 |
| 공유 타입 | **supabase-hermit** | `src/types/database.types.ts` | `src/types/database.types.ts` |
| 공유 상수 | **supabase-hermit** | `src/shared/lib/constants.generated.ts` | `src/lib/constants.generated.ts` |
| 색상 팔레트 | **supabase-hermit** (`SHARED_PALETTE`) | `shared-palette.js` + `tailwind.config.js` | CSS variables |
| 반응 색상 매핑 | **supabase-hermit** (`REACTION_COLOR_MAP`) | `constants.generated.ts`에서 import | `constants.generated.ts`에서 import |
| 익명 별칭 알고리즘 | 각자 유지 | `src/shared/lib/anonymous.ts` | `src/lib/anonymous.ts` |
| 배포 환경 | — | EAS Build + OTA | Vercel |

## 동기화 체크리스트

### 마이그레이션 추가 시 (앱 → 웹)

```bash
# 웹 레포에서 실행
cd ~/apps/web
bash scripts/sync-from-app.sh
```

수동 확인 사항:
- [ ] 마이그레이션 파일이 `supabase/migrations/`에 복사되었는지 확인
- [ ] 새 테이블/컬럼이 있으면 `src/types/database.ts` 업데이트
- [ ] RLS 정책 변경 시 웹 쿼리 로직 영향 여부 확인

### 상수 변경 시

VALIDATION, ALLOWED_EMOTIONS, EMOTION_EMOJI 값 변경 시:
- [ ] `supabase-hermit/shared/constants.ts` 수정
- [ ] `sync-to-projects.sh` 실행 (양쪽 `constants.generated.ts` 자동 갱신)
- [ ] 앱 `src/shared/lib/constants.ts`의 VALIDATION은 별도 수동 유지

### 디자인 토큰 (색상 팔레트) 변경 시

SHARED_PALETTE, REACTION_COLOR_MAP 값 변경 시:
- [ ] `supabase-hermit/shared/constants.ts` 수정
- [ ] `sync-to-projects.sh` 실행 (앱: `constants.generated.ts` + `shared-palette.js` 자동 갱신)
- [ ] 앱 `tailwind.config.js`는 `shared-palette.js`에서 자동 로드 (변경 불필요)
- [ ] 웹 `globals.css` 또는 Tailwind v4 `@theme`에 수동 반영

### 타입 변경 시

- [ ] `supabase-hermit/shared/types.ts` 수정
- [ ] `sync-to-projects.sh` 실행 (양쪽 `database.types.ts` 자동 갱신)

## 절대 동기화하지 않는 것

| 파일 | 이유 |
|------|------|
| `anonymous.ts` 해시 알고리즘 | 변경 시 기존 사용자 별칭 전체 변경됨 |
| 형용사/동물 목록 내용 | 동일 이유. 앱·웹 목록이 달라도 무방 |
| 스타일·UI 컴포넌트 | 플랫폼 특성이 다름 (NativeWind vs Tailwind v4) |

## 모노레포 전환 로드맵

현재 상태로도 운영 가능하나, 아래 상황 발생 시 모노레포(Turborepo 등) 전환 검토:
1. 공유 비즈니스 로직이 3개 이상의 파일에서 중복 발생
2. 마이그레이션 동기화 오류가 반복 발생
3. 타입 불일치로 인한 버그가 프로덕션에 반영되는 경우

전환 시 패키지 구조 제안:
```
packages/
  shared/          # constants, types, validation
  supabase/        # migrations, functions
apps/
  mobile/          # React Native (현 앱 레포 src/)
  web/             # Next.js (현 웹 레포 src/)
```
