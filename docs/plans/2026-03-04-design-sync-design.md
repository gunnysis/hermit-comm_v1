# 디자인 동기화 설계

> 작성일: 2026-03-04
> 배경: 앱 UI/UX 디자인 리팩토링 후, 웹 프로젝트와의 디자인 일관성 확보 방안

---

## 1. 현재 상태

### 1.1 동기화 인프라

| 카테고리 | SSoT 위치 | 동기화 방식 | 상태 |
|---------|----------|------------|------|
| DB 타입 | `supabase-hermit/shared/database.types.ts` | `sync-to-projects.sh` | 자동 |
| 감정 상수 | `supabase-hermit/shared/constants.generated.ts` | `sync-to-projects.sh` | 자동 |
| VALIDATION | 각 프로젝트 `constants.ts` | 수동 | 양쪽 유지 |
| 마이그레이션 | `supabase-hermit/supabase/migrations/` | `sync-to-projects.sh` | 자동 |
| 디자인 토큰 | **없음** (각자 정의) | **없음** | 불일치 |

### 1.2 앱 디자인 리팩토링에서 도입된 공유 가능 요소

1. **커스텀 색상 팔레트** (6종)
   - `happy` (#FFC300 계열), `coral` (#FF7366), `mint` (#19FFB2)
   - `lavender` (#C39BFF), `peach` (#FFAF66), `cream` (#FFEF99)

2. **반응 타입별 색상 매핑**
   - `like → happy`, `heart → coral`, `laugh → peach`, `sad → lavender`, `surprise → mint`

3. **감정 이모지 매핑** (`EMOTION_EMOJI`) — 이미 동기화됨

### 1.3 플랫폼별 스타일 차이

| 항목 | 앱 (React Native) | 웹 (Next.js) |
|------|-------------------|--------------|
| CSS 프레임워크 | NativeWind (Tailwind) | Tailwind CSS v4 |
| 색상 정의 | `tailwind.config.js` extend | CSS custom properties (OKLCH) |
| 컴포넌트 라이브러리 | 자체 컴포넌트 | shadcn/ui + Radix UI |
| 애니메이션 | React Native Animated | CSS transitions/animations |
| 블러 효과 | expo-blur (BlurView) | CSS backdrop-filter |

---

## 2. 선택한 접근방식: 공유 상수 확장 + 점진적 토큰화

### 2.1 즉시 (Phase 1): `constants.generated.ts` 확장

`supabase-hermit/shared/constants.generated.ts`에 디자인 관련 상수 추가:

```typescript
/** 반응 타입별 색상 계열 매핑 */
export const REACTION_COLOR_MAP = {
  like: 'happy',
  heart: 'coral',
  laugh: 'peach',
  sad: 'lavender',
  surprise: 'mint',
} as const;

export type ReactionColorKey = keyof typeof REACTION_COLOR_MAP;

/** 공유 색상 팔레트 (HEX) — 각 플랫폼에서 자체 방식으로 사용 */
export const SHARED_PALETTE = {
  happy:    { 50: '#FFF9E6', 100: '#FFF3CC', 200: '#FFE799', 300: '#FFDB66', 400: '#FFCF33', 500: '#FFC300', 600: '#CC9C00', 700: '#997500', 800: '#664E00', 900: '#332700' },
  coral:    { 50: '#FFF1F0', 100: '#FFE3E0', 200: '#FFC7C2', 300: '#FFABA3', 400: '#FF8F85', 500: '#FF7366', 600: '#E65C52', 700: '#CC453E', 800: '#B32E29', 900: '#991715' },
  mint:     { 50: '#F0FFF9', 100: '#D1FFF0', 200: '#A3FFE0', 300: '#75FFD1', 400: '#47FFC1', 500: '#19FFB2', 600: '#00E699', 700: '#00CC80', 800: '#00B366', 900: '#00994D' },
  lavender: { 50: '#F9F5FF', 100: '#F3EBFF', 200: '#E7D7FF', 300: '#DBC3FF', 400: '#CFAFFF', 500: '#C39BFF', 600: '#A77CE6', 700: '#8B5DCC', 800: '#6F3EB3', 900: '#531F99' },
  peach:    { 50: '#FFF7F0', 100: '#FFEFE0', 200: '#FFDFC2', 300: '#FFCFA3', 400: '#FFBF85', 500: '#FFAF66', 600: '#E69952', 700: '#CC833E', 800: '#B36D29', 900: '#995715' },
  cream:    { 50: '#FFFEF5', 100: '#FFFCEB', 200: '#FFF9D6', 300: '#FFF5C2', 400: '#FFF2AD', 500: '#FFEF99' },
} as const;
```

#### 앱에서 사용

`tailwind.config.js`에서 `SHARED_PALETTE`을 import하여 사용:

```javascript
const { SHARED_PALETTE } = require('./src/shared/lib/constants.generated');
module.exports = {
  theme: { extend: { colors: SHARED_PALETTE } },
};
```

`ReactionBar.tsx`에서 `REACTION_COLOR_MAP` import:

```typescript
import { REACTION_COLOR_MAP, SHARED_PALETTE } from '@/shared/lib/constants.generated';
const colorKey = REACTION_COLOR_MAP[type] ?? 'happy';
const colors = SHARED_PALETTE[colorKey];
```

#### 웹에서 사용

`globals.css`에서 CSS custom properties로 변환 (빌드 스크립트 또는 수동):

```css
:root {
  --color-happy-500: #FFC300;
  --color-coral-500: #FF7366;
  /* ... */
}
```

또는 Tailwind v4의 CSS-first 설정에서 직접 참조:

```css
@theme {
  --color-happy-500: #FFC300;
  --color-coral-500: #FF7366;
}
```

### 2.2 단기 (Phase 2): 웹 디자인 업데이트

앱에서 적용한 디자인 패턴을 웹에도 반영:

1. **반응 칩 색상화**: 웹 `ReactionBar`에 `REACTION_COLOR_MAP` 기반 색상 적용
2. **감정 태그 이모지**: 웹 `EmotionTags`에 `EMOTION_EMOJI` 매핑 반영 (이미 동기화됨)
3. **색상 팔레트**: 웹 CSS variables에 `SHARED_PALETTE` 값 반영

### 2.3 중기 (Phase 3): 디자인 토큰 JSON 전환 기준

아래 조건 중 2개 이상 충족 시 `design-tokens.json` 방식으로 전환:

- [ ] 색상 팔레트 변경이 분기당 2회 이상 발생
- [ ] 새로운 색상 계열 추가 (6종 → 8종 이상)
- [ ] 웹 디자인에서 앱과 다른 색상 사용으로 인한 혼란 보고

전환 시 구조:

```
supabase-hermit/
  shared/
    design-tokens.json        ← 색상·그림자·간격 등 토큰 정의
    scripts/
      generate-app-tokens.ts  ← JSON → tailwind.config.js extend
      generate-web-tokens.ts  ← JSON → CSS custom properties
```

---

## 3. 동기화 실행 절차

### 3.1 즉시 실행 (이번 작업)

```bash
# 1. supabase-hermit에서 constants.generated.ts 수정
cd ~/apps/supabase-hermit
# REACTION_COLOR_MAP + SHARED_PALETTE 추가

# 2. 동기화 실행
bash scripts/sync-to-projects.sh

# 3. 앱 tailwind.config.js 업데이트
# SHARED_PALETTE import → colors extend

# 4. 앱 ReactionBar.tsx 업데이트
# 로컬 ACTIVE_COLORS → REACTION_COLOR_MAP 전환

# 5. 웹 globals.css 업데이트
# SHARED_PALETTE 기반 CSS custom properties 추가
```

### 3.2 변경 시 체크리스트 (MULTIPROJECT.md에 추가)

```markdown
### 디자인 토큰 변경 시
- [ ] supabase-hermit `constants.generated.ts` 수정
- [ ] `sync-to-projects.sh` 실행
- [ ] 앱 tailwind.config.js에 반영 확인 (SHARED_PALETTE import)
- [ ] 웹 globals.css / tailwind 설정에 반영
- [ ] 반응 색상 매핑 변경 시 양쪽 ReactionBar 확인
```

---

## 4. 절대 동기화하지 않는 것 (변경 없음)

기존 원칙 유지:

| 파일 | 이유 |
|------|------|
| `anonymous.ts` 해시 알고리즘 | 변경 시 기존 사용자 별칭 전체 변경 |
| UI 컴포넌트 구현 | 플랫폼 특성 차이 (Animated vs CSS, BlurView vs backdrop-filter) |
| 애니메이션 상수 (duration, friction, tension) | 플랫폼별 최적값 다름 |

---

## 5. 결정 사항 요약

| 결정 | 선택 | 이유 |
|------|------|------|
| 접근방식 | 공유 상수 확장 (Phase 1) | 최소 변경, 기존 인프라 활용 |
| 색상 SSoT | `supabase-hermit/shared/constants.generated.ts` | 이미 동기화 파이프라인 존재 |
| Tailwind config | `SHARED_PALETTE` import | 색상 이원화 방지 |
| 모노레포 | 보류 | 현재 규모에서 과도한 복잡도 |
| 반응 색상 매핑 | `REACTION_COLOR_MAP` 공유 상수화 | 양쪽 UI 일관성 |
