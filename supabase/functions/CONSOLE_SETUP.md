# Supabase 콘솔에서 Edge Functions 설정하기

이 문서는 **Supabase Dashboard(콘솔)** 에서 Edge Functions 배포·환경 변수·DB Webhook을 설정하는 방법을 정리합니다.

---

## 1. 전제 조건

- Supabase 프로젝트가 생성되어 있고, CLI로 연결된 상태 (`supabase link` 완료)
- 마이그레이션 001~016이 원격 DB에 적용된 상태 (`supabase db push` 또는 `npm run db:push` 완료). **016 적용 후 §4 Webhook 설정 필수**

---

## 2. Edge Functions 배포 (CLI)

콘솔에서 설정하기 전에, 먼저 **로컬에서 함수를 배포**해야 합니다.

```bash
# 프로젝트 루트에서
supabase functions deploy analyze-post
supabase functions deploy smart-service
supabase functions deploy analyze-post-on-demand
supabase functions deploy recommend-posts-by-emotion
```

배포가 끝나면 **Dashboard → Edge Functions** 에서 함수 목록이 보입니다.

---

## 3. 콘솔에서 환경 변수 설정

감정 분석 함수(`analyze-post`, `analyze-post-on-demand`)는 **Anthropic API 키**가 필요합니다.

### 3.1 경로

1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. 해당 **프로젝트** 선택
3. 왼쪽 메뉴 **Project Settings** (톱니바퀴) 클릭
4. **Edge Functions** 탭 선택

### 3.2 설정할 변수

| 변수명 | 값 | 필수 대상 함수 |
|--------|-----|----------------|
| `ANTHROPIC_API_KEY` | Anthropic에서 발급한 API 키 (예: `sk-ant-...`) | `analyze-post`, `analyze-post-on-demand`, `smart-service` |
| `ANTHROPIC_MODEL` | 사용할 Claude 모델 ID (예: `claude-haiku-4-5-20251001`). 미설정 시 기본값 `claude-haiku-4-5-20251001` 사용 | `analyze-post`, `analyze-post-on-demand` (선택) |

- **Add new secret** 버튼으로 위 변수를 추가합니다.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 Supabase가 **자동 주입**하므로 따로 넣지 않아도 됩니다.
- `recommend-posts-by-emotion`은 외부 API를 쓰지 않으므로 **추가 환경 변수 없음**.

### 3.3 주의

- API 키는 **Secret**으로 저장되며, 함수 로그/코드에 노출되지 않습니다.
- 키를 바꾼 경우 **동일 이름으로 다시 저장**한 뒤, 필요하면 해당 함수를 한 번 다시 배포합니다.

---

## 4. DB Webhook 설정 (게시글 작성 시 자동 감정 분석) — 필수

**마이그레이션 016부터** `posts` INSERT 시 자동으로 `analyze-post`를 호출하는 **DB 트리거는 제거**되어 있습니다.  
(pg_net 호출 시 인증이 필요해 트리거만으로는 401이 발생하므로, **Dashboard Webhook**을 사용합니다.)

**반드시** 아래 절차대로 **Database Webhook**을 한 번 설정하세요. 설정 후 새 게시글 작성 시에만 감정 분석이 자동 호출됩니다.

### 4.1 경로

1. Dashboard 왼쪽 **Database** 클릭
2. **Webhooks** 탭 선택
3. **Create a new hook** 클릭

### 4.2 항목별 입력

| 항목 | 입력 값 |
|------|----------|
| **Name** | `analyze-post-on-insert` (원하는 이름으로 가능) |
| **Table** | `posts` |
| **Events** | **Insert** 만 체크 |
| **Type** | **Supabase Edge Functions** 선택 |
| **Edge Function** | `analyze-post` 선택 |

### 4.3 저장 후 확인

- **Create webhook** 으로 저장합니다.
- 목록에 Webhook이 보이고, **Enabled** 상태인지 확인합니다.
- 새 게시글을 작성해 보면 `analyze-post`가 자동 호출되고, **Edge Functions → Logs** 에서 호출 이력을 볼 수 있습니다.

> **참고**: 016 적용 전(트리거 사용 시)에는 pg_net이 인증 없이 호출해 401이 나므로 감정 분석이 동작하지 않습니다. 016 적용 후에는 **반드시** 위 Webhook을 추가하세요.

> 로컬 개발(`supabase start`) 환경에서는 이 Webhook이 동작하지 않습니다. 프로덕션 Supabase 프로젝트에서만 적용됩니다.

---

## 5. 함수별 콘솔 설정 요약

| 함수 | 환경 변수 (Project Settings → Edge Functions) | Webhook (Database → Webhooks) |
|------|-----------------------------------------------|-------------------------------|
| `analyze-post` | `ANTHROPIC_API_KEY` | ✅ 필요 — **posts** 테이블 **Insert** → `analyze-post` |
| `smart-service` | `ANTHROPIC_API_KEY` | ❌ 없음 (앱에서 수동 호출) |
| `analyze-post-on-demand` | `ANTHROPIC_API_KEY` | ❌ 없음 (앱에서 수동 호출) |
| `recommend-posts-by-emotion` | 없음 | ❌ 없음 |

---

## 6. 배포·설정 후 확인

### 6.1 마이그레이션 적용 여부

```bash
npm run db:migration-list
```

- 001~015(및 016)가 **Local / Remote** 모두 표시되면 DB 적용 완료입니다.

### 6.2 Edge Function 로그

1. Dashboard → **Edge Functions**
2. 함수 이름 클릭 → **Logs** 탭
3. 최근 호출·에러 메시지를 확인할 수 있습니다.

### 6.3 Webhook 동작 확인

- 앱 또는 API로 **새 게시글**을 하나 작성합니다.
- **Edge Functions → analyze-post → Logs** 에서 해당 시각에 호출이 있는지 확인합니다.
- **Table Editor** 또는 SQL로 `post_analysis` 테이블에 해당 `post_id` 행이 생겼는지 확인합니다.

---

## 7. 문제 해결

| 현상 | 확인 사항 |
|------|-----------|
| `analyze-post`가 호출되지 않음 | **Database → Webhooks**에서 **posts / Insert** → `analyze-post` 연결 여부 및 **Enabled** 확인 |
| `missing_api_key` / 500 에러 | Project Settings → Edge Functions 에 `ANTHROPIC_API_KEY` 설정 여부 확인 |
| `recommend-posts-by-emotion` 에러 | 마이그레이션 014 적용 여부 확인 (`get_recommended_posts_by_emotion` RPC 존재 여부) |
| Webhook은 있는데 로그가 없음 | Webhook이 **Enabled** 인지, **Edge Function** 이름이 `analyze-post` 인지 확인 |

---

## 8. 참고

- 함수 코드·배포 방법: [README.md](./README.md)
- 개선·추천 설계: [DESIGN.md](./DESIGN.md)
- 마이그레이션 목록: [../migrations/README.md](../migrations/README.md)
