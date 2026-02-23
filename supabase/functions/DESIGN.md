# Supabase Edge Functions — 개선 및 추천 기능 설계

## 1. 함수 이름 규칙 및 현재/권장 이름

### 1.1 명명 규칙

| 규칙 | 설명 | 예시 |
|------|------|------|
| **kebab-case** | Supabase 함수 폴더/URL은 소문자+하이픈 | `analyze-post`, `recommend-posts-by-emotion` |
| **역할 명시** | 동사-대상 또는 서비스-역할 | `analyze-post`, `get-emotion-trend` |
| **트리거 구분** | Webhook vs 수동 호출은 접미사로 구분 | `analyze-post` (Webhook), `analyze-post-on-demand` (수동) |

### 1.2 현재 함수 → 권장 이름

| 현재 이름 | 권장 이름 | 이유 |
|-----------|-----------|------|
| `analyze-post` | **유지** `analyze-post` | Webhook 트리거 감정 분석 — 이미 명확함 |
| `smart-service` | **`analyze-post-on-demand`** | “수동/fallback 감정 분석”을 이름만으로 이해 가능. `smart-service`는 역할이 불명확함 |

**마이그레이션 시**: 앱의 `SMART_SERVICE_FUNCTION` 상수와 Webhook URL만 새 이름으로 변경하면 됨.

---

## 2. 기존 함수 개선 사항

### 2.1 공통 구조 개선

- **CORS / 응답 헬퍼**: `_shared/http.ts` 도입  
  - `corsHeaders`, `jsonResponse(body, status)`, `optionsResponse()`  
  - 각 함수에서 중복 제거
- **에러 로깅**: `[함수명]` 접두어 유지, 구조화 로그(선택)  
  - `console.error('[analyze-post-on-demand]', { postId, reason: err.message })`
- **입력 검증**: Zod 등으로 body 스키마 검증(선택) — 타입 안전성·에러 메시지 통일

### 2.2 analyze-post (Webhook)

- **유지**: INSERT만 처리, 스키마/테이블/type 검증 유지
- **개선**: Webhook secret 검증 (Dashboard에서 설정한 `Authorization` 또는 `x-webhook-secret` 헤더 검증) — 보안 강화
- **개선**: 응답에 `idempotent: true` 등 메타데이터 포함 시 로그/디버깅 용이

### 2.3 smart-service → analyze-post-on-demand (수동 Fallback)

- **이름 변경**: `analyze-post-on-demand` 로 배포 후 앱/Webhook 문서 갱신
- **개선**: 짧은 쿨다운(예: 동일 `postId`에 대해 60초 내 재호출 방지) — 중복 분석·비용 절감
- **개선**: `post_analysis`에 이미 해당 `post_id` 존재 시 스킵 옵션 — 불필요한 API 호출 방지
- **개선**: 요청 본문에 `skipIfExists?: boolean` 추가(기본 true) — 이미 분석 있으면 200 + `{ ok: true, skipped: 'already_analyzed' }` 반환

---

## 3. 추천 기능 설계

### 3.1 “감정 기반 비슷한 글” 추천

- **목적**: 글 상세 화면 또는 목록에서 “이런 감정의 다른 글” 노출
- **입력**: `postId` (해당 글의 `post_analysis.emotions` 사용) 또는 직접 `emotions: string[]`
- **출력**: 동일/유사 감정이 붙은 다른 게시글 목록 (본문 제외, 제목·요약·like_count·emotions 등)
- **정렬**: 감정 일치 개수 → 좋아요 수 → 최신순
- **구현 위치**:  
  - **옵션 A**: Edge Function **`recommend-posts-by-emotion`**  
    - 입력 검증, 서비스 키로 `post_analysis`+`posts`(또는 뷰) 조회, 정렬·제한 후 JSON 반환  
  - **옵션 B**: DB RPC **`get_recommended_posts_by_emotion(post_id, limit)`**  
    - RLS 적용된 뷰/테이블만 사용하면 클라이언트에서 직접 RPC 호출 가능  
- **권장**: RPC로 구현하면 Edge Function 비용 없이 클라이언트가 직접 호출 가능. 복잡한 비즈니스 로직이나 외부 API가 필요하면 Edge Function 선택.

### 3.2 “오늘/이번 주 감정 트렌드” 노출

- **현황**: 이미 `get_emotion_trend(days)` RPC 존재, 앱에서 직접 호출 중
- **선택 개선**:  
  - 캐싱이 필요하면 Edge Function **`get-emotion-trend`** 래퍼 추가 (메모리/Redis 캐시 등)  
  - 현재는 RPC만으로 충분하다면 Edge Function 없이 유지 권장

### 3.3 추천 관련 함수 이름 정리

| 기능 | 권장 함수 이름 | 호출 주체 | 비고 |
|------|----------------|-----------|------|
| 감정 기반 비슷한 글 | `recommend-posts-by-emotion` (Edge) 또는 `get_recommended_posts_by_emotion` (RPC) | 앱 클라이언트 | postId 또는 emotions[] → 유사 글 목록 |
| 감정 트렌드(캐시 래퍼) | `get-emotion-trend` | 앱 클라이언트 | 필요 시에만 추가, 기본은 RPC 직접 호출 |

---

## 4. 폴더/함수 구조 권장 (최종)

```
supabase/functions/
├── _shared/
│   ├── analyze.ts          # 기존: 감정 분석 공통 로직
│   └── http.ts             # 신규(선택): CORS, jsonResponse, optionsResponse
├── analyze-post/
│   └── index.ts            # Webhook 전용 (이름 유지)
├── analyze-post-on-demand/
│   └── index.ts            # 수동 fallback (smart-service 대체)
├── recommend-posts-by-emotion/
│   └── index.ts            # 신규: 감정 기반 추천 (또는 RPC로 대체)
├── README.md
└── DESIGN.md               # 본 설계 문서
```

- `get-emotion-trend` Edge Function은 “캐시/제한이 필요할 때”만 추가하는 것을 권장.

---

## 5. 적용 순서 제안

1. **Phase 1 — 이름·구조**  
   - `smart-service` → `analyze-post-on-demand` 복사 후 배포  
   - 앱에서 `SMART_SERVICE_FUNCTION = 'analyze-post-on-demand'` 로 변경  
   - 기존 `smart-service`는 deprecated 후 제거

2. **Phase 2 — 동작 개선**  
   - `_shared/http.ts` 도입 후 두 분석 함수에 적용  
   - `analyze-post-on-demand`에 `skipIfExists` 및 쿨다운(선택) 적용

3. **Phase 3 — 추천**  
   - DB RPC `get_recommended_posts_by_emotion(post_id, limit)` 추가  
   - 또는 Edge Function `recommend-posts-by-emotion` 구현 후 앱에서 호출

4. **Phase 4 — 보안(선택)**  
   - Webhook용 secret 검증 (`analyze-post`)  
   - 필요 시 `get_emotion_trend` 호출 빈도 제한(rate limit)

---

## 6. 요약

- **함수 이름**: `analyze-post` 유지, `smart-service` → **`analyze-post-on-demand`** 로 변경 권장.
- **개선**: 공통 HTTP 헬퍼, fallback용 스킵/쿨다운, Webhook secret 검증(선택).
- **추천**: **감정 기반 비슷한 글** — `recommend-posts-by-emotion`(Edge) 또는 **`get_recommended_posts_by_emotion`**(RPC) 로 제공, 감정 트렌드는 기존 RPC 유지.

이 설계를 기준으로 단계별로 적용하면 된다.
