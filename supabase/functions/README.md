# Supabase Edge Functions — 감정 분석 및 추천

## 함수 구조

```
supabase/functions/
├── _shared/
│   └── analyze.ts        # 공통 감정 분석 로직 (analyze-post, analyze-post-on-demand에서 공유)
├── analyze-post/
│   └── index.ts          # DB Webhook 자동 호출 전용
├── analyze-post-on-demand/
│   └── index.ts          # 앱 fallback 수동 호출 전용 (구 smart-service)
├── recommend-posts-by-emotion/
│   └── index.ts          # 감정 기반 비슷한 글 추천 (선택)
├── README.md
├── DESIGN.md             # 개선·추천 기능 설계 및 함수 이름 규칙
└── CONSOLE_SETUP.md      # Supabase 콘솔에서 함수·Webhook·환경 변수 설정 방법
```

**함수 이름 규칙**: kebab-case, 역할 명시. `smart-service` → **`analyze-post-on-demand`** 로 변경 권장 (설계: [DESIGN.md](./DESIGN.md)).

**콘솔 설정**: 배포 후 환경 변수·DB Webhook은 [CONSOLE_SETUP.md](./CONSOLE_SETUP.md) 참고.

---

## 두 함수의 역할 (감정 분석)

| 함수 | 호출 주체 | 페이로드 형식 |
|------|-----------|--------------|
| `analyze-post` | Supabase DB Webhook (자동) | `{ type, table, schema, record }` |
| `analyze-post-on-demand` (구 smart-service) | 앱 클라이언트 (수동 fallback) | `{ postId, content, title? }` |

**추천·개선 설계**: [DESIGN.md](./DESIGN.md) — 함수 이름 규칙, 개선 사항, 감정 기반 추천(`recommend-posts-by-emotion` / RPC) 정리.

**동작 흐름:**
1. 게시글 INSERT(공개·그룹 모두) → DB 트리거(015) 또는 Webhook → `analyze-post` 자동 실행
2. 앱 게시글 상세 화면 진입 후 14초 내 분석 결과 없음 → `analyze-post-on-demand` 자동 fallback

---

## 환경 변수 설정

### 로컬 개발 (`supabase/functions/.env`)
```bash
ANTHROPIC_API_KEY=sk-ant-...
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY는 로컬 supabase start 시 자동 주입
```

### 프로덕션 (Supabase Dashboard → Project Settings → Edge Functions)
| 변수명 | 값 |
|--------|-----|
| `ANTHROPIC_API_KEY` | Anthropic API 키 |

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 Supabase가 자동 주입하므로 별도 설정 불필요.

**상세 절차**: [CONSOLE_SETUP.md](./CONSOLE_SETUP.md) — 콘솔에서 환경 변수·Webhook 설정 방법.

---

## DB Webhook 설정 (Supabase Dashboard)

`analyze-post` 함수가 게시글 작성 시 자동으로 호출되려면 Webhook을 등록해야 한다.

**상세 절차**: [CONSOLE_SETUP.md](./CONSOLE_SETUP.md) §4 참고.

요약:
1. **Supabase Dashboard** → **Database** → **Webhooks** → **Create a new hook**
2. **Name**: `analyze-post-on-insert`, **Table**: `posts`, **Events**: **Insert**, **Type**: Supabase Edge Functions, **Edge Function**: `analyze-post`
3. **Create webhook** 저장

> Webhook은 프로덕션 Supabase 프로젝트에서만 동작한다. 로컬 `supabase start` 환경에서는 수동으로 함수를 호출해야 한다.

---

## 함수 배포

```bash
# 전체 배포
supabase functions deploy analyze-post
supabase functions deploy smart-service
supabase functions deploy analyze-post-on-demand   # 권장 이름 (구 smart-service)
supabase functions deploy recommend-posts-by-emotion

# 로컬 실행 (개발·테스트)
supabase functions serve analyze-post --env-file supabase/functions/.env
supabase functions serve smart-service --env-file supabase/functions/.env
supabase functions serve analyze-post-on-demand --env-file supabase/functions/.env
supabase functions serve recommend-posts-by-emotion --env-file supabase/functions/.env
```

**참고**: `recommend-posts-by-emotion`은 마이그레이션 `014_recommend_posts_by_emotion.sql`(RPC `get_recommended_posts_by_emotion`) 적용 후 사용.

---

## 공통 모듈 (`_shared/analyze.ts`)

| 항목 | 내용 |
|------|------|
| 감정 목록 | 고립감, 무기력, 불안, 외로움, 슬픔, 그리움, 두려움, 답답함, 설렘, 기대감, 안도감, 평온함, 즐거움 |
| 분석 모델 | `claude-haiku-4-5-20251001` |
| 최대 감정 수 | 3개 |
| 최소 텍스트 길이 | 10자 (미만 시 분석 스킵) |
| 유효성 검증 | Claude 응답에서 허용 목록 외 단어 자동 필터링 (hallucination 방지) |
| 중복 저장 방지 | `upsert(onConflict: 'post_id')` |
| 제목 포함 | 있을 때 `제목: ...\n\n내용: ...` 형태로 전달하여 정확도 향상 |

---

## 수동 테스트 (curl)

```bash
# analyze-post (Webhook 형식)
curl -X POST http://localhost:54321/functions/v1/analyze-post \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "posts",
    "schema": "public",
    "record": { "id": 1, "title": "오늘 너무 힘들었어", "content": "아무것도 하기 싫고 그냥 쉬고 싶다." },
    "old_record": null
  }'

# analyze-post-on-demand (구 smart-service, 직접 호출 형식)
curl -X POST http://localhost:54321/functions/v1/analyze-post-on-demand \
  -H "Content-Type: application/json" \
  -d '{
    "postId": 1,
    "title": "오늘 너무 힘들었어",
    "content": "아무것도 하기 싫고 그냥 쉬고 싶다."
  }'

# recommend-posts-by-emotion (감정 기반 추천, 마이그레이션 014 RPC 필요)
curl -X POST http://localhost:54321/functions/v1/recommend-posts-by-emotion \
  -H "Content-Type: application/json" \
  -d '{ "postId": 1, "limit": 5 }'
```
