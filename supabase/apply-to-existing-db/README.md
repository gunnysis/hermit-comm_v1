# 기존 Supabase DB에 마이그레이션 적용

이 폴더는 이미 운영 중인 Supabase 프로젝트에 `migrations/` 스키마를 적용하기 위한 안내와 보조 스크립트입니다.

---

## 빠른 적용 (CLI)

```bash
# 프로젝트 루트에서, supabase link 된 상태에서
npm run db:push
# 또는
supabase db push
```

이미 적용된 마이그레이션은 자동으로 건너뛰고 미적용 항목만 순서대로 적용됩니다.

- 적용 전 상태 확인: `npm run db:migration-list`
- PowerShell 스크립트: `.\supabase\apply-to-existing-db\scripts\apply.ps1`

---

## 마이그레이션 목록

| 파일 | 내용 |
|------|------|
| `001_schema.sql` | 테이블: groups, boards, group_members, posts, comments, reactions, app_admin. 인덱스, CHECK, updated_at 트리거, 소프트 삭제, posts_with_like_count 뷰, 스팸 방지, cleanup_orphan_group_members |
| `002_rls.sql` | RLS: posts, comments, reactions, boards, groups, group_members, app_admin |
| `003_grants.sql` | anon/authenticated 권한 부여 + posts_with_like_count SELECT |
| `009_post_analysis.sql` | post_analysis 테이블, posts_with_like_count 뷰 재정의(emotions 포함) |
| `010_image_attachment.sql` | posts.image_url 컬럼 추가 |
| `011_emotion_trend_rpc.sql` | get_emotion_trend(days) RPC 함수 |
| `012_group_delete_rls.sql` | groups DELETE RLS, posts/comments board_id ON DELETE CASCADE |
| `013_fix_view_image_url.sql` | posts_with_like_count 뷰에 image_url 추가 |
| `014_recommend_posts_by_emotion.sql` | get_recommended_posts_by_emotion(post_id, limit) RPC |
| `015_webhook_analyze_post_trigger.sql` | posts INSERT 시 analyze-post Edge Function 호출 (pg_net) |
| `016_analyze_post_trigger_auth.sql` | 015 트리거 제거 → Database Webhook 사용 |
| `017_storage_post_images.sql` | Storage 버킷 post-images 생성 및 RLS |
| `018_posts_webhook_trigger.sql` | posts INSERT 시 analyze-post 트리거 (supabase_functions.http_request) |
| `019_post_analysis_service_role_grant.sql` | post_analysis service_role 쓰기 권한 |
| `020_service_role_full_grant.sql` | public 스키마 전체 service_role 권한 |
| `021_user_reactions.sql` | user_reactions 테이블 (연타 방지·취소) |
| `022_reactions_delete_policy.sql` | reactions DELETE RLS 정책 |
| `023_fix_view_security_invoker.sql` | posts_with_like_count 뷰 security_invoker = true |
| `20260223110128_remote_commit.sql` | CLI 자동 생성 스냅샷 — **수동 적용 불필요** |
| `20260301000000_fix_view_reaction_type.sql` | 뷰 reaction_type `'like'` 수정 + security_invoker 최종 확정 |

> 004~008 파일은 이 저장소에 없습니다. 원격 이력에 남아 있을 경우:
> ```bash
> supabase migration repair --status reverted 004 005 006 007 008
> ```

---

## 적용 전 상태 확인

### CLI (권장)
```bash
supabase migration list
```
Local, Remote 모두에 같은 번호가 있으면 이미 적용됨.

### SQL Editor
`check_applied.sql` 파일을 Supabase 대시보드 SQL Editor에서 실행하면 주요 객체 존재 여부를 확인할 수 있습니다.

---

## 수동 적용 (SQL Editor)

CLI를 사용할 수 없을 때 [APPLY_ORDER.txt](./APPLY_ORDER.txt) 순서대로 각 파일을 SQL Editor에서 실행합니다.

- `20260223110128_remote_commit.sql` 은 수동 적용하지 않아도 됩니다.
- 001~003이 이미 적용된 DB라면 009부터 진행합니다.

---

## 적용 후 수동 설정

자세한 내용은 [migrations/README.md](../migrations/README.md) 참고.

- **관리자 등록**: `INSERT INTO app_admin (user_id) VALUES ('uuid');`
- **기본 게시판**: `INSERT INTO boards ...`
- **Realtime**: Database > Replication에서 posts, comments, reactions 활성화
- **Edge Function·Webhook**: `supabase/functions/CONSOLE_SETUP.md` 참고
