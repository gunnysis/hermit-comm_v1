# Supabase 설정 (은둔마을)

## 디렉터리 구조

```
supabase/
├── config.toml          # 로컬/CLI 설정
├── migrations/           # DB 마이그레이션 (순서대로 적용)
│   ├── 001_initial_schema.sql
│   ├── 002_add_auth_and_rls.sql
│   └── 003_add_update_policies_and_views.sql
└── README.md
```

## 초기 설정 (Init)

### 1. Supabase CLI 설치

```bash
# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 또는 npm
npm install -g supabase
```

### 2. 이미 설정된 경우

- `config.toml`이 있으면 **추가 init 불필요**
- 원격 프로젝트와 연결: `supabase link --project-ref <프로젝트-ref>`

### 3. 로컬에서 DB 실행 (선택)

```bash
supabase start
# 마이그레이션이 자동 적용됨

supabase stop   # 종료 시
```

## 마이그레이션 적용 방법

### A. 원격(호스팅) Supabase에 적용

1. **대시보드 SQL Editor**
   - [Supabase Dashboard](https://app.supabase.com) → 프로젝트 → SQL Editor
   - `001_initial_schema.sql` 내용 붙여넣기 → Run
   - 그다음 `002_add_auth_and_rls.sql` 실행
   - 그다음 `003_add_update_policies_and_views.sql` 실행

2. **CLI로 푸시 (연결 후)**

   ```bash
   supabase link --project-ref <프로젝트-ref>
   supabase db push
   ```

### B. 로컬 Supabase에 적용

```bash
supabase start
# migrations/ 폴더가 자동 적용됨
```

## 필수 대시보드 설정

1. **Authentication → Providers**  
   - **Anonymous Sign-in** 활성화

2. **Database → Replication**  
   - `posts`, `comments`, `reactions` 테이블 Realtime 활성화

## 마이그레이션 순서

| 파일 | 내용 |
|------|------|
| 001_initial_schema.sql | posts, comments, reactions 테이블 + RLS(전체 허용) |
| 002_add_auth_and_rls.sql | author_id 추가, 익명 인증 기반 RLS로 변경 |
| 003_add_update_policies_and_views.sql | posts/comments UPDATE 정책, posts_with_like_count 뷰(인기순 정렬용) |

**주의:** 002 실행 전에 기존 데이터가 있으면 `author_id`용 UPDATE를 먼저 실행한 뒤 `NOT NULL` 제약을 걸어야 합니다.
