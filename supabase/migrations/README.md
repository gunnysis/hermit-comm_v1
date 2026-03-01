# Supabase 마이그레이션

DB 스키마와 RLS 정책은 **번호 순서대로** 적용해야 합니다.
Supabase CLI 사용 시 `supabase db push` 로 자동 적용됩니다.

## 마이그레이션 목록

| 파일 | 요약 |
|------|------|
| `001_schema.sql` | 통합 스키마: groups, boards, group_members, posts, comments, reactions, app_admin, 인덱스·CHECK·updated_at 트리거·소프트 삭제·뷰·스팸 방지·cleanup_orphan_group_members |
| `002_rls.sql` | RLS 정책: posts, comments, reactions, boards, groups, group_members, app_admin |
| `003_grants.sql` | anon/authenticated 권한 부여 + posts_with_like_count SELECT |
| `009_post_analysis.sql` | post_analysis 테이블, posts_with_like_count 뷰 재정의(emotions 포함) |
| `010_image_attachment.sql` | posts.image_url 컬럼 추가 |
| `011_emotion_trend_rpc.sql` | get_emotion_trend(days) RPC 함수 |
| `012_group_delete_rls.sql` | groups DELETE RLS, posts/comments board_id ON DELETE CASCADE |
| `013_fix_view_image_url.sql` | posts_with_like_count 뷰에 image_url 추가 |
| `014_recommend_posts_by_emotion.sql` | get_recommended_posts_by_emotion(post_id, limit) RPC |
| `015_webhook_analyze_post_trigger.sql` | posts INSERT 시 analyze-post Edge Function 호출 트리거 (pg_net) |
| `016_analyze_post_trigger_auth.sql` | 015 트리거 제거 → Database Webhook 사용 권장 |
| `017_storage_post_images.sql` | Storage 버킷 post-images 생성 및 RLS |
| `018_posts_webhook_trigger.sql` | posts INSERT 시 analyze-post 트리거 (supabase_functions.http_request) |
| `019_post_analysis_service_role_grant.sql` | post_analysis 테이블 service_role 쓰기 권한 |
| `020_service_role_full_grant.sql` | public 스키마 전체 service_role 권한 |
| `021_user_reactions.sql` | user_reactions 테이블 (사용자별 반응 추적, 연타 방지·취소) |
| `022_reactions_delete_policy.sql` | reactions DELETE RLS 정책 추가 |
| `023_fix_view_security_invoker.sql` | posts_with_like_count 뷰에 security_invoker = true 적용 |
| `20260223110128_remote_commit.sql` | Supabase CLI 자동 생성 스냅샷 (원격 수동 변경사항 캡처) |
| `20260301000000_fix_view_reaction_type.sql` | posts_with_like_count 뷰 reaction_type `'like'` 수정 + security_invoker 최종 확정 |

> 004~008 파일은 이 저장소에 없습니다. 원격 이력에 남아 있을 경우 `supabase migration repair --status reverted 004 005 006 007 008` 로 처리하세요.

## 스키마 요약

```
posts           — 게시글 (소프트 삭제, updated_at 자동 갱신)
comments        — 댓글 (소프트 삭제, updated_at 자동 갱신)
reactions       — 반응(좋아요) 집계 (reaction_type = 'like')
user_reactions  — 사용자별 반응 기록 (연타 방지·취소용)
boards          — 게시판 (공개/비공개, 익명 모드, group_id)
groups          — 그룹 (초대 코드 기반)
group_members   — 그룹 멤버십 (역할, 상태, 닉네임, 소프트 탈퇴 left_at)
app_admin       — 앱 관리자
post_analysis   — 게시글 감정 분석 결과 (Edge Function 자동 호출)
```

## 대시보드 수동 설정

### 관리자 등록
```sql
INSERT INTO app_admin (user_id) VALUES ('관리자-uuid');
```

### 기본 공개 게시판 생성
```sql
INSERT INTO boards (name, description, visibility, anon_mode)
VALUES ('자유게시판', '따뜻한 이야기를 나누는 곳', 'public', 'always_anon');
```

### Realtime 활성화
Database > Replication에서 `posts`, `comments`, `reactions` 테이블 활성화.

### 오래된 익명 사용자 정리 (선택, 주기적 실행)
```sql
SELECT public.cleanup_orphan_group_members(180);
```

## 참고 문서
- [docs/supabase_setup.md](../docs/supabase_setup.md)
- [supabase/functions/CONSOLE_SETUP.md](../functions/CONSOLE_SETUP.md) — Edge Function·Webhook 설정
