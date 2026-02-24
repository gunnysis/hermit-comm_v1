# Supabase 설정 (은둔마을)

## 디렉터리 구조

```
supabase/
├── config.toml              # 로컬/CLI 설정
├── migrations/               # DB 마이그레이션 (순서대로 적용)
│   ├── 001_schema.sql       # 통합 스키마
│   ├── 002_rls.sql          # RLS 정책
│   ├── 003_grants.sql       # 권한 부여
│   ├── 009_post_analysis.sql # 감정 분석·뷰
│   ├── 010_image_attachment.sql # posts.image_url
│   ├── 011_emotion_trend_rpc.sql # get_emotion_trend RPC
│   ├── 012_group_delete_rls.sql # 그룹 삭제 RLS·CASCADE
│   ├── 013_fix_view_image_url.sql # 뷰 image_url
│   ├── 014_recommend_posts_by_emotion.sql # 감정 기반 추천 RPC
│   ├── 015_webhook_analyze_post_trigger.sql # (선택) 감정 분석 트리거
│   ├── 016_analyze_post_trigger_auth.sql # 트리거 제거, Webhook 권장
│   ├── 017_storage_post_images.sql # Storage post-images 버킷
│   ├── 018_posts_webhook_trigger.sql # (선택) 감정 분석 트리거 대체
│   ├── 019_post_analysis_service_role_grant.sql # service_role post_analysis
│   ├── 020_service_role_full_grant.sql # service_role 전체 권한
│   ├── 021_user_reactions.sql # 사용자별 반응(user_reactions)
│   └── README.md            # 마이그레이션 요약
├── functions/               # Edge Functions (analyze-post 등)
├── apply-to-existing-db/   # 기존 DB에 마이그레이션 적용 (CLI 확인 기반)
│   ├── README.md            # 적용 순서·방법·CLI 확인
│   ├── check_applied.sql    # SQL Editor용 적용 여부 확인
│   ├── APPLY_ORDER.txt      # 수동 적용 시 파일 순서
│   ├── migration_list_reference.txt  # supabase migration list 출력 해석
│   └── scripts/
│       └── check_via_cli.ps1 # CLI로 적용 여부 확인 (PowerShell)
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
   - 적용 순서는 [apply-to-existing-db/README.md](apply-to-existing-db/README.md) 및 [apply-to-existing-db/APPLY_ORDER.txt](apply-to-existing-db/APPLY_ORDER.txt) 참고. (001 → … → 021)
   - 이미 적용된 항목은 [apply-to-existing-db/check_applied.sql](apply-to-existing-db/check_applied.sql)로 확인 후 건너뛸 수 있음.

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
| 001_schema.sql | groups, boards, group_members, posts, comments, reactions, app_admin, 인덱스·트리거·뷰·함수 |
| 002_rls.sql | RLS 정책 (auth.uid() 캐싱, 그룹 멤버십, 관리자 제한) |
| 003_grants.sql | anon/authenticated 권한 + posts_with_like_count SELECT |
| 009_post_analysis.sql | post_analysis 테이블, posts_with_like_count 뷰(emotions 포함) |
| 010_image_attachment.sql | posts.image_url 컬럼 |
| 011_emotion_trend_rpc.sql | get_emotion_trend(days) RPC |
| 012_group_delete_rls.sql | groups DELETE RLS, posts/comments board_id ON DELETE CASCADE |
| 013_fix_view_image_url.sql | posts_with_like_count 뷰에 image_url 추가 |
| 014_recommend_posts_by_emotion.sql | get_recommended_posts_by_emotion RPC |
| 015~016 | 감정 분석 트리거(선택) 및 제거 후 Database Webhook 권장 |
| 017_storage_post_images.sql | Storage post-images 버킷·RLS |
| 018~020 | (선택) 트리거 대체, service_role 권한 |
| 021_user_reactions.sql | user_reactions 테이블 (사용자별 반응) |

- 자세한 요약: [migrations/README.md](migrations/README.md)
- **기존 DB에 적용**: [apply-to-existing-db/README.md](apply-to-existing-db/README.md)
