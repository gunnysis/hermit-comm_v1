-- =============================================================================
-- 023_fix_view_security_invoker.sql
-- posts_with_like_count 뷰에 security_invoker = true 적용
--
-- 문제: 뷰는 기본적으로 뷰 소유자 권한으로 실행되어 RLS를 우회함.
--       그 결과 그룹 비멤버도 비공개 그룹 게시글을 조회할 수 있는
--       보안 취약점(SECURITY DEFINER 동작)이 존재했음.
--
-- 해결: security_invoker = true 옵션 추가.
--       이 옵션은 PostgreSQL 15+에서 지원되며, 쿼리를 실행하는
--       사용자의 RLS 정책을 그대로 적용함.
--       → 그룹 승인 멤버만 해당 그룹 게시글 열람 가능 (002_rls.sql 정책 준수).
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

-- 권한 재부여 (뷰 재생성 후 기존 권한 유지)
GRANT SELECT ON "public"."posts_with_like_count" TO anon, authenticated;
