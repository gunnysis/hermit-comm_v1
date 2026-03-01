-- =============================================================================
-- 20260301000000_fix_view_reaction_type.sql
--
-- 배경:
--   20260223110128_remote_commit.sql이 023_fix_view_security_invoker.sql보다
--   마이그레이션 순서상 뒤에 오기 때문에, 023의 security_invoker 설정이
--   remote_commit에 의해 덮어쓰여지는 문제가 있었음.
--
--   추가로, 원격 DB에서 view의 reaction_type이 '👍'(이모지)로 수동 변경되어
--   앱 코드(ReactionBar.tsx: type='like')와 불일치 → like_count 항상 0 버그 발생.
--
-- 해결:
--   1. reaction_type = 'like' 로 정정 (앱 코드와 일치)
--   2. security_invoker = true 재적용 (그룹 비멤버 RLS 우회 방지)
--   이 마이그레이션은 20260223110128 이후에 실행되므로 최종 상태를 보장함.
-- =============================================================================

CREATE OR REPLACE VIEW "public"."posts_with_like_count"
  WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.title,
  p.content,
  p.author,
  p.author_id,
  p.created_at,
  p.board_id,
  p.group_id,
  p.is_anonymous,
  p.display_name,
  p.member_id,
  p.image_url,
  (COALESCE(
    (SELECT SUM(r.count)
     FROM public.reactions r
     WHERE r.post_id = p.id AND r.reaction_type = 'like'),
    0
  ))::integer AS like_count,
  (SELECT COUNT(*)::integer
   FROM public.comments c
   WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count,
  pa.emotions
FROM public.posts p
LEFT JOIN public.post_analysis pa ON pa.post_id = p.id
WHERE p.deleted_at IS NULL;

-- 뷰 재생성 후 권한 재부여
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."posts_with_like_count" TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."posts_with_like_count" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."posts_with_like_count" TO service_role;
